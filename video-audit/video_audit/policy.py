"""审核规则：读取 policy.yaml，生成给模型的规则文字和输出格式。"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

DEFAULT_POLICY_PATH = Path(__file__).resolve().parent.parent / "policy.yaml"

ACTIONS = ("reject", "review")
ACTION_LABELS = {"reject": "拒绝", "review": "人工复核"}
SEVERITIES = ("low", "medium", "high")
SOURCES = ("visual", "on_screen_text", "speech")


class PolicyError(ValueError):
    pass


@dataclass
class Category:
    id: str
    name: str
    action: str
    description: str
    examples: list[str] = field(default_factory=list)
    exceptions: list[str] = field(default_factory=list)


OTHER = Category(
    id="other",
    name="其他",
    action="review",
    description="不属于以上任何类别、但明显不适合公开发布的内容。",
)


@dataclass
class Policy:
    name: str
    categories: list[Category]
    reject_confidence: float = 0.8
    review_confidence: float = 0.4
    extra_instructions: str = ""

    def get(self, category_id: str) -> Category:
        for c in self.categories:
            if c.id == category_id:
                return c
        return OTHER

    @property
    def all_categories(self) -> list[Category]:
        return [*self.categories, OTHER]


def _str_list(value, where: str) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise PolicyError(f"{where} 应该是列表")
    return [str(v) for v in value]


def load_policy(path: str | Path | None = None) -> Policy:
    path = Path(path) if path else DEFAULT_POLICY_PATH
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except FileNotFoundError:
        raise PolicyError(f"找不到规则文件：{path}") from None
    except yaml.YAMLError as e:
        raise PolicyError(f"规则文件格式有误：{e}") from None

    raw_categories = data.get("categories") or []
    if not raw_categories:
        raise PolicyError("规则文件里至少要有一个 category")
    categories: list[Category] = []
    seen: set[str] = set()
    for i, raw in enumerate(raw_categories):
        where = f"categories[{i}]"
        if not isinstance(raw, dict):
            raise PolicyError(f"{where} 格式不对")
        cid = str(raw.get("id") or "").strip()
        if not cid or not cid.replace("_", "").isalnum() or not cid.isascii():
            raise PolicyError(f"{where}.id 只能用英文字母、数字和下划线")
        if cid in seen or cid == OTHER.id:
            raise PolicyError(f"{where}.id 重复或使用了保留名：{cid}")
        seen.add(cid)
        action = str(raw.get("action") or "review")
        if action not in ACTIONS:
            raise PolicyError(f"{where}.action 只能是 reject 或 review")
        categories.append(
            Category(
                id=cid,
                name=str(raw.get("name") or cid),
                action=action,
                description=str(raw.get("description") or "").strip(),
                examples=_str_list(raw.get("examples"), f"{where}.examples"),
                exceptions=_str_list(raw.get("exceptions"), f"{where}.exceptions"),
            )
        )

    th = data.get("thresholds") or {}
    reject_c = float(th.get("reject_confidence", 0.8))
    review_c = float(th.get("review_confidence", 0.4))
    if not (0 <= review_c <= reject_c <= 1):
        raise PolicyError("thresholds 需满足 0 ≤ review_confidence ≤ reject_confidence ≤ 1")

    return Policy(
        name=str(data.get("name") or path.stem),
        categories=categories,
        reject_confidence=reject_c,
        review_confidence=review_c,
        extra_instructions=str(data.get("extra_instructions") or "").strip(),
    )


def rules_text(policy: Policy) -> str:
    lines = []
    for c in policy.all_categories:
        lines.append(f"[{c.id}] {c.name}（处理方式：{ACTION_LABELS[c.action]}）")
        if c.description:
            lines.append(f"  定义：{c.description}")
        if c.examples:
            lines.append(f"  例如：{'；'.join(c.examples)}")
        if c.exceptions:
            lines.append(f"  不算违规：{'；'.join(c.exceptions)}")
    return "\n".join(lines)


def output_schema(policy: Policy) -> dict:
    """结构化输出用的 JSON Schema（模型只能按这个格式回答）。"""
    finding = {
        "type": "object",
        "properties": {
            "source": {
                "type": "string",
                "enum": list(SOURCES),
                "description": "visual=画面内容，on_screen_text=画面里的文字，speech=语音",
            },
            "frame_indices": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "相关帧的编号（帧标注里 # 后面的数字）；纯语音问题可为空",
            },
            "start_time": {"type": "number", "description": "开始时间（秒）"},
            "end_time": {"type": "number", "description": "结束时间（秒）"},
            "evidence": {
                "type": "string",
                "description": "客观描述看到/听到了什么、为什么违反该规则（中文，不复述露骨细节）",
            },
            "category": {"type": "string", "enum": [c.id for c in policy.all_categories]},
            "severity": {"type": "string", "enum": list(SEVERITIES)},
            "confidence": {"type": "number", "description": "0 到 1"},
        },
        "required": [
            "source", "frame_indices", "start_time", "end_time",
            "evidence", "category", "severity", "confidence",
        ],
        "additionalProperties": False,
    }
    return {
        "type": "object",
        "properties": {
            "summary": {"type": "string", "description": "一两句话概括本段内容（中文）"},
            "findings": {"type": "array", "items": finding},
        },
        "required": ["summary", "findings"],
        "additionalProperties": False,
    }
