"""合并各段的发现，给出最终结论：通过 / 人工复核 / 不通过。"""

from __future__ import annotations

from dataclasses import dataclass, field

from .moderator import ChunkResult, RawFinding
from .policy import Policy
from .util import fmt_range

PASS, REVIEW, REJECT = "pass", "review", "reject"
VERDICT_LABELS = {PASS: "通过", REVIEW: "人工复核", REJECT: "不通过"}
SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2}
SEVERITY_LABELS = {"low": "轻微", "medium": "中等", "high": "严重"}
SOURCE_LABELS = {"visual": "画面", "on_screen_text": "画面文字", "speech": "语音"}


@dataclass
class Finding:
    category: str
    category_name: str
    action: str
    severity: str
    confidence: float
    start: float
    end: float
    sources: list[str] = field(default_factory=list)
    evidence: list[str] = field(default_factory=list)
    frames: list[int] = field(default_factory=list)
    decision: str = REVIEW  # reject / review / ignored

    def label(self) -> str:
        return (
            f"{self.category_name}（{SEVERITY_LABELS.get(self.severity, self.severity)}，"
            f"置信度 {self.confidence:.2f}）@ {fmt_range(self.start, self.end)}"
        )


def _time_range(raw: RawFinding, frame_times: dict[int, float], duration: float) -> tuple[float, float, list[int]]:
    frames = sorted({i for i in raw.frame_indices if i in frame_times})

    def clamp(t: float) -> float:
        return min(max(0.0, t), duration)

    model_range = sorted((clamp(raw.start_time), clamp(raw.end_time)))
    if raw.source == "speech" or not frames:
        return model_range[0], model_range[1], frames
    times = [frame_times[i] for i in frames]
    return min(times), max(times), frames


def merge_findings(
    results: list[ChunkResult],
    policy: Policy,
    frame_times: dict[int, float],
    duration: float,
    gap: float,
) -> list[Finding]:
    """同一类别、时间相邻（间隔不超过 gap 秒）的发现合并成一条。"""
    items: list[Finding] = []
    for r in results:
        for raw in r.findings:
            cat = policy.get(raw.category)
            start, end, frames = _time_range(raw, frame_times, duration)
            items.append(
                Finding(
                    category=cat.id,
                    category_name=cat.name,
                    action=cat.action,
                    severity=raw.severity if raw.severity in SEVERITY_RANK else "medium",
                    confidence=raw.confidence,
                    start=start,
                    end=end,
                    sources=[raw.source],
                    evidence=[raw.evidence.strip()] if raw.evidence.strip() else [],
                    frames=frames,
                )
            )

    merged: list[Finding] = []
    for f in sorted(items, key=lambda x: (x.category, x.start, x.end)):
        last = merged[-1] if merged else None
        if last and last.category == f.category and f.start <= last.end + gap:
            last.end = max(last.end, f.end)
            if SEVERITY_RANK[f.severity] > SEVERITY_RANK[last.severity]:
                last.severity = f.severity
            last.confidence = max(last.confidence, f.confidence)
            last.sources += [s for s in f.sources if s not in last.sources]
            last.evidence += [e for e in f.evidence if e not in last.evidence]
            last.frames = sorted(set(last.frames) | set(f.frames))
        else:
            merged.append(f)

    for f in merged:
        if f.confidence < policy.review_confidence:
            f.decision = "ignored"
        elif f.action == REJECT and f.severity == "high" and f.confidence >= policy.reject_confidence:
            f.decision = REJECT
        else:
            f.decision = REVIEW

    order = {REJECT: 0, REVIEW: 1, "ignored": 2}
    merged.sort(key=lambda f: (order[f.decision], f.start))
    return merged


def decide(findings: list[Finding], results: list[ChunkResult]) -> tuple[str, list[str]]:
    reasons: list[str] = []
    rejects = [f for f in findings if f.decision == REJECT]
    reviews = [f for f in findings if f.decision == REVIEW]
    reasons += [f"不通过：{f.label()}" for f in rejects]
    reasons += [f"待复核：{f.label()}" for f in reviews]
    failed = [r for r in results if r.status != "ok"]
    reasons += [
        f"未完成审核：第 {r.chunk + 1} 段（{fmt_range(r.start, r.end)}）—— {r.message}" for r in failed
    ]
    if rejects:
        return REJECT, reasons
    if reviews or failed:
        return REVIEW, reasons
    return PASS, reasons
