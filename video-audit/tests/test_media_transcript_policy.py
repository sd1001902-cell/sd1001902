import pytest

from video_audit.media import MediaError, effective_interval, extract_frames, probe
from video_audit.policy import PolicyError, load_policy, output_schema, rules_text
from video_audit.transcript import load_subtitles, segments_between


def test_probe(sample_video, portrait_video):
    info = probe(sample_video)
    assert info.duration == pytest.approx(7.0, abs=0.1)
    assert (info.width, info.height) == (1280, 720)
    assert info.has_audio
    p = probe(portrait_video)
    assert (p.width, p.height) == (720, 1280)
    assert not p.has_audio


def test_probe_missing_file(tmp_path):
    with pytest.raises(MediaError):
        probe(tmp_path / "nope.mp4")


def test_probe_not_a_video(tmp_path):
    bad = tmp_path / "bad.mp4"
    bad.write_text("not a video")
    with pytest.raises(MediaError):
        probe(bad)


def test_extract_frames_interval_and_scene(sample_video, tmp_path):
    info = probe(sample_video)
    frames = extract_frames(info, tmp_path, interval=3, scene_threshold=0.3)
    times = [round(f.time, 2) for f in frames]
    assert times[0] == 0.0
    assert any(abs(t - 3.0) < 0.1 for t in times)
    assert any(abs(t - 4.0) < 0.1 for t in times), f"镜头切换处应补帧：{times}"
    assert times == sorted(times)
    assert [f.index for f in frames] == list(range(len(frames)))
    assert all(f.path.is_file() and f.thumb.is_file() for f in frames)

    no_scene = extract_frames(info, tmp_path / "b", interval=3, scene_threshold=0)
    assert [round(f.time, 1) for f in no_scene] == [0.0, 3.0, 6.0]


def test_extract_frames_respects_max(sample_video, tmp_path):
    info = probe(sample_video)
    frames = extract_frames(info, tmp_path, interval=0.2, max_frames=5)
    assert 1 <= len(frames) <= 5
    assert effective_interval(7.0, 0.2, 5) == pytest.approx(1.4)


def test_subtitles_srt_and_vtt(tmp_path):
    srt = tmp_path / "a.srt"
    srt.write_text(
        "1\n00:00:01,000 --> 00:00:02,500\n<i>你好</i>\n\n2\n00:01:02,000 --> 00:01:03,000\n第二句\n第二行\n",
        encoding="utf-8",
    )
    segs = load_subtitles(srt)
    assert [(s.start, s.end, s.text) for s in segs] == [(1.0, 2.5, "你好"), (62.0, 63.0, "第二句 第二行")]

    vtt = tmp_path / "a.vtt"
    vtt.write_text("WEBVTT\n\n00:05.000 --> 00:07.250\nxin chào\n\ncue2\n01:00:00.000 --> 01:00:01.000\nend\n",
                   encoding="utf-8")
    segs = load_subtitles(vtt)
    assert [(s.start, s.end, s.text) for s in segs] == [(5.0, 7.25, "xin chào"), (3600.0, 3601.0, "end")]
    assert [s.text for s in segments_between(segs, 0, 6)] == ["xin chào"]


def test_default_policy_and_schema():
    policy = load_policy()
    ids = [c.id for c in policy.categories]
    assert "sexual" in ids and "ad_diversion" in ids
    schema = output_schema(policy)
    enum = schema["properties"]["findings"]["items"]["properties"]["category"]["enum"]
    assert enum == ids + ["other"]
    assert "[other]" in rules_text(policy)
    assert policy.get("not-a-category").id == "other"


@pytest.mark.parametrize(
    "body, msg",
    [
        ("categories: []", "至少"),
        ("categories:\n  - id: a\n  - id: a", "重复"),
        ("categories:\n  - id: 色情", "英文"),
        ("categories:\n  - id: a\n    action: block", "reject 或 review"),
        ("thresholds: {reject_confidence: 0.3, review_confidence: 0.5}\ncategories:\n  - id: a", "thresholds"),
    ],
)
def test_policy_validation(tmp_path, body, msg):
    path = tmp_path / "p.yaml"
    path.write_text(body, encoding="utf-8")
    with pytest.raises(PolicyError, match=msg):
        load_policy(path)
