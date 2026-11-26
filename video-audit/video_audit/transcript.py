"""语音文字：读字幕文件（SRT / VTT），或用 faster-whisper 本地转写。"""

from __future__ import annotations

import importlib.util
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Segment:
    start: float
    end: float
    text: str


_TS = r"(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})"
_CUE_RE = re.compile(rf"{_TS}\s*-->\s*{_TS}")
_TAG_RE = re.compile(r"<[^>]+>|\{\\[^}]*\}")


def _secs(h, m, s, ms) -> float:
    return int(h or 0) * 3600 + int(m) * 60 + int(s) + int(ms.ljust(3, "0")) / 1000


def load_subtitles(path: str | Path) -> list[Segment]:
    """解析 SRT 或 WebVTT 字幕。"""
    text = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    segments: list[Segment] = []
    for block in re.split(r"\r?\n\s*\r?\n", text):
        lines = [ln.strip() for ln in block.strip().splitlines()]
        for i, line in enumerate(lines):
            m = _CUE_RE.search(line)
            if not m:
                continue
            start = _secs(*m.groups()[:4])
            end = _secs(*m.groups()[4:])
            body = " ".join(_TAG_RE.sub("", ln) for ln in lines[i + 1:] if ln).strip()
            if body:
                segments.append(Segment(start, max(end, start), body))
            break
    segments.sort(key=lambda s: s.start)
    return segments


def whisper_available() -> bool:
    return importlib.util.find_spec("faster_whisper") is not None


def transcribe(path: str | Path, *, model_size: str = "small", language: str | None = None) -> list[Segment]:
    """用 faster-whisper 在本机转写音轨（不调用任何在线服务）。"""
    from faster_whisper import WhisperModel  # 可选依赖

    model = WhisperModel(model_size, device="auto", compute_type="default")
    segments, _info = model.transcribe(str(path), language=language or None, vad_filter=True)
    return [Segment(s.start, s.end, s.text.strip()) for s in segments if s.text.strip()]


def segments_between(segments: list[Segment], start: float, end: float) -> list[Segment]:
    """和 [start, end) 有重叠的语音段。"""
    return [s for s in segments if s.end >= start and s.start < end]
