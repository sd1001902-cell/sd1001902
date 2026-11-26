"""小工具：时间格式、费用估算。"""

from __future__ import annotations


def fmt_time(seconds: float, precise: bool = False) -> str:
    seconds = max(0.0, float(seconds))
    if precise:
        whole = int(seconds)
        tenth = int(round((seconds - whole) * 10))
        if tenth == 10:
            whole, tenth = whole + 1, 0
    else:
        whole, tenth = int(round(seconds)), None
    h, rem = divmod(whole, 3600)
    m, s = divmod(rem, 60)
    out = f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"
    return f"{out}.{tenth}" if tenth is not None else out


def fmt_range(start: float, end: float) -> str:
    a, b = fmt_time(start), fmt_time(end)
    return a if a == b else f"{a}–{b}"


# 美元 / 百万 token：输入、输出、缓存读取、缓存写入（5 分钟）。仅用于粗略估算，以官方价格为准。
PRICES = {
    "claude-opus-5-5": (4.00, 20.00, 0.20, 5.00),
    "claude-sonnet-5-5": (2.00, 10.00, 0.10, 2.50),
    "claude-haiku-5-5": (0.10, 0.50, 0.01, 0.125),
}

USAGE_KEYS = ("input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens")


def add_usage(total: dict, usage: dict) -> dict:
    for k in USAGE_KEYS:
        total[k] = total.get(k, 0) + int(usage.get(k) or 0)
    return total


def estimate_cost(model: str, usage: dict) -> float | None:
    price = PRICES.get(model)
    if price is None:
        return None
    p_in, p_out, p_read, p_write = price
    return (
        usage.get("input_tokens", 0) * p_in
        + usage.get("output_tokens", 0) * p_out
        + usage.get("cache_read_input_tokens", 0) * p_read
        + usage.get("cache_creation_input_tokens", 0) * p_write
    ) / 1_000_000
