"""
週期反轉指標抓取器
資料來源：stooq.com（免費、無需 API key）
"""

import csv
import logging
from datetime import datetime, timedelta
from io import StringIO

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    )
}

INDICATORS = [
    {
        'id': 'bdi',
        'name': 'BDI 波羅的海乾散貨指數',
        'symbol': 'bdi.us',
        'category': 'shipping',
        'unit': '點',
        'desc': '反映全球乾散貨航運需求，上漲代表原物料貿易熱絡',
    },
    {
        'id': 'copper',
        'name': '銅價（期貨）',
        'symbol': 'hg.f',
        'category': 'commodity',
        'unit': 'USD/lb',
        'desc': '「銅博士」，對全球製造業景氣高度敏感',
    },
    {
        'id': 'oil_wti',
        'name': 'WTI 原油',
        'symbol': 'cl.f',
        'category': 'commodity',
        'unit': 'USD/barrel',
        'desc': '美國輕甜原油，能源週期的核心指標',
    },
    {
        'id': 'dram',
        'name': 'DRAM 現貨指數（Micron 股價代理）',
        'symbol': 'mu.us',
        'category': 'semiconductor',
        'unit': 'USD',
        'desc': '以 Micron 股價作為記憶體週期的市場預期代理指標',
    },
]


def _fetch_stooq(symbol: str, days: int = 90) -> list[dict]:
    """從 stooq.com 抓取歷史收盤價，回傳最近 N 天的資料"""
    url = f'{settings.STOOQ_BASE_URL}?s={symbol}&i=d'
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        reader = csv.DictReader(StringIO(resp.text))
        rows = []
        cutoff = datetime.today() - timedelta(days=days)
        for row in reader:
            try:
                date = datetime.strptime(row['Date'], '%Y-%m-%d')
                if date >= cutoff:
                    rows.append({
                        'date': row['Date'],
                        'close': float(row['Close']),
                    })
            except (ValueError, KeyError):
                continue
        return sorted(rows, key=lambda r: r['date'])
    except Exception as e:
        logger.warning(f'stooq fetch failed for {symbol}: {e}')
        return []


def _calc_change(rows: list[dict]) -> dict:
    """計算最新值、1M 前、3M 前的變化"""
    if not rows:
        return {'latest': None, 'latest_date': None, 'chg_1m': None, 'chg_3m': None}

    latest = rows[-1]
    latest_val = latest['close']
    latest_date = latest['date']

    def find_closest(target_date: datetime) -> float | None:
        # 找最接近目標日期且不超過的那筆
        best = None
        for r in rows:
            d = datetime.strptime(r['date'], '%Y-%m-%d')
            if d <= target_date:
                best = r['close']
        return best

    val_1m = find_closest(datetime.today() - timedelta(days=30))
    val_3m = find_closest(datetime.today() - timedelta(days=90))

    def pct(old, new):
        if old and new and old != 0:
            return round((new - old) / old * 100, 2)
        return None

    return {
        'latest': round(latest_val, 2),
        'latest_date': latest_date,
        'chg_1m': pct(val_1m, latest_val),
        'chg_3m': pct(val_3m, latest_val),
    }


def fetch_all_indicators() -> list[dict]:
    """抓取所有週期反轉指標，回傳結構化資料"""
    result = []
    for ind in INDICATORS:
        rows = _fetch_stooq(ind['symbol'])
        stats = _calc_change(rows)
        result.append({
            **ind,
            **stats,
            'history': rows[-30:],  # 最近 30 筆給前端畫迷你圖
        })
    return result
