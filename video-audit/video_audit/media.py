"""读取视频信息、抽帧（ffmpeg / ffprobe）。"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


class MediaError(RuntimeError):
    """视频无法读取或处理。"""


@dataclass
class VideoInfo:
    path: str
    duration: float
    width: int
    height: int
    fps: float
    has_audio: bool
    size_bytes: int
    format_name: str
    start_time: float = 0.0


@dataclass
class Frame:
    index: int  # 全片从 0 开始的帧编号（只计抽出来的帧）
    time: float  # 秒
    path: Path  # 送给模型看的图
    thumb: Path  # 报告里的小图


def require_ffmpeg() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            raise MediaError(f"找不到 {tool}：请先安装 ffmpeg（5.1 或更新），并确保它在 PATH 里")


def _to_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _parse_rate(rate: str | None) -> float:
    if not rate or rate in ("0/0", "N/A"):
        return 0.0
    if "/" in rate:
        num, den = rate.split("/", 1)
        den_f = _to_float(den)
        return _to_float(num) / den_f if den_f else 0.0
    return _to_float(rate)


def _rotation(stream: dict) -> int:
    for item in stream.get("side_data_list") or []:
        if "rotation" in item:
            return int(_to_float(item["rotation"]))
    return int(_to_float((stream.get("tags") or {}).get("rotate")))


def probe(path: str | Path) -> VideoInfo:
    path = Path(path)
    if not path.is_file():
        raise MediaError(f"文件不存在：{path}")
    cmd = [
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_format", "-show_streams", str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise MediaError(f"无法读取视频：{proc.stderr.strip()[-500:]}")
    data = json.loads(proc.stdout or "{}")
    streams = data.get("streams") or []
    fmt = data.get("format") or {}
    video = next(
        (
            s for s in streams
            if s.get("codec_type") == "video"
            and not (s.get("disposition") or {}).get("attached_pic")
        ),
        None,
    )
    if video is None:
        raise MediaError("文件里没有视频画面")
    duration = _to_float(fmt.get("duration")) or _to_float(video.get("duration"))
    if duration <= 0:
        raise MediaError("无法确定视频时长")
    width, height = int(video.get("width") or 0), int(video.get("height") or 0)
    if abs(_rotation(video)) in (90, 270):
        width, height = height, width
    return VideoInfo(
        path=str(path),
        duration=duration,
        width=width,
        height=height,
        fps=_parse_rate(video.get("avg_frame_rate")) or _parse_rate(video.get("r_frame_rate")),
        has_audio=any(s.get("codec_type") == "audio" for s in streams),
        size_bytes=path.stat().st_size,
        format_name=fmt.get("format_name", ""),
        start_time=_to_float(fmt.get("start_time")),
    )


def effective_interval(duration: float, interval: float, max_frames: int) -> float:
    """视频太长时自动拉大抽帧间隔，保证定时抽帧不超过 max_frames。"""
    interval = max(float(interval), 0.1)
    if max_frames > 0:
        interval = max(interval, duration / max_frames)
    return interval


def _fit_long_side(limit: int) -> str:
    # 长边不超过 limit，小视频不放大；-2 保持比例并取偶数
    return (
        f"scale=w='if(gte(iw,ih),min(iw,{limit}),-2)'"
        f":h='if(gte(iw,ih),-2,min(ih,{limit}))'"
    )


_PTS_RE = re.compile(r"Parsed_showinfo.*?\bpts_time:\s*([-0-9.]+)")


def extract_frames(
    info: VideoInfo,
    out_dir: str | Path,
    *,
    interval: float = 2.0,
    max_frames: int = 120,
    scene_threshold: float = 0.3,
    max_side: int = 1024,
    thumb_side: int = 320,
) -> list[Frame]:
    """按固定间隔抽帧，镜头切换处额外补一帧。一次解码同时出大图和缩略图。"""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    step = effective_interval(info.duration, interval, max_frames)
    min_gap = min(1.0, step / 2)
    pick = f"gte(t-prev_selected_t,{step:.3f})"
    if scene_threshold > 0:
        pick += f"+gt(scene,{scene_threshold:.3f})*gte(t-prev_selected_t,{min_gap:.3f})"
    select = f"select='if(isnan(prev_selected_t),1,{pick})'"
    graph = (
        f"[0:v]{select},showinfo,split=2[a][b];"
        f"[a]{_fit_long_side(max_side)}[big];"
        f"[b]{_fit_long_side(thumb_side)}[small]"
    )
    cmd = [
        "ffmpeg", "-hide_banner", "-nostdin", "-nostats", "-loglevel", "info", "-y",
        "-i", info.path,
        "-filter_complex", graph,
        "-map", "[big]", "-fps_mode", "vfr", "-q:v", "3", str(out_dir / "frame_%05d.jpg"),
        "-map", "[small]", "-fps_mode", "vfr", "-q:v", "5", str(out_dir / "thumb_%05d.jpg"),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
    if proc.returncode != 0:
        raise MediaError(f"抽帧失败：{proc.stderr.strip()[-800:]}")

    times = [max(0.0, _to_float(t) - info.start_time) for t in _PTS_RE.findall(proc.stderr)]
    bigs = sorted(out_dir.glob("frame_*.jpg"))
    thumbs = sorted(out_dir.glob("thumb_*.jpg"))
    count = min(len(times), len(bigs), len(thumbs))
    if count == 0:
        raise MediaError("没有抽到任何画面（视频可能已损坏）")
    frames = [
        Frame(index=i, time=times[i], path=bigs[i], thumb=thumbs[i]) for i in range(count)
    ]
    # 镜头切换补帧可能让总数超出上限：均匀抽稀，保留首尾
    if max_frames > 0 and len(frames) > max_frames:
        if max_frames == 1:
            keep = [0]
        else:
            keep = sorted({round(i * (len(frames) - 1) / (max_frames - 1)) for i in range(max_frames)})
        frames = [frames[k] for k in keep]
        frames = [Frame(index=i, time=f.time, path=f.path, thumb=f.thumb) for i, f in enumerate(frames)]
    return frames
