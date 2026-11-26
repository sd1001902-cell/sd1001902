import json
import shutil
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

needs_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="需要 ffmpeg")


def _ffmpeg(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


@pytest.fixture(scope="session")
def sample_video(tmp_path_factory):
    """7 秒横屏：前 4 秒测试图，后 3 秒纯红（第 4 秒有一次镜头切换），带音轨。"""
    if shutil.which("ffmpeg") is None:
        pytest.skip("需要 ffmpeg")
    out = tmp_path_factory.mktemp("media") / "sample.mp4"
    _ffmpeg(
        "-f", "lavfi", "-i", "testsrc=size=1280x720:rate=25:duration=4",
        "-f", "lavfi", "-i", "color=c=red:size=1280x720:rate=25:duration=3",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=7",
        "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]",
        "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest", str(out),
    )
    return out


@pytest.fixture(scope="session")
def portrait_video(tmp_path_factory):
    if shutil.which("ffmpeg") is None:
        pytest.skip("需要 ffmpeg")
    out = tmp_path_factory.mktemp("media") / "portrait.mp4"
    _ffmpeg("-f", "lavfi", "-i", "testsrc=size=720x1280:rate=30:duration=5",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out))
    return out


def fake_message(payload=None, *, stop_reason="end_turn", model="claude-opus-5-5", refusal_category=None):
    text = json.dumps(payload or {"summary": "", "findings": []}, ensure_ascii=False)
    return SimpleNamespace(
        model=model,
        stop_reason=stop_reason,
        stop_details=SimpleNamespace(category=refusal_category) if stop_reason == "refusal" else None,
        content=[] if stop_reason == "refusal" else [SimpleNamespace(type="text", text=text)],
        usage=SimpleNamespace(
            input_tokens=1000, output_tokens=200,
            cache_read_input_tokens=0, cache_creation_input_tokens=0,
        ),
    )


class FakeClient:
    """模仿 anthropic.Anthropic：client.beta.messages.create(**params)。"""

    def __init__(self, responder):
        self.calls = []
        self._responder = responder
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self._create))

    def _create(self, **params):
        self.calls.append(params)
        result = self._responder(params)
        if isinstance(result, Exception):
            raise result
        return result


@pytest.fixture
def fake_client_factory():
    return FakeClient
