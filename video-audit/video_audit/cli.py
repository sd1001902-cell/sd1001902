"""命令行入口：python -m video_audit 视频或文件夹 …"""

from __future__ import annotations

import argparse
import csv
import sys
import tempfile
from pathlib import Path

from . import __version__
from .media import MediaError, require_ffmpeg
from .moderator import DEFAULT_EFFORT, DEFAULT_MODEL, EFFORTS, FatalAPIError, Moderator
from .pipeline import AuditOptions, audit_video, prepare
from .policy import PolicyError, load_policy
from .report import write_html, write_json
from .util import PRICES, fmt_time
from .verdict import PASS, REJECT, REVIEW, VERDICT_LABELS

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi", ".flv", ".wmv", ".ts", ".3gp", ".mpg", ".mpeg"}
EXIT_CODES = {PASS: 0, REVIEW: 1, REJECT: 2, "error": 3}


def find_videos(inputs: list[str]) -> list[Path]:
    found: list[Path] = []
    for item in inputs:
        p = Path(item)
        if p.is_dir():
            found += sorted(f for f in p.rglob("*") if f.is_file() and f.suffix.lower() in VIDEO_EXTS)
        elif p.is_file():
            found.append(p)
        else:
            raise FileNotFoundError(f"找不到：{item}")
    unique, seen = [], set()
    for f in found:
        key = f.resolve()
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def sibling_subtitles(video: Path) -> str | None:
    for ext in (".srt", ".vtt"):
        cand = video.with_suffix(ext)
        if cand.is_file():
            return str(cand)
    return None


def report_stem(video: Path, used: set[str]) -> str:
    stem, n = video.stem, 2
    name = stem
    while name in used:
        name = f"{stem}_{n}"
        n += 1
    used.add(name)
    return name


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m video_audit",
        description="自动审核视频内容：抽帧 + 语音文字，交给 Claude 按规则检查，输出 通过 / 人工复核 / 不通过。",
        epilog="退出码：0 全部通过，1 有需要人工复核的，2 有不通过的，3 有视频处理失败。",
    )
    p.add_argument("inputs", nargs="+", help="视频文件或文件夹（文件夹会递归查找视频）")
    p.add_argument("-o", "--out", default="audit-reports", help="报告输出目录（默认 audit-reports）")
    p.add_argument("--policy", help="审核规则文件（默认用自带的 policy.yaml）")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude 模型（默认 {DEFAULT_MODEL}）")
    p.add_argument("--effort", default=DEFAULT_EFFORT, choices=EFFORTS, help=f"思考力度（默认 {DEFAULT_EFFORT}）")
    p.add_argument("--interval", type=float, default=2.0, help="每隔几秒抽一帧（默认 2）")
    p.add_argument("--max-frames", type=int, default=120, help="每个视频最多抽几帧，超出会自动拉大间隔（默认 120）")
    p.add_argument("--scene", type=float, default=0.3, help="镜头切换灵敏度，0 关闭补帧（默认 0.3）")
    p.add_argument("--max-side", type=int, default=1024, help="送审图片长边像素（默认 1024）")
    p.add_argument("--batch-frames", type=int, default=12, help="每次请求送几帧（默认 12）")
    p.add_argument("--concurrency", type=int, default=4, help="同时发几个请求（默认 4）")
    p.add_argument("--subtitles", help="字幕文件 SRT/VTT（只审一个视频时可用；否则自动找同名 .srt/.vtt）")
    p.add_argument("--audio", default="auto", choices=("auto", "whisper", "off"),
                   help="语音审核：auto 装了 faster-whisper 就转写（默认）；whisper 必须转写；off 不审语音")
    p.add_argument("--whisper-model", default="small", help="faster-whisper 模型大小（默认 small）")
    p.add_argument("--language", help="语音语言代码，如 zh、vi、en（默认自动识别）")
    p.add_argument("--no-fallback", action="store_true", help="主模型拒答时不自动换备用模型")
    p.add_argument("--dry-run", action="store_true", help="只抽帧和估算请求量、费用，不调用 API")
    p.add_argument("-q", "--quiet", action="store_true", help="只输出每个视频的结论")
    p.add_argument("--version", action="version", version=f"video-audit {__version__}")
    return p


def dry_run(video: Path, opts: AuditOptions, policy, log) -> None:
    with tempfile.TemporaryDirectory(prefix="video-audit-") as tmp:
        info, frames, _interval, transcript, _note, chunks = prepare(video, opts, tmp, log)
    scale = min(1.0, opts.max_side / max(info.width, info.height, 1))
    img_tokens = int(info.width * scale * info.height * scale / 750)
    system_tokens = len(Moderator(None, policy, model=opts.model, effort=opts.effort).system)
    text_tokens = sum(len(s.text) for s in transcript or []) + 60 * len(frames)
    input_tokens = img_tokens * len(frames) + text_tokens
    log(f"  计划：{len(chunks)} 次请求，每帧约 {img_tokens} token，"
        f"图片+文字约 {input_tokens:,} 输入 token，另有规则约 {system_tokens:,} token（第一次之后走缓存）")
    price = PRICES.get(opts.model)
    if price:
        low = (input_tokens * price[0] + system_tokens * (price[3] + price[2] * (len(chunks) - 1))
               + 800 * len(chunks) * price[1]) / 1e6
        high = low + 3000 * len(chunks) * price[1] / 1e6
        log(f"  粗估费用：${low:.3f} – ${high:.3f}（{opts.model}，输出和思考量不同，实际以账单为准）")


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, flush=True))

    try:
        require_ffmpeg()
        policy = load_policy(args.policy)
        videos = find_videos(args.inputs)
    except (MediaError, PolicyError, FileNotFoundError) as e:
        print(f"错误：{e}", file=sys.stderr)
        return EXIT_CODES["error"]
    if not videos:
        print("错误：没有找到视频文件", file=sys.stderr)
        return EXIT_CODES["error"]
    if args.subtitles and len(videos) > 1:
        print("错误：--subtitles 只能和单个视频一起用（多个视频请把字幕放在视频旁边、同名）", file=sys.stderr)
        return EXIT_CODES["error"]

    base_opts = dict(
        model=args.model, effort=args.effort, interval=args.interval, max_frames=args.max_frames,
        scene_threshold=args.scene, max_side=args.max_side, frames_per_request=args.batch_frames,
        concurrency=args.concurrency, use_fallback=not args.no_fallback, audio=args.audio,
        whisper_model=args.whisper_model, language=args.language,
    )

    if args.dry_run:
        for v in videos:
            log(f"\n▶ {v}")
            try:
                opts = AuditOptions(**base_opts, subtitles=args.subtitles or sibling_subtitles(v))
                dry_run(v, opts, policy, log)
            except Exception as e:  # noqa: BLE001
                log(f"  失败：{e}")
        return 0

    import anthropic

    client = anthropic.Anthropic(max_retries=4)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    used: set[str] = set()
    rows = []
    worst = 0
    for n, video in enumerate(videos, 1):
        log(f"\n▶ [{n}/{len(videos)}] {video}")
        opts = AuditOptions(**base_opts, subtitles=args.subtitles or sibling_subtitles(video))
        stem = report_stem(video, used)
        try:
            with tempfile.TemporaryDirectory(prefix="video-audit-") as tmp:
                result = audit_video(video, policy, opts, client, tmp, log)
                json_path, html_path = out_dir / f"{stem}.audit.json", out_dir / f"{stem}.audit.html"
                write_json(result, json_path)
                write_html(result, html_path)
        except FatalAPIError as e:
            print(f"错误：{e}", file=sys.stderr)
            return EXIT_CODES["error"]
        except Exception as e:  # noqa: BLE001 —— 一个视频出错不影响其它视频
            print(f"  ✗ {video}：处理失败：{e}", file=sys.stderr)
            rows.append([str(video), "error", "处理失败", "", "", "", str(e)])
            worst = max(worst, EXIT_CODES["error"])
            continue

        counted = [f for f in result.findings if f.decision != "ignored"]
        cats = "、".join(dict.fromkeys(f.category_name for f in counted))
        print(f"  {'✓' if result.verdict == PASS else '!'} {VERDICT_LABELS[result.verdict]}  "
              f"{video.name}  {cats}  → {html_path}", flush=True)
        rows.append([
            str(video), result.verdict, VERDICT_LABELS[result.verdict], fmt_time(result.info.duration),
            len(counted), cats, str(html_path),
        ])
        worst = max(worst, EXIT_CODES[result.verdict])

    summary = out_dir / "summary.csv"
    with summary.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["文件", "结论代码", "结论", "时长", "疑点数", "疑点类别", "报告 / 错误"])
        w.writerows(rows)
    log(f"\n汇总：{summary}")
    return worst


if __name__ == "__main__":
    sys.exit(main())
