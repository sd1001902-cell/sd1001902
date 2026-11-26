"""输出审核报告：JSON（给程序用）和 HTML（给人看，缩略图直接嵌在文件里）。"""

from __future__ import annotations

import base64
import html
import json
from dataclasses import asdict
from pathlib import Path

from .pipeline import AuditResult
from .policy import ACTION_LABELS
from .util import fmt_range, fmt_time
from .verdict import SEVERITY_LABELS, SOURCE_LABELS, VERDICT_LABELS

MAX_THUMBS_PER_FINDING = 4


def to_dict(r: AuditResult) -> dict:
    return {
        "file": r.info.path,
        "verdict": r.verdict,
        "verdict_label": VERDICT_LABELS[r.verdict],
        "reasons": r.reasons,
        "notes": r.notes,
        "findings": [
            {
                "category": f.category,
                "category_name": f.category_name,
                "decision": f.decision,
                "severity": f.severity,
                "confidence": round(f.confidence, 3),
                "start": round(f.start, 2),
                "end": round(f.end, 2),
                "time": fmt_range(f.start, f.end),
                "sources": f.sources,
                "evidence": f.evidence,
                "frames": f.frames,
            }
            for f in r.findings
        ],
        "video": asdict(r.info),
        "audio": r.audio_note,
        "frames": [{"index": f.index, "time": round(f.time, 2)} for f in r.frames],
        "sampling_interval_s": round(r.interval, 2),
        "chunks": [
            {
                "chunk": c.chunk,
                "start": round(c.start, 2),
                "end": round(c.end, 2),
                "status": c.status,
                "message": c.message,
                "summary": c.summary,
                "model": c.model,
                "usage": c.usage,
                "raw_findings": [f.model_dump() for f in c.findings],
            }
            for c in r.chunks
        ],
        "transcript": None
        if r.transcript is None
        else [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text} for s in r.transcript],
        "policy": r.policy_name,
        "options": asdict(r.options),
        "models_used": r.models_used,
        "usage": r.usage,
        "estimated_cost_usd": None if r.cost_usd is None else round(r.cost_usd, 4),
        "started_at": r.started_at,
        "elapsed_s": r.elapsed_s,
    }


def write_json(r: AuditResult, path: Path) -> None:
    path.write_text(json.dumps(to_dict(r), ensure_ascii=False, indent=2), encoding="utf-8")


def _img(path: Path) -> str:
    try:
        data = base64.standard_b64encode(path.read_bytes()).decode("ascii")
    except OSError:
        return ""
    return f"data:image/jpeg;base64,{data}"


def _pick(frames: list[int], n: int) -> list[int]:
    if len(frames) <= n:
        return frames
    step = (len(frames) - 1) / (n - 1)
    return [frames[round(i * step)] for i in range(n)]


CSS = """
:root{--bg:#f6f7f9;--card:#fff;--text:#1d2129;--muted:#6b7280;--line:#e5e7eb;
--pass:#15803d;--pass-bg:#dcfce7;--review:#b45309;--review-bg:#fef3c7;--reject:#b91c1c;--reject-bg:#fee2e2;--ignored:#6b7280;--ignored-bg:#f3f4f6}
@media (prefers-color-scheme:dark){:root{--bg:#111318;--card:#1a1d24;--text:#e5e7eb;--muted:#9ca3af;--line:#2d313a;
--pass:#4ade80;--pass-bg:#12301d;--review:#fbbf24;--review-bg:#3a2c0c;--reject:#f87171;--reject-bg:#3b1515;--ignored:#9ca3af;--ignored-bg:#23262d}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
main{max-width:1080px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 12px}
.muted{color:var(--muted)}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:12px}
.verdict{display:flex;gap:16px;align-items:flex-start}.badge{font-weight:700;border-radius:8px;padding:6px 14px;white-space:nowrap;font-size:18px}
.pass{color:var(--pass);background:var(--pass-bg)}.review{color:var(--review);background:var(--review-bg)}
.reject{color:var(--reject);background:var(--reject-bg)}.ignored{color:var(--ignored);background:var(--ignored-bg)}
.verdict ul{margin:0;padding-left:18px}.meta{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px 16px}
.meta div span{display:block;font-size:12px;color:var(--muted)}
.timeline{position:relative;height:28px;background:var(--ignored-bg);border-radius:6px;margin:8px 0 4px;overflow:hidden}
.timeline i{position:absolute;top:0;bottom:0;min-width:4px;opacity:.85}.timeline i.reject{background:var(--reject)}
.timeline i.review{background:var(--review)}.timeline i.ignored{background:var(--ignored)}
.axis{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
.finding header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}.tag{font-size:12px;border-radius:4px;padding:1px 8px}
.finding h3{margin:0;font-size:16px}.finding ul{margin:6px 0;padding-left:18px}
.thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.thumbs figure{margin:0}.thumbs img{height:120px;border-radius:6px;display:block}
.thumbs figcaption{font-size:12px;color:var(--muted);text-align:center}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
details{margin-bottom:12px}summary{cursor:pointer;font-weight:600}
"""


def _e(s) -> str:
    return html.escape(str(s))


def render_html(r: AuditResult) -> str:
    info = r.info
    thumbs = {f.index: f for f in r.frames}
    name = Path(info.path).name
    dur = max(info.duration, 0.001)

    reasons = "".join(f"<li>{_e(x)}</li>" for x in r.reasons) or "<li>没有发现需要处理的问题</li>"
    notes = "".join(f"<p class='muted'>⚠ {_e(n)}</p>" for n in r.notes)

    cost = "—" if r.cost_usd is None else f"约 ${r.cost_usd:.3f}"
    meta_items = [
        ("时长", fmt_time(info.duration)),
        ("分辨率", f"{info.width}×{info.height}"),
        ("抽帧", f"{len(r.frames)} 帧（约每 {r.interval:.1f} 秒）"),
        ("语音", r.audio_note),
        ("模型", ", ".join(r.models_used) or r.options.model),
        ("请求", f"{len(r.chunks)} 次"),
        ("Token（输入/输出）", f"{r.usage.get('input_tokens', 0) + r.usage.get('cache_read_input_tokens', 0) + r.usage.get('cache_creation_input_tokens', 0):,} / {r.usage.get('output_tokens', 0):,}"),
        ("估算费用", cost),
        ("审核规则", r.policy_name),
        ("用时", f"{r.elapsed_s} 秒"),
    ]
    meta = "".join(f"<div><span>{_e(k)}</span>{_e(v)}</div>" for k, v in meta_items)

    marks = "".join(
        f"<i class='{f.decision}' title='{_e(f.label())}' "
        f"style='left:{f.start / dur * 100:.2f}%;width:{max((f.end - f.start) / dur * 100, 0.4):.2f}%'></i>"
        for f in r.findings
    )

    cards = []
    decision_label = {"reject": "不通过", "review": "人工复核", "ignored": "置信度低，已忽略"}
    for f in r.findings:
        imgs = []
        for idx in _pick(f.frames, MAX_THUMBS_PER_FINDING):
            fr = thumbs.get(idx)
            src = _img(fr.thumb) if fr else ""
            if src:
                imgs.append(
                    f"<figure><img src='{src}' alt='帧 {idx}'><figcaption>#{idx} · {fmt_time(fr.time, True)}</figcaption></figure>"
                )
        evidence = "".join(f"<li>{_e(e)}</li>" for e in f.evidence)
        cards.append(
            f"<article class='card finding'><header>"
            f"<span class='badge {f.decision}' style='font-size:13px;padding:2px 10px'>{_e(decision_label[f.decision])}</span>"
            f"<h3>{_e(f.category_name)}</h3>"
            f"<span class='muted'>{_e(fmt_range(f.start, f.end))}</span>"
            f"<span class='tag ignored'>{_e(SEVERITY_LABELS.get(f.severity, f.severity))}</span>"
            f"<span class='tag ignored'>置信度 {f.confidence:.2f}</span>"
            f"<span class='tag ignored'>{_e('、'.join(SOURCE_LABELS.get(s, s) for s in f.sources))}</span>"
            f"<span class='tag ignored'>规则处理：{_e(ACTION_LABELS.get(f.action, f.action))}</span>"
            f"</header><ul>{evidence}</ul><div class='thumbs'>{''.join(imgs)}</div></article>"
        )
    findings_html = "".join(cards) or "<p class='muted'>没有发现疑点。</p>"

    status_label = {"ok": "完成", "refused": "模型拒绝", "error": "失败"}
    rows = "".join(
        f"<tr><td>{c.chunk + 1}</td><td>{_e(fmt_range(c.start, c.end))}</td>"
        f"<td>{_e(status_label[c.status])}</td><td>{_e(c.summary or c.message)}</td></tr>"
        for c in r.chunks
    )
    transcript = ""
    if r.transcript:
        lines = "".join(
            f"<tr><td style='white-space:nowrap'>{_e(fmt_range(s.start, s.end))}</td><td>{_e(s.text)}</td></tr>"
            for s in r.transcript
        )
        transcript = f"<details class='card'><summary>语音文字（{len(r.transcript)} 句）</summary><table>{lines}</table></details>"

    return f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>审核报告 · {_e(name)}</title><style>{CSS}</style></head>
<body><main>
<h1>视频审核报告</h1>
<p class="muted">{_e(name)} · {_e(r.started_at)}</p>
<section class="card verdict"><div class="badge {r.verdict}">{_e(VERDICT_LABELS[r.verdict])}</div>
<div><ul>{reasons}</ul>{notes}</div></section>
<section class="card"><div class="meta">{meta}</div></section>
<h2>时间轴</h2>
<div class="timeline">{marks}</div><div class="axis"><span>00:00</span><span>{_e(fmt_time(info.duration))}</span></div>
<h2>疑点（{len(r.findings)}）</h2>
{findings_html}
<h2>分段审核</h2>
<details class="card"><summary>每段内容概括（{len(r.chunks)} 段）</summary>
<table><tr><th>#</th><th>时间</th><th>状态</th><th>内容 / 说明</th></tr>{rows}</table></details>
{transcript}
<p class="muted">由 AI 自动审核，结论仅供参考：「人工复核」和「不通过」的内容请由人确认后再处理。</p>
</main></body></html>
"""


def write_html(r: AuditResult, path: Path) -> None:
    path.write_text(render_html(r), encoding="utf-8")
