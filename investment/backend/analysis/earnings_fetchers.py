"""
台積電法說會新聞爬蟲
來源：鉅亨網關鍵字搜尋 (api.cnyes.com)
"""

import logging
import time
from datetime import datetime, timezone

import requests
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept-Language': 'zh-TW,zh;q=0.9',
}

ANUE_SEARCH_URL = django_settings.ANUE_SEARCH_URL

EARNINGS_KEYWORDS = ['台積電法說會', '台積電財報', '台積電業績', 'TSMC法說會']

_cache: dict = {}
CACHE_TTL = 3600  # 1 小時


def _get_cache(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry['ts'] < CACHE_TTL:
        return entry['data']
    return None


def _set_cache(key: str, data):
    _cache[key] = {'data': data, 'ts': time.time()}


def _fetch_anue_earnings() -> list[dict]:
    seen_ids: set[str] = set()
    results = []

    for kw in EARNINGS_KEYWORDS:
        try:
            resp = requests.get(
                ANUE_SEARCH_URL,
                params={'keyword': kw, 'limit': 10},
                headers=HEADERS,
                timeout=10,
            )
            resp.raise_for_status()
            items = resp.json().get('items', {}).get('data', [])
            for item in items:
                nid = str(item.get('newsId', ''))
                if not nid or nid in seen_ids:
                    continue
                seen_ids.add(nid)
                ts = item.get('publishAt', 0)
                date_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%d') if ts else ''
                results.append({
                    'source_label': f'鉅亨網｜{kw}',
                    'title': item.get('title', '').strip(),
                    'date': date_str,
                    'url': f'https://news.cnyes.com/news/id/{nid}',
                    'summary': item.get('summary', '').strip(),
                })
        except Exception as e:
            logger.warning(f'鉅亨網關鍵字「{kw}」失敗: {e}')

    results.sort(key=lambda x: x['date'] or '0000', reverse=True)
    return results[:20]


def fetch_earnings_news() -> dict:
    """整合台積電法說會相關新聞，快取 1 小時"""
    cached = _get_cache('tsmc_earnings_news')
    if cached is not None:
        return cached

    items = _fetch_anue_earnings()

    result = {
        'items': items,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
        'total': len(items),
    }
    _set_cache('tsmc_earnings_news', result)
    return result
