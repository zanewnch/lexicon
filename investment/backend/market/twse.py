"""
Service for fetching real-time Taiwan stock market data from TWSE/TPEx open APIs.
No authentication required — all endpoints are free and public.
"""

import logging
from datetime import date, datetime, timedelta
import urllib3

import requests
from django.conf import settings as django_settings

from core.cache import CacheManager, ServiceUnavailable

# TWSE/TPEx certs lack Subject Key Identifier — Python 3.13+ rejects them.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)
TWSE_INSTITUTIONAL_URL = "https://www.twse.com.tw/rwd/zh/fund/T86"
TWSE_STOCK_DAY_URL = "https://www.twse.com.tw/exchangeReport/STOCK_DAY"

# TWSE industry codes → Chinese names
TWSE_SECTOR_MAP = {
    "01": "水泥工業", "02": "食品工業", "03": "塑膠工業",
    "04": "紡織纖維", "05": "電機機械", "06": "電器電纜",
    "08": "玻璃陶瓷", "09": "造紙工業", "10": "鋼鐵工業",
    "11": "橡膠工業", "12": "汽車工業",
    "14": "建材營造業", "15": "航運業", "16": "觀光餐旅",
    "17": "金融保險業", "18": "貿易百貨業",
    "20": "其他業", "21": "化學工業", "22": "生技醫療業",
    "23": "油電燃氣業", "24": "半導體業", "25": "電腦及週邊設備業",
    "26": "光電業", "27": "通信網路業", "28": "電子零組件業",
    "29": "電子通路業", "30": "資訊服務業", "31": "其他電子業",
    "32": "文化創意業", "33": "農業科技業",
    "35": "綠能環保", "36": "數位雲端", "37": "運動休閒",
    "38": "居家生活", "91": "存託憑證",
}

TWSE_BASE = django_settings.TWSE_BASE_URL
TPEX_BASE = django_settings.TPEX_BASE_URL


class TWSEService:
    """TWSE / TPEx 公開資料服務。"""

    def __init__(self):
        self._http = requests.Session()
        self._http.verify = False
        self._cache = CacheManager(ttl=300)  # 5 minutes
        self._long_cache = CacheManager(ttl=3600)  # 1 hour

    @staticmethod
    def _safe_float(val: str | None, default: float = 0.0) -> float:
        if not val or val in ("--", "-", "", "N/A", "None"):
            return default
        try:
            return float(val.replace(",", ""))
        except (ValueError, AttributeError):
            return default

    def get_stock_daily_month(self, code: str, month: date) -> list[dict]:
        """Return one month's official daily OHLCV rows for a listed stock."""
        cache_key = f"stock_daily_month_{code}_{month:%Y%m}"
        cache = self._cache if (month.year, month.month) == (date.today().year, date.today().month) else self._long_cache
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        resp = self._http.get(
            TWSE_STOCK_DAY_URL,
            params={"response": "json", "date": month.strftime("%Y%m01"), "stockNo": code},
            timeout=8,
        )
        resp.raise_for_status()
        report = resp.json()
        if not isinstance(report, dict) or "stat" not in report:
            raise ValueError("TWSE STOCK_DAY response format changed")
        if report["stat"] != "OK":
            return []
        fields = report.get("fields")
        rows = report.get("data")
        if not isinstance(fields, list) or not isinstance(rows, list):
            raise ValueError("TWSE STOCK_DAY has no rows or fields")
        column = {name: fields.index(name) for name in ("日期", "成交股數", "開盤價", "最高價", "最低價", "收盤價")}
        result = []
        for row in rows:
            roc_year, m, d = (int(value) for value in row[column["日期"]].split("/"))
            result.append({
                "ts": date(roc_year + 1911, m, d).isoformat() + "T13:30:00+08:00",
                "open": self._safe_float(row[column["開盤價"]]),
                "high": self._safe_float(row[column["最高價"]]),
                "low": self._safe_float(row[column["最低價"]]),
                "close": self._safe_float(row[column["收盤價"]]),
                "volume": int(self._safe_float(row[column["成交股數"]]) / 1000),
            })
        cache.set(cache_key, result)
        return result

    # ----- Raw data fetchers -----

    def _fetch_twse_stock_day_all(self) -> list[dict]:
        cached = self._cache.get("twse_stock_day_all")
        if cached is not None:
            return cached
        try:
            resp = self._http.get(f"{TWSE_BASE}/exchangeReport/STOCK_DAY_ALL", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            self._cache.set("twse_stock_day_all", data)
            return data
        except Exception:
            logger.exception("Failed to fetch TWSE STOCK_DAY_ALL")
            return []

    def _fetch_twse_bwibbu_all(self) -> list[dict]:
        cached = self._cache.get("twse_bwibbu_all")
        if cached is not None:
            return cached
        try:
            resp = self._http.get(f"{TWSE_BASE}/exchangeReport/BWIBBU_ALL", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            self._cache.set("twse_bwibbu_all", data)
            return data
        except Exception:
            logger.exception("Failed to fetch TWSE BWIBBU_ALL")
            return []

    def _fetch_tpex_stock_day_all(self) -> list[dict]:
        cached = self._cache.get("tpex_stock_day_all")
        if cached is not None:
            return cached
        try:
            resp = self._http.get(f"{TPEX_BASE}/tpex_mainboard_daily_close_quotes", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            self._cache.set("tpex_stock_day_all", data)
            return data
        except Exception:
            logger.exception("Failed to fetch TPEx daily quotes")
            return []

    def _fetch_tpex_pe_analysis(self) -> list[dict]:
        cached = self._cache.get("tpex_pe_analysis")
        if cached is not None:
            return cached
        try:
            resp = self._http.get(f"{TPEX_BASE}/tpex_mainboard_peratio_analysis", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            self._cache.set("tpex_pe_analysis", data)
            return data
        except Exception:
            logger.exception("Failed to fetch TPEx PE analysis")
            return []

    # ----- Sector maps -----

    def _get_twse_company_maps(self) -> tuple[dict[str, str], dict[str, float]]:
        """Parse t187ap03_L once → (sector_map, shares_map).

        shares_map: code → approximate shares outstanding
        Derived from 實收資本額 (TWD) ÷ 普通股面額 (default 10).
        """
        cached = self._cache.get("twse_company_maps")
        if cached is not None:
            return cached

        sector_map: dict[str, str] = {}
        shares_map: dict[str, float] = {}
        try:
            resp = self._http.get(f"{TWSE_BASE}/opendata/t187ap03_L", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            for row in data:
                code = row.get("公司代號", "").strip()
                if not code:
                    continue
                sector_code = row.get("產業別", "").strip()
                if sector_code:
                    sector_map[code] = TWSE_SECTOR_MAP.get(sector_code, sector_code)
                try:
                    capital = float(str(row.get("實收資本額", "") or "0").replace(",", ""))
                    face = float(str(row.get("普通股面額", "10") or "10").replace(",", "")) or 10
                    if capital > 0:
                        shares_map[code] = capital / face
                except (ValueError, ZeroDivisionError):
                    pass
        except Exception:
            logger.exception("Failed to fetch TWSE company info")

        result = (sector_map, shares_map)
        self._cache.set("twse_company_maps", result)
        return result

    def _get_twse_sector_map(self) -> dict[str, str]:
        return self._get_twse_company_maps()[0]

    def _get_tpex_company_maps(self) -> tuple[dict[str, str], dict[str, float]]:
        """Parse mopsfin_t187ap03_O once → (sector_map, shares_map)."""
        cached = self._cache.get("tpex_company_maps")
        if cached is not None:
            return cached

        sector_map: dict[str, str] = {}
        shares_map: dict[str, float] = {}
        try:
            resp = self._http.get(f"{TPEX_BASE}/mopsfin_t187ap03_O", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            for row in data:
                code = row.get("SecuritiesCompanyCode", "").strip()
                if not code:
                    continue
                sector_code = row.get("SecuritiesIndustryCode", "").strip()
                if sector_code:
                    sector_map[code] = TWSE_SECTOR_MAP.get(sector_code, sector_code)
                try:
                    # OTC endpoint may expose 實收資本額 or IssueShares directly
                    capital = float(str(
                        row.get("實收資本額") or row.get("PaidInCapital") or "0"
                    ).replace(",", ""))
                    face = float(str(
                        row.get("普通股面額") or row.get("ParValue") or "10"
                    ).replace(",", "")) or 10
                    if capital > 0:
                        shares_map[code] = capital / face
                except (ValueError, ZeroDivisionError):
                    pass
        except Exception:
            logger.exception("Failed to fetch TPEx company info")

        result = (sector_map, shares_map)
        self._cache.set("tpex_company_maps", result)
        return result

    def _get_tpex_sector_map(self) -> dict[str, str]:
        return self._get_tpex_company_maps()[0]

    # ----- Public API -----

    def get_all_stocks(self) -> list[dict]:
        """Combine TWSE + TPEx data into a unified stock list."""
        cached = self._cache.get("all_stocks_unified")
        if cached is not None:
            return cached

        stocks = []
        sf = self._safe_float

        # ---- TWSE (上市) ----
        twse_day = self._fetch_twse_stock_day_all()
        twse_bwibbu = self._fetch_twse_bwibbu_all()
        twse_sectors, twse_shares = self._get_twse_company_maps()

        bwibbu_map: dict[str, dict] = {}
        for row in twse_bwibbu:
            code = row.get("Code", "").strip()
            if code:
                bwibbu_map[code] = row

        for row in twse_day:
            code = row.get("Code", "").strip()
            name = row.get("Name", "").strip()
            if not code or not name or len(code) > 4:
                continue

            close = sf(row.get("ClosingPrice"))
            open_price = sf(row.get("OpeningPrice"))
            high = sf(row.get("HighestPrice"))
            low = sf(row.get("LowestPrice"))
            volume = sf(row.get("TradeVolume"))
            turnover = sf(row.get("TradeValue"))
            change = sf(row.get("Change"))
            prev_close = close - change if close and change else 0

            bw = bwibbu_map.get(code, {})
            pe = sf(bw.get("PEratio"))
            pb = sf(bw.get("PBratio"))
            div_yield = sf(bw.get("DividendYield"))
            change_pct = (change / prev_close * 100) if prev_close else 0

            shares = twse_shares.get(code, 0)
            market_cap = close * shares if close and shares else 0
            stocks.append({
                "code": code, "name": name, "exchange": "TSE",
                "sector": twse_sectors.get(code, "其他"),
                "price": close, "change": change,
                "changePercent": round(change_pct, 2),
                "volume": volume, "turnover": turnover,
                "open": open_price, "high": high, "low": low,
                "prevClose": round(prev_close, 2),
                "pe": pe, "pb": pb, "dividendYield": div_yield,
                "market_cap": market_cap,
            })

        # ---- TPEx (上櫃) ----
        tpex_day = self._fetch_tpex_stock_day_all()
        tpex_pe = self._fetch_tpex_pe_analysis()
        tpex_sectors, tpex_shares = self._get_tpex_company_maps()

        tpex_pe_map: dict[str, dict] = {}
        for row in tpex_pe:
            code = row.get("SecuritiesCompanyCode", "").strip()
            if code:
                tpex_pe_map[code] = row

        for row in tpex_day:
            code = row.get("SecuritiesCompanyCode", "").strip()
            name = row.get("CompanyName", "").strip()
            if not code or not name or len(code) > 4:
                continue

            close = sf(row.get("Close"))
            open_price = sf(row.get("Open"))
            high = sf(row.get("High"))
            low = sf(row.get("Low"))
            volume = sf(row.get("TradingShares"))
            turnover = sf(row.get("TransactionAmount"))
            change = sf(row.get("Change"))
            prev_close = close - change if close else 0

            pe_row = tpex_pe_map.get(code, {})
            pe = sf(pe_row.get("PriceEarningRatio"))
            pb = sf(pe_row.get("PriceBookRatio"))
            div_yield = sf(pe_row.get("YieldRatio"))
            change_pct = (change / prev_close * 100) if prev_close else 0

            shares = tpex_shares.get(code, 0)
            market_cap = close * shares if close and shares else 0
            stocks.append({
                "code": code, "name": name, "exchange": "OTC",
                "sector": tpex_sectors.get(code, "其他"),
                "price": close, "change": change,
                "changePercent": round(change_pct, 2),
                "volume": volume, "turnover": turnover,
                "open": open_price, "high": high, "low": low,
                "prevClose": round(prev_close, 2),
                "pe": pe, "pb": pb, "dividendYield": div_yield,
                "market_cap": market_cap,
            })

        self._cache.set("all_stocks_unified", stocks)
        return stocks

    def get_sectors_summary(self) -> list[dict]:
        """Group stocks by sector and compute sector-level stats."""
        stocks = self.get_all_stocks()

        sector_groups: dict[str, list[dict]] = {}
        for s in stocks:
            sector = s.get("sector", "其他")
            sector_groups.setdefault(sector, []).append(s)

        sectors = []
        for name, group in sector_groups.items():
            avg_change = sum(s["changePercent"] for s in group) / len(group) if group else 0

            sorted_by_change = sorted(group, key=lambda x: x["changePercent"], reverse=True)
            top_gainers = [
                {"code": s["code"], "name": s["name"], "changePercent": s["changePercent"]}
                for s in sorted_by_change[:3] if s["changePercent"] > 0
            ]
            top_losers = [
                {"code": s["code"], "name": s["name"], "changePercent": s["changePercent"]}
                for s in sorted_by_change[-3:] if s["changePercent"] < 0
            ]
            total_turnover = sum(s["turnover"] for s in group)

            sectors.append({
                "name": name,
                "stockCount": len(group),
                "avgChange": round(avg_change, 2),
                "totalTurnover": total_turnover,
                "up": avg_change >= 0,
                "topGainers": top_gainers,
                "topLosers": list(reversed(top_losers)),
                "stocks": [
                    {"code": s["code"], "name": s["name"], "changePercent": s["changePercent"],
                     "price": s["price"], "volume": s["volume"]}
                    for s in sorted_by_change
                ],
            })

        sectors.sort(key=lambda x: x["totalTurnover"], reverse=True)
        return sectors

    def get_treemap_data(self) -> list[dict]:
        """Prepare data for a treemap/heatmap."""
        return [
            {
                "code": s["code"], "name": s["name"], "sector": s["sector"],
                "exchange": s["exchange"], "price": s["price"],
                "changePercent": s["changePercent"], "turnover": s["turnover"],
            }
            for s in self.get_all_stocks()
            if s["price"] > 0 and s["turnover"] > 0
        ]

    def _fetch_institutional_report(self, report_date: str | None = None) -> dict:
        """Fetch and cache an official TWSE T86 daily report."""
        cache_key = f"institutional_report_{report_date or 'latest'}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached
        params = {"response": "json", "selectType": "ALLBUT0999"}
        if report_date:
            params["date"] = report_date
        resp = self._http.get(TWSE_INSTITUTIONAL_URL, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or "stat" not in data:
            raise ValueError("TWSE T86 response format changed")
        if data["stat"] == "OK":
            if not isinstance(data.get("data"), list) or not isinstance(data.get("fields"), list):
                raise ValueError("TWSE T86 report has no rows or fields")
            self._cache.set(cache_key, data)
        return data

    def get_institutional_trading(self, code: str, days: int = 5) -> list[dict]:
        """Fetch up to N recent trading days from official TWSE T86 reports."""
        days = max(1, min(days, 10))
        cache_key = f"institutional_{code}_{days}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            result = []
            report = self._fetch_institutional_report()
            if report["stat"] != "OK":
                raise ValueError(f"TWSE T86 latest report: {report['stat']}")
            latest = datetime.strptime(report["date"], "%Y%m%d").date()
            for offset in range(days * 3 + 2):
                if len(result) >= days:
                    break
                if offset:
                    day = latest - timedelta(days=offset)
                    if day.weekday() >= 5:
                        continue
                    report = self._fetch_institutional_report(day.strftime("%Y%m%d"))
                    if report["stat"] != "OK":
                        continue
                fields = report["fields"]
                foreign_idx = fields.index("外陸資買賣超股數(不含外資自營商)")
                trust_idx = fields.index("投信買賣超股數")
                dealer_idx = fields.index("自營商買賣超股數")
                for row in report["data"]:
                    if row[0].strip() == code:
                        result.append({
                            "date": datetime.strptime(report["date"], "%Y%m%d").date().isoformat(),
                            "foreign": int(self._safe_float(row[foreign_idx]) / 1000),
                            "trust": int(self._safe_float(row[trust_idx]) / 1000),
                            "dealer": int(self._safe_float(row[dealer_idx]) / 1000),
                        })
                        break
            self._cache.set(cache_key, result)
            return result
        except Exception as exc:
            logger.exception("Failed to fetch institutional trading for %s", code)
            raise ServiceUnavailable("證交所法人資料來源回應異常，請稍後重試") from exc

    def get_monthly_revenue_map(self) -> dict[str, dict]:
        """Fetch monthly revenue for all TSE + OTC stocks."""
        cached = self._long_cache.get("monthly_revenue_map")
        if cached is not None:
            return cached

        sf = self._safe_float
        result: dict[str, dict] = {}

        # TSE
        try:
            resp = self._http.get(
                f"{TWSE_BASE}/opendata/t187ap04_L", timeout=15,
            )
            resp.raise_for_status()
            for row in resp.json():
                code = row.get("公司代號", "").strip()
                if not code:
                    continue
                result[code] = {
                    "revenue": sf(row.get("當月營收")),
                    "mom_pct": sf(row.get("當月比上月增減(%)")),
                    "yoy_pct": sf(row.get("當月比去年同月增減(%)")),
                }
        except Exception:
            logger.exception("Failed to fetch TSE monthly revenue")

        # OTC
        try:
            resp = self._http.get(
                f"{TPEX_BASE}/mopsfin_t187ap04_O", timeout=15,
            )
            resp.raise_for_status()
            for row in resp.json():
                code = row.get("公司代號", "").strip()
                if not code:
                    continue
                result[code] = {
                    "revenue": sf(row.get("當月營收")),
                    "mom_pct": sf(row.get("當月比上月增減(%)")),
                    "yoy_pct": sf(row.get("當月比去年同月增減(%)")),
                }
        except Exception:
            logger.exception("Failed to fetch OTC monthly revenue")

        self._long_cache.set("monthly_revenue_map", result)
        return result

    def get_institutional_net_all(self) -> dict[str, int]:
        """Fetch institutional net buy/sell for ALL stocks."""
        cached = self._cache.get("institutional_net_all")
        if cached is not None:
            return cached

        result: dict[str, int] = {}
        try:
            report = self._fetch_institutional_report()
            if report["stat"] != "OK":
                raise ValueError(f"TWSE T86 latest report: {report['stat']}")
            fields = report["fields"]
            foreign_idx = fields.index("外陸資買賣超股數(不含外資自營商)")
            trust_idx = fields.index("投信買賣超股數")
            for row in report["data"]:
                code = row[0].strip()
                if not code:
                    continue
                result[code] = int((self._safe_float(row[foreign_idx]) + self._safe_float(row[trust_idx])) / 1000)
        except Exception:
            logger.exception("Failed to fetch institutional net for all stocks")
            return {}

        self._cache.set("institutional_net_all", result)
        return result

    def get_rankings(self, rank_type: str = "yield", limit: int = 50) -> list[dict]:
        """Get top-N rankings by different criteria."""
        stocks = self.get_all_stocks()

        sort_configs = {
            "yield": (lambda s: s["dividendYield"] > 0, "dividendYield", True),
            "pe_low": (lambda s: 0 < s["pe"] < 200, "pe", False),
            "pe_high": (lambda s: s["pe"] > 0, "pe", True),
            "volume": (lambda s: s["volume"] > 0, "volume", True),
            "gainers": (lambda s: s["changePercent"] > 0, "changePercent", True),
            "losers": (lambda s: s["changePercent"] < 0, "changePercent", False),
            "turnover": (lambda s: s["turnover"] > 0, "turnover", True),
        }

        config = sort_configs.get(rank_type)
        if config:
            filter_fn, sort_key, reverse = config
            filtered = [s for s in stocks if filter_fn(s)]
            filtered.sort(key=lambda x: x[sort_key], reverse=reverse)
        else:
            filtered = stocks

        return filtered[:limit]
