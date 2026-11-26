import json

import anthropic
import httpx2
import pytest

from conftest import fake_message
from video_audit.cli import main
from video_audit.moderator import ChunkResult, FatalAPIError, RawFinding
from video_audit.pipeline import AuditOptions, audit_video
from video_audit.policy import load_policy
from video_audit.report import render_html, to_dict
from video_audit.verdict import PASS, REJECT, REVIEW, decide, merge_findings


def raw(category, severity="high", confidence=0.9, frames=(0,), start=0.0, end=0.0, source="visual"):
    return RawFinding(source=source, frame_indices=list(frames), start_time=start, end_time=end,
                      evidence=f"{category} 证据", category=category, severity=severity, confidence=confidence)


def chunk(findings, status="ok", idx=0):
    return ChunkResult(chunk=idx, start=0, end=10, status=status, findings=findings,
                       message="" if status == "ok" else "出错")


FRAME_TIMES = {i: i * 2.0 for i in range(10)}


def test_verdict_rules():
    policy = load_policy()
    cases = [
        ([], PASS),
        ([raw("sexual", "high", 0.95)], REJECT),
        ([raw("sexual", "high", 0.6)], REVIEW),  # 置信度不够自动拒绝
        ([raw("sexual", "medium", 0.95)], REVIEW),  # 不是 high
        ([raw("ad_diversion", "high", 0.99)], REVIEW),  # 规则只送复核
        ([raw("violence", "high", 0.2)], PASS),  # 低于 review_confidence，忽略
        ([raw("unknown_cat", "low", 0.9)], REVIEW),  # 未知类别按 other 处理
    ]
    for findings, expected in cases:
        merged = merge_findings([chunk(findings)], policy, FRAME_TIMES, 20.0, gap=3)
        verdict, _ = decide(merged, [chunk(findings)])
        assert verdict == expected, findings


def test_failed_chunk_needs_review():
    policy = load_policy()
    results = [chunk([]), chunk([], status="refused", idx=1)]
    verdict, reasons = decide(merge_findings(results, policy, FRAME_TIMES, 20.0, 3), results)
    assert verdict == REVIEW
    assert any("第 2 段" in r for r in reasons)


def test_merge_adjacent_same_category():
    policy = load_policy()
    results = [
        chunk([raw("ad_diversion", "medium", 0.7, frames=(1, 2))]),
        chunk([raw("ad_diversion", "high", 0.8, frames=(3,)),  # 6 秒，紧挨着 → 合并
               raw("ad_diversion", "low", 0.5, frames=(9,)),   # 18 秒，隔太远 → 单独一条
               raw("speech_only", "low", 0.5, frames=(), start=5, end=7, source="speech")], idx=1),
    ]
    merged = merge_findings(results, policy, FRAME_TIMES, 20.0, gap=3)
    ads = [f for f in merged if f.category == "ad_diversion"]
    assert len(ads) == 2
    first = min(ads, key=lambda f: f.start)
    assert (first.start, first.end, first.frames) == (2.0, 6.0, [1, 2, 3])
    assert first.severity == "high" and first.confidence == 0.8
    other = next(f for f in merged if f.category == "other")
    assert (other.start, other.end) == (5.0, 7.0)


def test_audit_video_end_to_end(sample_video, tmp_path, fake_client_factory):
    def responder(params):
        content = params["messages"][0]["content"]
        labels = [b["text"] for b in content if b["type"] == "text" and b["text"].startswith("帧 #")]
        first = int(labels[0].split("#")[1].split()[0])
        if first == 0:
            return fake_message({"summary": "测试图案", "findings": [{
                "source": "on_screen_text", "frame_indices": [first], "start_time": 0, "end_time": 0,
                "evidence": "画面出现微信号", "category": "ad_diversion", "severity": "medium", "confidence": 0.8,
            }]})
        return fake_message({"summary": "红色画面", "findings": []})

    client = fake_client_factory(responder)
    srt = tmp_path / "s.srt"
    srt.write_text("1\n00:00:01,000 --> 00:00:02,000\n加我微信\n", encoding="utf-8")
    opts = AuditOptions(interval=2, frames_per_request=2, subtitles=str(srt), concurrency=2)
    result = audit_video(sample_video, load_policy(), opts, client, tmp_path / "work", log=lambda *a: None)

    assert result.verdict == REVIEW
    assert len(client.calls) == len(result.chunks) >= 2
    assert [f.category for f in result.findings] == ["ad_diversion"]
    req = client.calls[0]
    assert req["model"] == "claude-opus-5-5"
    assert req["fallbacks"] == "default" and req["betas"] == ["server-side-fallback-2026-07-01"]
    assert req["system"][0]["cache_control"] == {"type": "ephemeral"}
    assert req["output_config"]["format"]["type"] == "json_schema"
    assert any("加我微信" in b.get("text", "") for b in req["messages"][0]["content"])
    assert sum(b["type"] == "image" for b in req["messages"][0]["content"]) == 2

    data = to_dict(result)
    json.dumps(data, ensure_ascii=False)
    assert data["verdict"] == "review" and data["findings"][0]["frames"] == [0]
    page = render_html(result)
    assert "人工复核" in page and "data:image/jpeg;base64," in page and "画面出现微信号" in page


def test_refusal_and_no_fallback(sample_video, tmp_path, fake_client_factory):
    client = fake_client_factory(lambda p: fake_message(stop_reason="refusal", refusal_category="general_harms"))
    opts = AuditOptions(use_fallback=False, audio="off")
    result = audit_video(sample_video, load_policy(), opts, client, tmp_path, log=lambda *a: None)
    assert result.verdict == REVIEW
    assert result.chunks[0].status == "refused"
    assert "fallbacks" not in client.calls[0] and "betas" not in client.calls[0]
    assert any("未审核" in n for n in result.notes)


def test_auth_error_is_fatal(sample_video, tmp_path, fake_client_factory):
    req = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
    err = anthropic.AuthenticationError("bad key", response=httpx2.Response(401, request=req), body=None)
    client = fake_client_factory(lambda p: err)
    with pytest.raises(FatalAPIError):
        audit_video(sample_video, load_policy(), AuditOptions(audio="off"), client, tmp_path, log=lambda *a: None)


def test_cli_dry_run_and_errors(sample_video, portrait_video, tmp_path, capsys):
    assert main(["--dry-run", str(sample_video)]) == 0
    assert "次请求" in capsys.readouterr().out
    assert main([str(tmp_path / "missing.mp4")]) == 3
    assert main(["--subtitles", "x.srt", str(sample_video), str(portrait_video)]) == 3
