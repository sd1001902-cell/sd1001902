"""审核一个视频的完整流程：读信息 → 抽帧 → 语音文字 → 分段交给模型 → 合并出结论。"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Callable

from .media import Frame, VideoInfo, effective_interval, extract_frames, probe
from .moderator import (
    DEFAULT_EFFORT, DEFAULT_MODEL, Chunk, ChunkResult, Moderator, make_chunks,
)
from .policy import Policy
from .transcript import Segment, load_subtitles, transcribe, whisper_available
from .util import add_usage, estimate_cost
from .verdict import Finding, decide, merge_findings


@dataclass
class AuditOptions:
    model: str = DEFAULT_MODEL
    effort: str = DEFAULT_EFFORT
    interval: float = 2.0  # 秒
    max_frames: int = 120
    scene_threshold: float = 0.3  # 0 关闭镜头切换补帧
    max_side: int = 1024  # 送给模型的图长边像素
    frames_per_request: int = 12
    concurrency: int = 4
    use_fallback: bool = True
    audio: str = "auto"  # auto：装了 faster-whisper 就转写；whisper：必须转写；off：不审语音
    subtitles: str | None = None
    whisper_model: str = "small"
    language: str | None = None


@dataclass
class AuditResult:
    info: VideoInfo
    options: AuditOptions
    policy_name: str
    frames: list[Frame]
    interval: float
    transcript: list[Segment] | None
    audio_note: str
    chunks: list[ChunkResult]
    findings: list[Finding]
    verdict: str
    reasons: list[str]
    usage: dict
    cost_usd: float | None
    models_used: list[str]
    started_at: str
    elapsed_s: float
    notes: list[str] = field(default_factory=list)


def _load_transcript(info: VideoInfo, opts: AuditOptions, log) -> tuple[list[Segment] | None, str]:
    if opts.subtitles:
        segs = load_subtitles(opts.subtitles)
        return segs, f"字幕文件（{len(segs)} 条）"
    if opts.audio == "off":
        return None, "未审核（已关闭语音审核）"
    if not info.has_audio:
        return [], "无音轨"
    if not whisper_available():
        if opts.audio == "whisper":
            raise RuntimeError("要求转写语音，但没有安装 faster-whisper：pip install faster-whisper")
        return None, "未审核（没有安装 faster-whisper，也没有提供字幕）"
    log("  转写语音中（faster-whisper，本机运行）…")
    segs = transcribe(info.path, model_size=opts.whisper_model, language=opts.language)
    return segs, f"本机转写（faster-whisper {opts.whisper_model}，{len(segs)} 句）"


def prepare(path: str | Path, opts: AuditOptions, workdir: str | Path, log: Callable = print):
    info = probe(path)
    log(f"  时长 {info.duration:.1f} 秒，{info.width}×{info.height}，{'有' if info.has_audio else '无'}音轨")
    frames = extract_frames(
        info, Path(workdir) / "frames",
        interval=opts.interval, max_frames=opts.max_frames,
        scene_threshold=opts.scene_threshold, max_side=opts.max_side,
    )
    interval = effective_interval(info.duration, opts.interval, opts.max_frames)
    log(f"  抽取 {len(frames)} 帧（约每 {interval:.1f} 秒一帧，另加镜头切换处）")
    transcript, audio_note = _load_transcript(info, opts, log)
    log(f"  语音：{audio_note}")
    chunks = make_chunks(frames, info.duration, opts.frames_per_request)
    return info, frames, interval, transcript, audio_note, chunks


def run_chunks(moderator: Moderator, chunks: list[Chunk], info, transcript, concurrency: int, log) -> list[ChunkResult]:
    total = len(chunks)
    results: list[ChunkResult | None] = [None] * total

    def done(r: ChunkResult) -> None:
        results[r.chunk] = r
        status = {"ok": f"{len(r.findings)} 处疑点", "refused": "模型拒绝", "error": "失败"}[r.status]
        log(f"  第 {r.chunk + 1}/{total} 段：{status}" + (f"（{r.message}）" if r.message else ""))

    if not chunks:
        return []
    # 先单独跑第一段，把规则写进提示缓存，后面并发的请求就能命中缓存
    done(moderator.review(chunks[0], info, transcript, total))
    if total > 1:
        pool = ThreadPoolExecutor(max_workers=max(1, concurrency))
        try:
            futures = [pool.submit(moderator.review, c, info, transcript, total) for c in chunks[1:]]
            for fut in as_completed(futures):
                done(fut.result())
        except BaseException:
            pool.shutdown(wait=False, cancel_futures=True)
            raise
        pool.shutdown()
    return [r for r in results if r is not None]


def audit_video(
    path: str | Path,
    policy: Policy,
    opts: AuditOptions,
    client,
    workdir: str | Path,
    log: Callable = print,
) -> AuditResult:
    started = datetime.now().astimezone()
    t0 = time.monotonic()
    info, frames, interval, transcript, audio_note, chunks = prepare(path, opts, workdir, log)

    moderator = Moderator(
        client, policy, model=opts.model, effort=opts.effort, use_fallback=opts.use_fallback,
    )
    results = run_chunks(moderator, chunks, info, transcript, opts.concurrency, log)

    frame_times = {f.index: f.time for f in frames}
    gap = max(3.0, interval * 1.5)
    findings = merge_findings(results, policy, frame_times, info.duration, gap)
    verdict, reasons = decide(findings, results)

    usage: dict = {}
    for r in results:
        add_usage(usage, r.usage)
    models_used = sorted({r.model for r in results if r.model})
    notes = []
    if transcript is None:
        notes.append(f"语音{audio_note}：只审核了画面和画面里的文字。")
    extra_models = [m for m in models_used if m != opts.model]
    if extra_models:
        notes.append(f"部分段落由备用模型完成：{', '.join(extra_models)}（主模型拒答后自动切换）。")

    return AuditResult(
        info=info,
        options=opts,
        policy_name=policy.name,
        frames=frames,
        interval=interval,
        transcript=transcript,
        audio_note=audio_note,
        chunks=results,
        findings=findings,
        verdict=verdict,
        reasons=reasons,
        usage=usage,
        cost_usd=estimate_cost(opts.model, usage) if not extra_models else None,
        models_used=models_used,
        started_at=started.isoformat(timespec="seconds"),
        elapsed_s=round(time.monotonic() - t0, 1),
        notes=notes,
    )
