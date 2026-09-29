"""
政府預算爬蟲
資料來源：政府資料開放平台 data.gov.tw（主計總處歲出政事別預算）
目標：比較各政事別年增率，找出政策重點賽道
"""

import io
import logging
import time
import zipfile
import xml.etree.ElementTree as ET
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
}

DATA_GOV_API = django_settings.DATA_GOV_API_URL

# 政事別 → 投資賽道對應（用於前端標記）
SECTOR_TAG = {
    '國防': '國防',
    '教育科學文化': '科技/教育',
    '經濟發展': '產業/能源',
    '環境保護': '綠能',
    '交通及建設': '基建',
    '社會福利': '社福',
    '一般政務': '行政',
    '退休撫卹': '人事',
}

_cache: dict = {}
CACHE_TTL = 86400  # 24 小時（預算每年立法一次，不需要頻繁更新）


def _get_cache(key):
    entry = _cache.get(key)
    if entry and time.time() - entry['ts'] < CACHE_TTL:
        return entry['data']
    return None


def _set_cache(key, data):
    _cache[key] = {'data': data, 'ts': time.time()}


def _search_datasets() -> list[dict]:
    """
    下載 data.gov.tw 完整資料集清單（JSON），在本地過濾主計總處「歲出政事別」相關資料集。
    /api/v2/rest/dataset 不支援 GET 搜尋，只有 /datasets/export/json 提供完整清單。
    """
    try:
        resp = requests.get(DATA_GOV_API, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        raw = resp.json()

        # 清單格式為 list，每筆為資料集 dict
        all_datasets = raw if isinstance(raw, list) else raw.get('result', [])

        keywords = ('歲出', '政事別', '預算', '主計')
        result = []
        for d in all_datasets:
            title = d.get('title', '') or ''
            org = d.get('organization', '') or ''
            if not (any(k in title for k in keywords) or 'dgbas' in org.lower()):
                continue
            resources = []
            for r in d.get('resources', []):
                fmt = r.get('format', '').upper()
                if fmt in ('CSV', 'JSON', 'XML', 'ZIP', 'XLS', 'XLSX'):
                    resources.append({
                        'format': fmt,
                        'url': r.get('url', ''),
                        'name': r.get('name', ''),
                    })
            result.append({
                'id': d.get('id', ''),
                'title': title,
                'modified': (d.get('modified') or d.get('metadata_modified') or '')[:10],
                'resources': resources,
            })
            if len(result) >= 10:
                break
        return result
    except Exception as e:
        logger.warning(f'data.gov.tw 預算資料集搜尋失敗: {e}')
        return []


def _try_parse_csv(url: str) -> list[dict]:
    """
    嘗試直接下載 CSV 並解析歲出政事別金額。
    CSV 格式依主計總處規格，欄位通常包含：政事別、本年度預算、上年度預算。
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or 'utf-8-sig'
        lines = resp.text.splitlines()
        if len(lines) < 2:
            return []

        # 找標題列
        header = [h.strip() for h in lines[0].split(',')]
        rows = []
        for line in lines[1:]:
            cols = [c.strip().strip('"') for c in line.split(',')]
            if len(cols) >= len(header):
                rows.append(dict(zip(header, cols)))

        # 嘗試抽取政事別 + 金額欄位
        result = []
        for row in rows:
            # 找含「政事別」或「科目」的欄
            name = (
                row.get('政事別') or row.get('科目名稱') or
                row.get('項目') or next(iter(row.values()), '')
            ).strip()
            if not name or len(name) < 2:
                continue

            # 找金額欄（本年度）
            this_yr = _parse_amount(
                row.get('本年度預算數') or row.get('本年') or
                row.get('114年度') or row.get('113年度') or ''
            )
            last_yr = _parse_amount(
                row.get('上年度預算數') or row.get('上年') or
                row.get('前年') or ''
            )
            if this_yr is None:
                continue

            yoy = None
            if last_yr and last_yr != 0:
                yoy = round((this_yr - last_yr) / abs(last_yr) * 100, 1)

            result.append({
                'name': name,
                'this_yr': this_yr,
                'last_yr': last_yr,
                'yoy_pct': yoy,
                'tag': SECTOR_TAG.get(name, ''),
            })
        return result
    except Exception as e:
        logger.warning(f'CSV 預算解析失敗 ({url}): {e}')
        return []


def _try_parse_zip_xml(url: str) -> list[dict]:
    """
    嘗試下載 ZIP，解壓後解析 XML，抽取歲出政事別金額。
    主計總處 ZIP 內通常有 XML 或 CSV，採用 ElementTree 解析。
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
            # 先找 CSV
            csv_files = [f for f in zf.namelist() if f.lower().endswith('.csv')]
            if csv_files:
                with zf.open(csv_files[0]) as cf:
                    content = cf.read().decode('utf-8-sig', errors='replace')
                    lines = content.splitlines()
                    if len(lines) >= 2:
                        header = [h.strip() for h in lines[0].split(',')]
                        rows = []
                        for line in lines[1:]:
                            cols = [c.strip().strip('"') for c in line.split(',')]
                            if len(cols) >= len(header):
                                rows.append(dict(zip(header, cols)))
                        return _extract_from_rows(rows)

            # 再找 XML
            xml_files = [f for f in zf.namelist() if f.lower().endswith('.xml')]
            if xml_files:
                with zf.open(xml_files[0]) as xf:
                    tree = ET.parse(xf)
                    root = tree.getroot()
                    return _extract_from_xml(root)

        return []
    except Exception as e:
        logger.warning(f'ZIP 預算解析失敗 ({url}): {e}')
        return []


def _extract_from_rows(rows: list[dict]) -> list[dict]:
    """從 CSV rows 抽取政事別金額"""
    result = []
    for row in rows:
        name = (
            row.get('政事別') or row.get('科目名稱') or
            row.get('項目') or next(iter(row.values()), '')
        ).strip()
        if not name or len(name) < 2:
            continue
        this_yr = _parse_amount(
            row.get('本年度預算數') or row.get('本年') or
            row.get('114年度') or row.get('113年度') or ''
        )
        last_yr = _parse_amount(
            row.get('上年度預算數') or row.get('上年') or row.get('前年') or ''
        )
        if this_yr is None:
            continue
        yoy = round((this_yr - last_yr) / abs(last_yr) * 100, 1) if last_yr else None
        result.append({
            'name': name, 'this_yr': this_yr,
            'last_yr': last_yr, 'yoy_pct': yoy,
            'tag': SECTOR_TAG.get(name, ''),
        })
    return result


def _extract_from_xml(root: ET.Element) -> list[dict]:
    """
    從 XML 元素樹抽取政事別金額。
    主計總處 XML 格式多樣，採用寬鬆策略：找含「政事」文字的節點。
    """
    result = []
    for elem in root.iter():
        text = (elem.text or '').strip()
        if not text or len(text) < 2:
            continue
        if any(k in text for k in SECTOR_TAG):
            # 嘗試從兄弟節點找金額
            parent = root  # 簡化：直接回傳找到的名稱
            result.append({'name': text, 'this_yr': None, 'last_yr': None,
                           'yoy_pct': None, 'tag': SECTOR_TAG.get(text, '')})
    return result[:20]


def _parse_amount(s: str) -> float | None:
    """將預算金額字串轉為數字（單位：千元）"""
    try:
        clean = s.replace(',', '').replace('，', '').replace(' ', '').strip()
        if not clean or clean in ('-', '—', ''):
            return None
        return float(clean)
    except (ValueError, AttributeError):
        return None


def fetch_budget_data() -> dict:
    """
    主入口：搜尋資料集 → 嘗試解析金額 → 回傳政事別年增率表。
    快取 24 小時。
    """
    cached = _get_cache('budget_data')
    if cached is not None:
        return cached

    datasets = _search_datasets()
    parsed_rows: list[dict] = []

    # 嘗試從第一個有 CSV 或 ZIP 資源的資料集解析
    for ds in datasets:
        if parsed_rows:
            break
        for res in ds.get('resources', []):
            fmt = res['format']
            url = res['url']
            if not url:
                continue
            if fmt == 'CSV':
                parsed_rows = _try_parse_csv(url)
            elif fmt in ('ZIP', 'XML'):
                parsed_rows = _try_parse_zip_xml(url)
            if parsed_rows:
                logger.info(f'預算資料解析成功：{ds["title"]} ({fmt})')
                break

    result = {
        'datasets': datasets,          # 可用資料集清單（含下載連結）
        'rows': parsed_rows,           # 政事別年增率（若解析成功）
        'parsed': len(parsed_rows) > 0,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
        'source': '政府資料開放平台 data.gov.tw（主計總處）',
    }
    _set_cache('budget_data', result)
    return result
