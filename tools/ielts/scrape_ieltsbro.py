"""Collect IELTS Bro public question-bank metadata for personal study.

This script uses Playwright to open the public IELTS Bro question-bank page,
then calls the same public API used by the frontend to collect oral topic list
metadata. It intentionally avoids login-only, paid, or protected content.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from playwright.sync_api import APIResponse, Page, sync_playwright


SITE_URL = "https://www.ieltsbro.com/question-bank/"
API_BASE_URL = "https://hcp-server.ieltsbro.com"
ORAL_TOPIC_LIST_ENDPOINT = "/hcp/qsBank/oralTopic/listV3"
SEASON_TOPIC_ENDPOINT = "/hcp/qsBank/topicChange/getDataV2/1"

CATEGORIES = {
    "all": "all",
    "1": "people",
    "2": "things",
    "3": "events",
    "4": "places",
}

PARTS = {
    "0": "part_1",
    "1": "part_2_3",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape public IELTS Bro oral question-bank metadata."
    )
    parser.add_argument(
        "--output",
        default="data/ielts/external/ieltsbro/oral_topics.json",
        help="JSON output path.",
    )
    parser.add_argument(
        "--limit-per-list",
        type=int,
        default=10,
        help="Maximum records per category/part list. Use --all to disable.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Collect every record returned by each public list endpoint.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Delay in seconds between API requests.",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run browser in headed mode for debugging.",
    )
    parser.add_argument(
        "--save-html",
        default="",
        help="Optional path to save the rendered question-bank HTML snapshot.",
    )
    parser.add_argument(
        "--skip-season",
        action="store_true",
        help="Skip the public current-season topic endpoint.",
    )
    return parser.parse_args()


def parse_json_response(response: APIResponse) -> dict[str, Any]:
    return json.loads(response.body().decode("utf-8"))


def api_post(page: Page, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = page.request.post(
        f"{API_BASE_URL}{endpoint}",
        data=payload,
        headers={
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.ieltsbro.com",
            "Referer": SITE_URL,
        },
    )
    if not response.ok:
        raise RuntimeError(f"POST {endpoint} failed with HTTP {response.status}")
    return parse_json_response(response)


def api_get(page: Page, endpoint: str) -> dict[str, Any]:
    response = page.request.get(
        f"{API_BASE_URL}{endpoint}",
        headers={
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.ieltsbro.com",
            "Referer": SITE_URL,
        },
    )
    if not response.ok:
        raise RuntimeError(f"GET {endpoint} failed with HTTP {response.status}")
    return parse_json_response(response)


def clean_topic(raw: dict[str, Any], category_id: str, part_id: str) -> dict[str, Any]:
    return {
        "source": "ieltsbro",
        "category_id": category_id,
        "category": CATEGORIES[category_id],
        "part_id": part_id,
        "part": PARTS[part_id],
        "oral_topic_id": raw.get("oralTopicId"),
        "oral_topic_name": raw.get("oralTopicName"),
        "question_count": raw.get("questionCount"),
        "sample_question_id": raw.get("oralQuestionId"),
        "sample_question": raw.get("oralQuestion"),
        "recent_exam_count": raw.get("recentExamCount"),
        "complete_count": raw.get("completeCount"),
        "oral_nums": raw.get("oralNums"),
        "time_tag": raw.get("timeTag"),
        "is_new": raw.get("ifNew"),
        "raw": raw,
    }


def collect_oral_topics(
    page: Page,
    limit_per_list: int | None,
    delay: float,
) -> list[dict[str, Any]]:
    topics: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()

    for category_id in CATEGORIES:
        for part_id in PARTS:
            payload = {"oralTopCatalog": category_id, "part": int(part_id)}
            data = api_post(page, ORAL_TOPIC_LIST_ENDPOINT, payload)
            content = data.get("content") or {}
            rows = content.get("list") or []
            if limit_per_list is not None:
                rows = rows[:limit_per_list]

            for row in rows:
                topic_id = str(row.get("oralTopicId") or "")
                key = (category_id, part_id, topic_id)
                if key in seen:
                    continue
                seen.add(key)
                topics.append(clean_topic(row, category_id, part_id))

            time.sleep(delay)

    return topics


def collect_season_topics(page: Page) -> dict[str, Any]:
    data = api_get(page, SEASON_TOPIC_ENDPOINT)
    return data.get("content") or {}


def main() -> None:
    args = parse_args()
    limit_per_list = None if args.all else args.limit_per_list
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0 Safari/537.36"
            )
        )
        page.goto(SITE_URL, wait_until="domcontentloaded", timeout=30_000)

        if args.save_html:
            html_path = Path(args.save_html)
            html_path.parent.mkdir(parents=True, exist_ok=True)
            html_path.write_text(page.content(), encoding="utf-8")

        topics = collect_oral_topics(page, limit_per_list, args.delay)
        season_topics = {} if args.skip_season else collect_season_topics(page)

        browser.close()

    result = {
        "source": {
            "name": "IELTS Bro",
            "site_url": SITE_URL,
            "api_base_url": API_BASE_URL,
            "usage_note": (
                "Personal study metadata only. Do not redistribute copied "
                "third-party content or bypass access controls."
            ),
        },
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "limits": {
            "limit_per_list": limit_per_list,
            "delay_seconds": args.delay,
        },
        "counts": {
            "oral_topics": len(topics),
        },
        "oral_topics": topics,
        "season_topics": season_topics,
    }

    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(topics)} oral topic records to {output_path}")


if __name__ == "__main__":
    main()
