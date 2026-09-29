"""
財務基本面資料抓取器
資料來源：
  1. FinMind API（免費額度）— 月營收、財務比率、法人買賣超
  2. Goodinfo 台灣股市資訊網 — ROE、毛利率、營益率、法人持股
"""

import logging
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser

import requests
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

FINMIND_BASE = django_settings.FINMIND_BASE_URL

# ── 快取 ─────────────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = 1800  # 30 分鐘


def _get_cache(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry['ts'] < CACHE_TTL:
        return entry['data']
    return None


def _set_cache(key: str, data):
    _cache[key] = {'data': data, 'ts': time.time()}


# ══════════════════════════════════════════════════════════════════
# FinMind API
# ══════════════════════════════════════════════════════════════════

def _finmind_get(dataset: str, stock_id: str, start_date: str, token: str = '') -> list[dict]:
    """通用 FinMind GET 請求"""
    try:
        resp = requests.get(FINMIND_BASE, params={
            'dataset': dataset,
            'data_id': stock_id,
            'start_date': start_date,
            'token': token,
        }, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        payload = resp.json()
        if payload.get('status') != 200:
            logger.warning(f'FinMind {dataset} status={payload.get("status")}: {payload.get("msg")}')
            return []
        return payload.get('data', [])
    except Exception as e:
        logger.warning(f'FinMind {dataset} for {stock_id} failed: {e}')
        return []


def finmind_monthly_revenue(stock_id: str, token: str = '') -> list[dict]:
    """月營收（含 MoM / YoY）"""
    start = (datetime.today() - timedelta(days=730)).strftime('%Y-%m-%d')
    rows = _finmind_get('TaiwanStockMonthRevenue', stock_id, start, token)
    result = []
    for r in rows:
        result.append({
            'date': r.get('date', ''),
            'revenue': r.get('revenue', 0),
            'revenue_month': r.get('revenue_month', 0),
            'revenue_year': r.get('revenue_year', 0),
            'yoy': r.get('revenue_year', 0),
        })
    # 計算 MoM
    for i in range(1, len(result)):
        prev = result[i - 1]['revenue']
        curr = result[i]['revenue']
        if prev and prev != 0:
            result[i]['mom'] = round((curr - prev) / abs(prev) * 100, 2)
        else:
            result[i]['mom'] = None
    if result:
        result[0]['mom'] = None
    return result[-24:]  # 最近 24 個月


def finmind_financial_statements(stock_id: str, token: str = '') -> list[dict]:
    """財務報表（含 ROE、毛利率、營益率、淨利率）"""
    start = (datetime.today() - timedelta(days=1095)).strftime('%Y-%m-%d')  # 3 年
    rows = _finmind_get('TaiwanStockFinancialStatements', stock_id, start, token)

    # FinMind 回傳的是 type+value 的 long format，需要 pivot
    # 每筆 row: {date, stock_id, type, value}
    quarters: dict[str, dict] = {}
    for r in rows:
        date = r.get('date', '')
        typ = r.get('type', '')
        val = r.get('value', None)
        if not date or not typ:
            continue
        if date not in quarters:
            quarters[date] = {'date': date}
        quarters[date][typ] = val

    return sorted(quarters.values(), key=lambda x: x['date'])[-12:]  # 最近 12 季


def finmind_profit_ratios(stock_id: str, token: str = '') -> list[dict]:
    """獲利能力指標（ROE、ROA、毛利率等）
    使用 TaiwanStockProfitability 資料集"""
    start = (datetime.today() - timedelta(days=1095)).strftime('%Y-%m-%d')
    rows = _finmind_get('TaiwanStockProfitability', stock_id, start, token)
    # 欄位：date, stock_id, roe, roa, gross_margin, operating_margin, net_margin, ...
    return rows[-12:]


def finmind_institutional(stock_id: str, token: str = '') -> list[dict]:
    """三大法人買賣超"""
    start = (datetime.today() - timedelta(days=90)).strftime('%Y-%m-%d')
    rows = _finmind_get('TaiwanStockInstitutionalInvestorsBuySell', stock_id, start, token)
    # 整理成日期為 key
    daily: dict[str, dict] = {}
    for r in rows:
        date = r.get('date', '')
        name = r.get('name', '')
        buy = r.get('buy', 0)
        sell = r.get('sell', 0)
        if not date:
            continue
        if date not in daily:
            daily[date] = {'date': date, 'foreign_net': 0, 'trust_net': 0, 'dealer_net': 0, 'total_net': 0}
        net = buy - sell
        if '外資' in name or 'Foreign' in name:
            daily[date]['foreign_net'] += net
        elif '投信' in name or 'Investment_Trust' in name:
            daily[date]['trust_net'] += net
        elif '自營' in name or 'Dealer' in name:
            daily[date]['dealer_net'] += net
        daily[date]['total_net'] = (
            daily[date]['foreign_net'] + daily[date]['trust_net'] + daily[date]['dealer_net']
        )
    return sorted(daily.values(), key=lambda x: x['date'])[-60:]  # 最近 60 天


def fetch_finmind_all(stock_id: str, token: str = '') -> dict:
    """並行抓取所有 FinMind 資料"""
    cache_key = f'finmind_{stock_id}'
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    with ThreadPoolExecutor(max_workers=4) as pool:
        f_rev = pool.submit(finmind_monthly_revenue, stock_id, token)
        f_fin = pool.submit(finmind_financial_statements, stock_id, token)
        f_profit = pool.submit(finmind_profit_ratios, stock_id, token)
        f_inst = pool.submit(finmind_institutional, stock_id, token)

        revenue = f_rev.result()
        statements = f_fin.result()
        profitability = f_profit.result()
        institutional = f_inst.result()

    result = {
        'source': 'FinMind',
        'stock_id': stock_id,
        'revenue': revenue,
        'statements': statements,
        'profitability': profitability,
        'institutional': institutional,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }
    _set_cache(cache_key, result)
    return result


# ══════════════════════════════════════════════════════════════════
# Goodinfo 爬蟲
# ══════════════════════════════════════════════════════════════════

_GOODINFO_UAS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
]

GOODINFO_BASE = django_settings.GOODINFO_BASE_URL


def _goodinfo_session(stock_id: str) -> requests.Session:
    """
    建立帶有 Goodinfo cookies 的 Session。
    先訪問首頁拿 cookie，再帶著 cookie 訪問目標頁，模擬真實瀏覽器行為。
    """
    ua = random.choice(_GOODINFO_UAS)
    session = requests.Session()
    session.headers.update({
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    try:
        logger.info(f'[Goodinfo] Session 暖機：訪問首頁取 cookie...')
        r = session.get('https://goodinfo.tw/tw/index.asp', timeout=10)
        logger.info(f'[Goodinfo] 首頁 status={r.status_code}, content-length={len(r.content)} bytes')
        r.encoding = r.apparent_encoding or 'utf-8'
        home_html = r.text

        # 首頁也可能觸發 JS cookie challenge
        if len(home_html) < 3000 and 'setCookie' in home_html:
            logger.info(f'[Goodinfo] 首頁觸發 JS challenge，解析 cookie...')
            _solve_js_cookie_challenge(session, home_html)
            # 帶著新 cookie 再訪問一次首頁
            time.sleep(random.uniform(0.8, 1.2))
            r2 = session.get('https://goodinfo.tw/tw/index.asp', timeout=10)
            logger.info(f'[Goodinfo] 首頁第二次 status={r2.status_code}, cookies={dict(session.cookies)}')
        else:
            logger.info(f'[Goodinfo] 首頁 cookies={dict(session.cookies)}')

        delay = random.uniform(0.8, 1.5)
        logger.info(f'[Goodinfo] 暖機延遲 {delay:.2f}s')
        time.sleep(delay)
    except Exception as e:
        logger.warning(f'[Goodinfo] 首頁暖機失敗（繼續執行）: {e}')
    return session


class _GoodinfoTableParser(HTMLParser):
    """
    通用 Goodinfo HTML table 解析器。
    抓取 id 符合指定 prefix 的 <table> 中所有 <tr>/<td> 內容。
    """

    def __init__(self, table_id_prefix: str = ''):
        super().__init__()
        self.table_id_prefix = table_id_prefix
        self.rows: list[list[str]] = []
        self._in_target_table = False
        self._in_row = False
        self._in_cell = False
        self._current_row: list[str] = []
        self._cell_text = ''
        self._table_depth = 0

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'table':
            self._table_depth += 1
            tid = d.get('id', '')
            if self.table_id_prefix and tid.startswith(self.table_id_prefix):
                self._in_target_table = True
            elif not self.table_id_prefix and self._table_depth == 1:
                self._in_target_table = True
        if self._in_target_table:
            if tag == 'tr':
                self._in_row = True
                self._current_row = []
            elif tag in ('td', 'th') and self._in_row:
                self._in_cell = True
                self._cell_text = ''

    def handle_endtag(self, tag):
        if tag == 'table':
            if self._in_target_table and self._table_depth > 0:
                self._in_target_table = False
            self._table_depth = max(0, self._table_depth - 1)
        if self._in_target_table:
            if tag in ('td', 'th') and self._in_cell:
                self._in_cell = False
                self._current_row.append(self._cell_text.strip())
            elif tag == 'tr' and self._in_row:
                self._in_row = False
                if self._current_row:
                    self.rows.append(self._current_row)

    def handle_data(self, data):
        if self._in_cell:
            self._cell_text += data


def _parse_number(s: str) -> float | None:
    """清理 Goodinfo 數字字串"""
    s = s.replace(',', '').replace('%', '').replace('％', '').replace(' ', '').strip()
    if not s or s in ('-', '—', 'N/A', ''):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _solve_js_cookie_challenge(session: requests.Session, html: str) -> bool:
    """
    解析 Goodinfo JS cookie challenge 頁面，手動設定 cookie 後回傳 True。

    Goodinfo 的 CLIENT_KEY cookie 格式（6 欄以 | 分隔）：
      arr[0]  = 版本號（如 2.2）
      arr[1]  = 伺服器靜態值 1
      arr[2]  = 伺服器靜態值 2
      arr[3]  = GetTimezoneOffset()（JS 的 Date.getTimezoneOffset，UTC+8 回傳 -480）
      arr[4]  = Date.now()/86400000 - GetTimezoneOffset()/1440（建立時的天數）
      arr[5]  = 同 arr[4]（每次重整更新；驗證 arr[5]-arr[4] < 60/1440=1小時）

    挑戰頁的 setCookie 呼叫格式：
      setCookie('CLIENT_KEY',
                '2.2|val1|val2|' + String(GetTimezoneOffset()) + '|' +
                String(Date.now()/86400000-GetTimezoneOffset()/1440) + '|' +
                String(Date.now()/86400000-GetTimezoneOffset()/1440), 7, '/');

    策略：
    1. 用正則提取靜態前綴（arr[0]|arr[1]|arr[2]|）
    2. 在 Python 計算 JS 等效的 timezone offset 和天數
    3. 組合完整 cookie value 並寫入 session
    """
    solved = False

    # ── 嘗試解析 CLIENT_KEY（動態 JS 運算式格式）──────────────────
    key_prefix_pattern = r"setCookie\s*\(\s*['\"]CLIENT_KEY['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\+"
    prefix_match = re.search(key_prefix_pattern, html, re.IGNORECASE | re.DOTALL)
    if prefix_match:
        static_prefix = prefix_match.group(1)  # e.g. '2.2|44098.76|46320.99|'
        logger.info(f'[Goodinfo] CLIENT_KEY 靜態前綴: {static_prefix!r}')

        # 計算 JS 等效值
        # JS: new Date().getTimezoneOffset() → UTC+8 = -480
        import time as _time
        tz_offset = int(_time.timezone / 60)  # seconds west → minutes (JS convention matches)
        day_now = _time.time() * 1000 / 86400000 - tz_offset / 1440

        client_key = f"{static_prefix}{tz_offset}|{day_now}|{day_now}"
        logger.info(f'[Goodinfo] 計算出 CLIENT_KEY={client_key[:60]}...')
        session.cookies.set('CLIENT_KEY', client_key, domain='goodinfo.tw')
        solved = True

    # ── 嘗試解析其他靜態 setCookie 呼叫（fallback）────────────────
    simple_pattern = r"setCookie\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*(?:,\s*[^)]+)?\)"
    simple_matches = re.findall(simple_pattern, html, re.IGNORECASE)
    for name, value in simple_matches:
        logger.info(f'[Goodinfo] 靜態 setCookie → {name}={value}')
        session.cookies.set(name, value, domain='goodinfo.tw')
        solved = True

    if not solved:
        logger.warning(f'[Goodinfo] JS challenge 頁面無法解析，原始內容:\n{html[:800]}')

    return solved


def _goodinfo_fetch_with_retry(session: requests.Session, url: str, referer: str,
                               max_retries: int = 4) -> str | None:
    """
    帶重試的 Goodinfo 頁面抓取。
    策略：
      - 每次重試隨機換 UA
      - 偵測 JS cookie challenge（< 2000 chars 且含 setCookie）→ 解析並立即重試
      - 403 硬封鎖 → 指數退避（1s, 2s, 4s）+ 隨機抖動
      - 其他軟封鎖（含驗證關鍵字）→ 短暫等待後重試
    """
    logger.info(f'[Goodinfo] 開始抓取: {url}')

    for attempt in range(max_retries):
        ua = random.choice(_GOODINFO_UAS)
        logger.info(f'[Goodinfo] attempt {attempt+1}/{max_retries}, UA={ua[:40]}...')

        try:
            session.headers.update({
                'User-Agent': ua,
                'Referer': referer,
                'DNT': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
            })

            logger.info(f'[Goodinfo] 送出 GET 請求...')
            resp = session.get(url, timeout=15)
            logger.info(f'[Goodinfo] HTTP status={resp.status_code}, content-length={len(resp.content)} bytes')

            # 硬封鎖
            if resp.status_code == 403:
                wait = 2 ** attempt + random.uniform(0.5, 1.5)
                logger.warning(f'[Goodinfo] 403 硬封鎖，等待 {wait:.1f}s 後重試')
                time.sleep(wait)
                continue

            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or 'utf-8'
            html = resp.text
            logger.info(f'[Goodinfo] HTML 長度={len(html)} 字元')

            # JS cookie challenge 偵測（頁面過短 + 含 setCookie）
            if len(html) < 3000 and 'setCookie' in html:
                logger.warning(f'[Goodinfo] 偵測到 JS cookie challenge（{len(html)} chars），嘗試手動解析...')
                solved = _solve_js_cookie_challenge(session, html)
                if solved:
                    # 短暫模擬 JS 執行後 reload 的延遲
                    wait = random.uniform(1.0, 2.0)
                    logger.info(f'[Goodinfo] Cookie 已設定，等待 {wait:.1f}s 後重試（模擬 location.reload）')
                    time.sleep(wait)
                else:
                    wait = 2 ** attempt + random.uniform(1.0, 2.0)
                    logger.warning(f'[Goodinfo] JS challenge 解析失敗，等待 {wait:.1f}s 後重試')
                    time.sleep(wait)
                continue

            # 其他軟封鎖
            if len(html) < 2000:
                wait = 2 ** attempt + random.uniform(1.0, 2.0)
                logger.warning(f'[Goodinfo] 頁面過短({len(html)} chars)，疑似封鎖，等待 {wait:.1f}s 後重試')
                logger.warning(f'[Goodinfo] 頁面內容: {html[:500]}')
                time.sleep(wait)
                continue

            if '驗證' in html or 'captcha' in html.lower():
                wait = 2 ** attempt + random.uniform(1.0, 2.0)
                logger.warning(f'[Goodinfo] 偵測到驗證關鍵字，等待 {wait:.1f}s 後重試')
                time.sleep(wait)
                continue

            logger.info(f'[Goodinfo] 抓取成功！')
            return html

        except Exception as e:
            wait = 2 ** attempt + random.uniform(0.5, 1.0)
            logger.warning(f'[Goodinfo] 例外錯誤 (attempt {attempt+1}): {e}，等待 {wait:.1f}s')
            time.sleep(wait)

    logger.error(f'[Goodinfo] 全部 {max_retries} 次重試失敗: {url}')
    return None


def goodinfo_profit_ratios(stock_id: str) -> list[dict]:
    """
    從 Goodinfo 爬取獲利能力（毛利率、營益率、淨利率、ROE、EPS）
    頁面：goodinfo.tw/tw/StockBzPerformance.asp?STOCK_ID=xxxx

    反爬機制：
    1. Session 先訪問首頁拿 cookie
    2. 隨機 User-Agent
    3. 完整 Sec-Fetch headers 模擬真實瀏覽器
    4. 軟封鎖偵測（頁面太短 / 含驗證關鍵字）
    5. 指數退避重試（最多 3 次）
    """
    cache_key = f'goodinfo_profit_{stock_id}'
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    url = f'{GOODINFO_BASE}/StockBzPerformance.asp?STOCK_ID={stock_id}'
    referer = f'{GOODINFO_BASE}/StockDetail.asp?STOCK_ID={stock_id}'

    logger.info(f'[Goodinfo] goodinfo_profit_ratios 開始，stock_id={stock_id}')
    session = _goodinfo_session(stock_id)
    html = _goodinfo_fetch_with_retry(session, url, referer)

    if not html:
        logger.error(f'[Goodinfo] 獲利能力全部重試失敗，回傳空陣列 ({stock_id})')
        return []

    try:
        logger.info(f'[Goodinfo] 開始解析 HTML...')
        # StockBzPerformance 頁面的主表 id 是 tblDetail
        parser = _GoodinfoTableParser('tblDetail')
        parser.feed(html)
        logger.info(f'[Goodinfo] tblDetail 解析到 {len(parser.rows)} 行')

        # tblDetail 表頭為兩列 merge，固定欄位索引：
        # 0=年度, 12=毛利率(%), 13=營益率(%), 15=淨利率(%), 16=ROE(%), 17=ROA(%), 18=EPS
        # 資料從 row[2] 開始（row[0], row[1] 是雙層表頭）
        COL_YEAR   = 0
        COL_GROSS  = 12
        COL_OPER   = 13
        COL_NET    = 15
        COL_ROE    = 16
        COL_ROA    = 17
        COL_EPS    = 18

        results = []
        data_rows = parser.rows[2:] if len(parser.rows) > 2 else parser.rows[1:]
        for row in data_rows:
            if len(row) <= COL_EPS:
                continue
            period = row[COL_YEAR].strip()
            if not re.match(r'^\d{4}', period):
                continue
            entry: dict = {
                'period':           period,
                'gross_margin':     _parse_number(row[COL_GROSS]),
                'operating_margin': _parse_number(row[COL_OPER]),
                'net_margin':       _parse_number(row[COL_NET]),
                'roe':              _parse_number(row[COL_ROE]),
                'roa':              _parse_number(row[COL_ROA]),
                'eps':              _parse_number(row[COL_EPS]),
            }
            results.append(entry)

        # 過濾掉所有指標都是 None 的列（如尚未結束的年度）
        KEY_COLS = ('gross_margin', 'operating_margin', 'net_margin', 'roe', 'eps')
        results = [r for r in results if any(r.get(c) is not None for c in KEY_COLS)]
        results = results[:12]
        _set_cache(cache_key, results)
        logger.info(f'Goodinfo 獲利能力成功 ({stock_id}): {len(results)} 筆 → {[r["period"] for r in results]}')
        return results

    except Exception as e:
        logger.warning(f'Goodinfo 獲利能力解析失敗 ({stock_id}): {e}')
        return []


def goodinfo_monthly_revenue(stock_id: str) -> list[dict]:
    """
    從 Goodinfo 爬取月營收
    頁面：goodinfo.tw/tw/ShowSaleMonChart.asp?STOCK_ID=xxxx
    """
    cache_key = f'goodinfo_rev_{stock_id}'
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    url = f'{django_settings.GOODINFO_BASE_URL}/ShowSaleMonChart.asp?STOCK_ID={stock_id}'
    try:
        resp = requests.get(url, headers=GOODINFO_HEADERS, timeout=15)
        resp.raise_for_status()
        resp.encoding = 'utf-8'

        parser = _GoodinfoTableParser('tblDetail')
        parser.feed(resp.text)

        results = []
        if len(parser.rows) < 2:
            parser2 = _GoodinfoTableParser('')
            parser2.feed(resp.text)
            if len(parser2.rows) > 2:
                parser.rows = parser2.rows

        header = parser.rows[0] if parser.rows else []
        for row in parser.rows[1:]:
            if len(row) < 3:
                continue
            period = row[0].strip()
            if not re.match(r'^\d{4}', period):
                continue

            entry: dict = {'period': period}
            for i, col_name in enumerate(header):
                if i >= len(row):
                    break
                val = _parse_number(row[i])
                if '月營收' in col_name or '營收' in col_name:
                    if 'yoy' not in entry:
                        entry['revenue'] = val
                if '月增率' in col_name or 'MoM' in col_name.upper():
                    entry['mom'] = val
                elif '年增率' in col_name or 'YoY' in col_name.upper():
                    entry['yoy'] = val

            results.append(entry)

        results = results[:24]
        _set_cache(cache_key, results)
        return results
    except Exception as e:
        logger.warning(f'Goodinfo 月營收爬取失敗 ({stock_id}): {e}')
        return []


def goodinfo_institutional(stock_id: str) -> list[dict]:
    """
    從 Goodinfo 爬取法人買賣超
    頁面：goodinfo.tw/tw/ShowBuySaleChart.asp?STOCK_ID=xxxx&CHT_CAT=DATE
    """
    cache_key = f'goodinfo_inst_{stock_id}'
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    url = f'{django_settings.GOODINFO_BASE_URL}/ShowBuySaleChart.asp?STOCK_ID={stock_id}&CHT_CAT=DATE'
    try:
        resp = requests.get(url, headers=GOODINFO_HEADERS, timeout=15)
        resp.raise_for_status()
        resp.encoding = 'utf-8'

        parser = _GoodinfoTableParser('tblDetail')
        parser.feed(resp.text)

        results = []
        if len(parser.rows) < 2:
            parser2 = _GoodinfoTableParser('')
            parser2.feed(resp.text)
            if len(parser2.rows) > 2:
                parser.rows = parser2.rows

        header = parser.rows[0] if parser.rows else []
        for row in parser.rows[1:]:
            if len(row) < 3:
                continue
            date = row[0].strip()
            if not re.match(r'^\d{4}', date):
                continue

            entry: dict = {'date': date}
            for i, col_name in enumerate(header):
                if i >= len(row):
                    break
                val = _parse_number(row[i])
                if '外資' in col_name:
                    entry['foreign_net'] = val
                elif '投信' in col_name:
                    entry['trust_net'] = val
                elif '自營' in col_name:
                    entry['dealer_net'] = val
                elif '合計' in col_name or '三大法人' in col_name:
                    entry['total_net'] = val

            results.append(entry)

        results = results[:60]
        _set_cache(cache_key, results)
        return results
    except Exception as e:
        logger.warning(f'Goodinfo 法人買賣爬取失敗 ({stock_id}): {e}')
        return []


def fetch_goodinfo_all(stock_id: str) -> dict:
    """並行抓取所有 Goodinfo 資料"""
    cache_key = f'goodinfo_all_{stock_id}'
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    with ThreadPoolExecutor(max_workers=3) as pool:
        f_profit = pool.submit(goodinfo_profit_ratios, stock_id)
        f_rev = pool.submit(goodinfo_monthly_revenue, stock_id)
        f_inst = pool.submit(goodinfo_institutional, stock_id)

        profitability = f_profit.result()
        revenue = f_rev.result()
        institutional = f_inst.result()

    result = {
        'source': 'Goodinfo',
        'stock_id': stock_id,
        'profitability': profitability,
        'revenue': revenue,
        'institutional': institutional,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }
    _set_cache(cache_key, result)
    return result


# ══════════════════════════════════════════════════════════════════
# 統合入口
# ══════════════════════════════════════════════════════════════════

def _get_token(token: str = '') -> str:
    """取得 FinMind token：優先使用傳入的，否則從 Django settings 讀取"""
    if token:
        return token
    try:
        from django.conf import settings
        return getattr(settings, 'FINMIND_TOKEN', '')
    except Exception:
        return ''


def fetch_mixed(stock_id: str, token: str = '') -> dict:
    """
    混合來源：
    - 月營收、法人動向 → FinMind（免費版可用）
    - 獲利能力（毛利率/ROE/EPS）→ Goodinfo（加強反爬）
    """
    cache_key = f'mixed_{stock_id}'
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    with ThreadPoolExecutor(max_workers=3) as pool:
        f_rev  = pool.submit(finmind_monthly_revenue, stock_id, token)
        f_inst = pool.submit(finmind_institutional, stock_id, token)
        f_prof = pool.submit(goodinfo_profit_ratios, stock_id)

        revenue        = f_rev.result()
        institutional  = f_inst.result()
        profitability  = f_prof.result()

    result = {
        'source': 'Mixed (FinMind + Goodinfo)',
        'stock_id': stock_id,
        'revenue': revenue,
        'profitability': profitability,
        'institutional': institutional,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
    }
    _set_cache(cache_key, result)
    return result


def fetch_fundamental(stock_id: str, source: str = 'finmind', token: str = '') -> dict:
    """
    主入口：根據 source 參數決定用哪個資料源。
    source: 'finmind' | 'goodinfo' | 'both' | 'mixed'
    """
    resolved_token = _get_token(token)
    if source == 'goodinfo':
        return fetch_goodinfo_all(stock_id)
    elif source == 'mixed':
        return fetch_mixed(stock_id, resolved_token)
    elif source == 'both':
        with ThreadPoolExecutor(max_workers=2) as pool:
            f_fm = pool.submit(fetch_finmind_all, stock_id, resolved_token)
            f_gi = pool.submit(fetch_goodinfo_all, stock_id)
            fm = f_fm.result()
            gi = f_gi.result()
        return {
            'stock_id': stock_id,
            'finmind': fm,
            'goodinfo': gi,
            'fetched_at': datetime.now(timezone.utc).isoformat(),
        }
    else:
        return fetch_finmind_all(stock_id, resolved_token)
