"""Build cleaned IELTS Speaking study materials from scraped topic metadata."""

from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATH = ROOT / "data" / "ielts" / "external" / "ieltsbro" / "oral_topics.json"
PROCESSED_PATH = ROOT / "src" / "renderer" / "app" / "ielts" / "data" / "speaking-topics.json"
MARKDOWN_PATH = ROOT / "docs" / "ielts" / "study-materials.md"


PART_LABELS = {
    "part_1": "Part 1",
    "part_2_3": "Part 2/3",
}

CATEGORY_LABELS = {
    "people": "People",
    "things": "Things",
    "events": "Events",
    "places": "Places",
    "all": "All",
}

MOJIBAKE_RE = re.compile(r"[ÃÂâäåæçèéêëìíîïðñòóôõöøùúûüýÿ]")


def repair_text(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    text = value.strip()
    if not text:
        return text
    if not MOJIBAKE_RE.search(text):
        return text
    try:
        repaired = text.encode("latin1").decode("utf-8")
    except UnicodeError:
        return text
    return repaired if repaired.count("\ufffd") <= text.count("\ufffd") else text


def clean_question(value: Any) -> str:
    text = repair_text(value) or ""
    return re.sub(r"[ \t]+", " ", str(text)).strip()


def priority_bucket(topic: dict[str, Any]) -> str:
    if topic["is_new"] and topic["recent_exam_count"] >= 300:
        return "New and high frequency"
    if topic["recent_exam_count"] >= 700:
        return "High frequency"
    if topic["is_new"]:
        return "New topic"
    return "Regular practice"


def topic_sort_key(topic: dict[str, Any]) -> tuple[int, int, int, str]:
    new_weight = 1 if topic["is_new"] else 0
    return (
        topic["recent_exam_count"],
        new_weight,
        topic["question_count"],
        topic["topic_name"].lower(),
    )


def build_topics(raw_topics: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}

    for raw in raw_topics:
        topic_id = str(raw.get("oral_topic_id") or "").strip()
        if not topic_id:
            continue

        existing = grouped.get(topic_id)
        category = raw.get("category") or "all"

        if existing is None:
            grouped[topic_id] = {
                "id": topic_id,
                "source": raw.get("source") or "ieltsbro",
                "part": raw.get("part") or "",
                "part_label": PART_LABELS.get(raw.get("part"), raw.get("part") or ""),
                "category": "uncategorized" if category == "all" else category,
                "category_label": CATEGORY_LABELS.get(category, category),
                "categories": [] if category == "all" else [category],
                "topic_name": repair_text(raw.get("oral_topic_name")) or "",
                "question_count": int(raw.get("question_count") or 0),
                "sample_question_id": raw.get("sample_question_id"),
                "sample_question": clean_question(raw.get("sample_question")),
                "recent_exam_count": int(raw.get("recent_exam_count") or 0),
                "learner_count": repair_text(raw.get("oral_nums")) or "",
                "time_tag": repair_text(raw.get("time_tag")) or "",
                "is_new": bool(raw.get("is_new")),
                "source_categories": [category],
            }
            continue

        if category not in existing["source_categories"]:
            existing["source_categories"].append(category)
        if category != "all" and category not in existing["categories"]:
            existing["categories"].append(category)
            existing["category"] = category
            existing["category_label"] = CATEGORY_LABELS.get(category, category)

        existing["recent_exam_count"] = max(
            existing["recent_exam_count"], int(raw.get("recent_exam_count") or 0)
        )
        existing["question_count"] = max(
            existing["question_count"], int(raw.get("question_count") or 0)
        )
        existing["is_new"] = existing["is_new"] or bool(raw.get("is_new"))

    topics = list(grouped.values())
    for topic in topics:
        topic["priority"] = priority_bucket(topic)
        topic["categories"] = topic["categories"] or [topic["category"]]

    return sorted(topics, key=topic_sort_key, reverse=True)


def build_summary(topics: list[dict[str, Any]], source: dict[str, Any]) -> dict[str, Any]:
    by_part = Counter(topic["part"] for topic in topics)
    by_category = Counter(topic["category"] for topic in topics)
    by_priority = Counter(topic["priority"] for topic in topics)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "counts": {
            "topics": len(topics),
            "new_topics": sum(1 for topic in topics if topic["is_new"]),
            "part_1": by_part.get("part_1", 0),
            "part_2_3": by_part.get("part_2_3", 0),
        },
        "by_category": dict(sorted(by_category.items())),
        "by_priority": dict(sorted(by_priority.items())),
    }


def write_json(payload: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_markdown(payload: dict[str, Any], path: Path) -> None:
    summary = payload["summary"]
    topics = payload["topics"]
    lines = [
        "# IELTS Speaking Study Materials",
        "",
        "This file is generated from the cleaned IELTS Speaking topic metadata.",
        "It is designed to be easy for both humans and ChatGPT to read.",
        "",
        "## Summary",
        "",
        f"- Generated at: `{summary['generated_at']}`",
        f"- Source: {summary['source'].get('name', 'Unknown')}",
        f"- Source URL: {summary['source'].get('site_url', '')}",
        f"- Total unique topics: {summary['counts']['topics']}",
        f"- Part 1 topics: {summary['counts']['part_1']}",
        f"- Part 2/3 topics: {summary['counts']['part_2_3']}",
        f"- New topics: {summary['counts']['new_topics']}",
        "",
        "## Priority Topics",
        "",
    ]

    for topic in topics[:25]:
        lines.extend(
            [
                f"### {topic['part_label']} - {topic['topic_name']}",
                "",
                f"- Category: {topic['category_label']}",
                f"- Priority: {topic['priority']}",
                f"- New topic: {'yes' if topic['is_new'] else 'no'}",
                f"- Recent exam count: {topic['recent_exam_count']}",
                f"- Question count: {topic['question_count']}",
                f"- Season: {topic['time_tag'] or 'Unknown'}",
                "",
                "Sample question:",
                "",
                f"> {topic['sample_question']}",
                "",
            ]
        )

    lines.extend(["## All Topics", ""])
    for part in ["part_1", "part_2_3"]:
        lines.extend([f"### {PART_LABELS[part]}", ""])
        for topic in [item for item in topics if item["part"] == part]:
            new_label = "new" if topic["is_new"] else "existing"
            lines.append(
                f"- **{topic['topic_name']}** ({topic['category_label']}, "
                f"{new_label}, recent {topic['recent_exam_count']}): "
                f"{topic['sample_question']}"
            )
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    raw_payload = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    topics = build_topics(raw_payload.get("oral_topics") or [])
    payload = {
        "summary": build_summary(topics, raw_payload.get("source") or {}),
        "topics": topics,
    }
    write_json(payload, PROCESSED_PATH)
    write_markdown(payload, MARKDOWN_PATH)
    print(f"Wrote {len(topics)} topics")
    print(f"- {PROCESSED_PATH.relative_to(ROOT)}")
    print(f"- {MARKDOWN_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
