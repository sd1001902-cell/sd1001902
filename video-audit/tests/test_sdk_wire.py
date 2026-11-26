"""用真实的 anthropic SDK 对一个本地假服务器发请求，确认请求参数 SDK 能接受、发出去的格式对、返回能解析。"""

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import anthropic

from video_audit.media import extract_frames, probe
from video_audit.moderator import Moderator, make_chunks
from video_audit.policy import load_policy


def test_real_sdk_request(sample_video, tmp_path):
    seen = {}
    answer = {"summary": "测试图案", "findings": [{
        "source": "visual", "frame_indices": [1], "start_time": 2, "end_time": 2, "evidence": "示例",
        "category": "dangerous", "severity": "low", "confidence": 0.5}]}

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = self.rfile.read(int(self.headers["content-length"]))
            seen["path"] = self.path
            seen["beta"] = self.headers.get("anthropic-beta")
            seen["body"] = json.loads(body)
            out = json.dumps({
                "id": "msg_test", "type": "message", "role": "assistant", "model": "claude-opus-5-5",
                "content": [{"type": "text", "text": json.dumps(answer, ensure_ascii=False)}],
                "stop_reason": "end_turn", "stop_sequence": None,
                "usage": {"input_tokens": 1200, "output_tokens": 300,
                          "cache_read_input_tokens": 2000, "cache_creation_input_tokens": 0},
            }).encode()
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)

        def log_message(self, *a):
            pass

    server = HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        client = anthropic.Anthropic(api_key="test-key", base_url=f"http://127.0.0.1:{server.server_port}",
                                     max_retries=0)
        info = probe(sample_video)
        frames = extract_frames(info, tmp_path, interval=2)
        chunks = make_chunks(frames, info.duration, 12)
        result = Moderator(client, load_policy()).review(chunks[0], info, None, len(chunks))
    finally:
        server.shutdown()

    assert result.status == "ok", result.message
    assert result.findings[0].category == "dangerous"
    assert result.usage["cache_read_input_tokens"] == 2000
    body = seen["body"]
    assert seen["path"].startswith("/v1/messages")
    assert "server-side-fallback-2026-07-01" in seen["beta"]
    assert body["fallbacks"] == "default"
    assert body["output_config"]["effort"] == "medium"
    assert body["output_config"]["format"]["schema"]["required"] == ["summary", "findings"]
    assert "thinking" not in body and "temperature" not in body
    images = [b for b in body["messages"][0]["content"] if b["type"] == "image"]
    assert len(images) == len(chunks[0].frames)
