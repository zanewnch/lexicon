"""
政策導向爬蟲
資料來源：
  1. 鉅亨網關鍵字搜尋 (api.cnyes.com)
  2. 行政院新聞稿 (ey.gov.tw)
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser

import requests
import urllib3
from django.conf import settings as django_settings

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
POLICY_KEYWORDS = ['綠能', '半導體補貼', '國防預算', 'AI算力', '再生能源', '晶圓廠']

EY_NEWS_URL = django_settings.EY_NEWS_URL
EY_BASE_URL = django_settings.EY_BASE_URL

_cache: dict = {}
CACHE_TTL = 3600  # 1 小時


def _get_cache(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry['ts'] < CACHE_TTL:
        return entry['data']
    return None


def _set_cache(key: str, data):
    _cache[key] = {'data': data, 'ts': time.time()}


def _fetch_anue_keywords() -> list[dict]:
    """對每個政策關鍵字呼叫鉅亨網 API，合併去重後回傳"""
    seen_ids: set[str] = set()
    results = []

    for kw in POLICY_KEYWORDS:
        try:
            resp = requests.get(
                ANUE_SEARCH_URL,
                params={'keyword': kw, 'limit': 5},
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
                    'source': 'anue_keyword',
                    'source_label': f'鉅亨網｜{kw}',
                    'title': item.get('title', '').strip(),
                    'date': date_str,
                    'url': f'https://news.cnyes.com/news/id/{nid}',
                })
        except Exception as e:
            logger.warning(f'鉅亨網關鍵字「{kw}」失敗: {e}')

    return results


class _EyParser(HTMLParser):
    """解析行政院新聞列表頁，抓取標題與連結"""

    def __init__(self):
        super().__init__()
        self.results: list[dict] = []
        self._a_href = ''
        self._a_text = ''
        self._in_a = False

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            d = dict(attrs)
            href = d.get('href', '')
            # 行政院新聞詳情頁格式：/Page/<page_id>/<article_id>（三層路徑）
            if href.startswith('/Page/') and href.count('/') >= 3:
                self._in_a = True
                self._a_href = href
                self._a_text = ''

    def handle_endtag(self, tag):
        if tag == 'a' and self._in_a:
            self._in_a = False
            title = self._a_text.strip()
            if len(title) > 5:  # 過濾過短的連結文字（選單項等）
                self.results.append({'href': self._a_href, 'title': title})

    def handle_data(self, data):
        if self._in_a:
            self._a_text += data


def _fetch_ey_press() -> list[dict]:
    """爬取行政院新聞稿列表，失敗時回傳空列表不拋例外"""
    try:
        # ey.gov.tw 憑證缺少 Subject Key Identifier，停用 SSL 驗證
        resp = requests.get(EY_NEWS_URL, headers=HEADERS, timeout=15, verify=False)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or 'utf-8'

        parser = _EyParser()
        parser.feed(resp.text)

        return [
            {
                'source': 'ey_gov',
                'source_label': '行政院新聞稿',
                'title': item['title'],
                'date': '',
                'url': EY_BASE_URL + item['href'],
            }
            for item in parser.results[:10]
        ]
    except Exception as e:
        logger.warning(f'行政院新聞稿爬取失敗: {e}')
        return []


def fetch_policy_news() -> dict:
    """整合所有政策來源，快取 1 小時"""
    cached = _get_cache('policy_news_all')
    if cached is not None:
        return cached

    with ThreadPoolExecutor(max_workers=2) as executor:
        f_anue = executor.submit(_fetch_anue_keywords)
        f_ey = executor.submit(_fetch_ey_press)
        anue_items = f_anue.result()
        ey_items = f_ey.result()

    all_items = anue_items + ey_items
    all_items.sort(key=lambda x: x['date'] or '0000', reverse=True)

    result = {
        'items': all_items[:30],
        'fetched_at': datetime.now(timezone.utc).isoformat(),
        'sources': {
            'anue_keywords': len(anue_items),
            'ey_gov': len(ey_items),
        },
    }
    _set_cache('policy_news_all', result)
    return result
