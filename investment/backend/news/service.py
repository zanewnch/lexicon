"""
Service for fetching Taiwan financial news from multiple sources:
  1. 鉅亨網 (Anue) — public JSON API
  2. ETtoday 財經雲 — RSS feed
"""

import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import requests
from django.conf import settings

from core.cache import CacheManager

logger = logging.getLogger(__name__)

ANUE_API = settings.ANUE_API_URL
ETTODAY_RSS = settings.ETTODAY_RSS_URL


class NewsService:
    """財經新聞聚合服務。"""

    def __init__(self):
        self._http = requests.Session()
        self._cache = CacheManager(ttl=600)  # 10 minutes

    @staticmethod
    def _strip_html(text: str) -> str:
        clean = re.sub(r"<[^>]+>", "", text)
        clean = clean.replace("&nbsp;", " ").replace("&amp;", "&")
        clean = clean.replace("&lt;", "<").replace("&gt;", ">")
        return clean.strip()

    def _fetch_anue(self, limit: int = 30) -> list[dict]:
        """Fetch Taiwan stock news from Anue public API."""
        cached = self._cache.get("anue_news")
        if cached is not None:
            return cached

        try:
            resp = self._http.get(
                ANUE_API,
                params={"limit": limit},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            resp.raise_for_status()
            body = resp.json()

            items_data = body.get("items", {}).get("data", [])
            results = []
            for item in items_data:
                publish_ts = item.get("publishAt", 0)
                dt = datetime.fromtimestamp(publish_ts, tz=timezone.utc)

                summary_text = item.get("summary", "")
                if len(summary_text) > 80:
                    summary_text = summary_text[:80] + "..."

                results.append({
                    "id": str(item.get("newsId", "")),
                    "title": item.get("title", ""),
                    "summary": summary_text,
                    "date": dt.strftime("%Y-%m-%d"),
                    "time": dt.strftime("%H:%M"),
                    "source": "anue",
                    "category": item.get("categoryName", "台股新聞"),
                    "keywords": item.get("keyword", []),
                    "stocks": item.get("stock", []),
                    "url": f"https://news.cnyes.com/news/id/{item.get('newsId', '')}",
                })

            self._cache.set("anue_news", results)
            return results
        except Exception:
            logger.exception("Failed to fetch Anue news")
            return []

    def _fetch_ettoday(self) -> list[dict]:
        """Fetch finance news from ETtoday RSS feed."""
        cached = self._cache.get("ettoday_news")
        if cached is not None:
            return cached

        try:
            resp = self._http.get(
                ETTODAY_RSS,
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            resp.raise_for_status()

            root = ET.fromstring(resp.content)
            channel = root.find("channel")
            if channel is None:
                return []

            results = []
            for idx, item in enumerate(channel.findall("item")):
                title = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                pub_date_str = (item.findtext("pubDate") or "").strip()
                description = (item.findtext("description") or "").strip()

                try:
                    dt = parsedate_to_datetime(pub_date_str)
                except Exception:
                    dt = datetime.now(tz=timezone.utc)

                summary_text = self._strip_html(description)
                if len(summary_text) > 80:
                    summary_text = summary_text[:80] + "..."

                results.append({
                    "id": f"et_{idx}_{int(dt.timestamp())}",
                    "title": title,
                    "summary": summary_text,
                    "date": dt.strftime("%Y-%m-%d"),
                    "time": dt.strftime("%H:%M"),
                    "source": "ettoday",
                    "category": "財經",
                    "keywords": [],
                    "stocks": [],
                    "url": link,
                })

            self._cache.set("ettoday_news", results)
            return results
        except Exception:
            logger.exception("Failed to fetch ETtoday RSS")
            return []

    def get_news(
        self,
        source: str = "all",
        search: str = "",
        limit: int = 30,
        offset: int = 0,
    ) -> dict:
        """Get financial news with filtering and pagination."""
        items: list[dict] = []

        if source in ("anue", "all"):
            items.extend(self._fetch_anue())
        if source in ("ettoday", "all"):
            items.extend(self._fetch_ettoday())

        items.sort(key=lambda x: (x.get("date", ""), x.get("time", "")), reverse=True)

        if search:
            search_lower = search.lower()
            items = [
                i for i in items
                if search_lower in i["title"].lower()
                or search_lower in i["summary"].lower()
                or search_lower in " ".join(i.get("keywords", [])).lower()
                or search_lower in " ".join(i.get("stocks", [])).lower()
            ]

        total = len(items)
        data = items[offset:offset + limit]

        return {"total": total, "data": data}
