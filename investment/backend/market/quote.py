"""
Shioaji quote services — indices, stock quotes, stock detail, K-bars.
"""

import logging
import time
from datetime import date, datetime, timedelta, timezone
from threading import Lock

from core.cache import ServiceUnavailable
from core.shioaji import ShioajiConnection
from market.twse import TWSEService

logger = logging.getLogger(__name__)

INDEX_SPECS = [
    ("加權指數", "Indexs", "TSE", "TSE001"),
    ("櫃買指數", "Indexs", "OTC", "OTC101"),
    ("金融類指數", "Indexs", "TSE", "TSE017"),
    ("電子類指數", "Indexs", "TSE", "TSE028"),
    ("半導體類指數", "Indexs", "TSE", "TSE032"),
]

FUTURES_SPECS = [
    ("台指近", "Futures", "TXF", "TXFR1"),
]


class QuoteService:
    """Shioaji 即時報價服務。"""

    _kbar_lock = Lock()

    def __init__(self):
        self._conn = ShioajiConnection.get_instance()
        self._twse = TWSEService()

    @property
    def _api(self):
        try:
            return self._conn.get_api()
        except Exception as e:
            raise ServiceUnavailable("Shioaji 連線失敗") from e

    @property
    def _cache(self):
        return self._conn.cache

    @staticmethod
    def _format_value(val: float) -> str:
        return f"{val:,.2f}"

    @staticmethod
    def _format_change(val: float) -> str:
        prefix = "+" if val >= 0 else ""
        return f"{prefix}{val:,.2f}"

    @staticmethod
    def _format_percent(val: float) -> str:
        prefix = "+" if val >= 0 else ""
        return f"{prefix}{val:.2f}%"

    def get_indices(self) -> list[dict]:
        """Fetch snapshots for major market indices + TAIEX futures."""
        cached = self._cache.get("indices")
        if cached is not None:
            return cached

        api = self._api

        index_contracts = []
        index_names = []
        for name, _cat, exchange, code in INDEX_SPECS:
            try:
                contract = api.Contracts.Indexs[exchange][code]
                index_contracts.append(contract)
                index_names.append(name)
            except (KeyError, AttributeError):
                logger.warning("Index contract not found: %s.%s", exchange, code)

        futures_contracts = []
        futures_names = []
        for name, _cat, exchange, code in FUTURES_SPECS:
            try:
                contract = api.Contracts.Futures[exchange][code]
                futures_contracts.append(contract)
                futures_names.append(name)
            except (KeyError, AttributeError):
                logger.warning("Futures contract not found: %s.%s", exchange, code)

        all_contracts = index_contracts + futures_contracts
        all_names = index_names + futures_names

        if not all_contracts:
            return []

        try:
            snapshots = api.snapshots(all_contracts)
        except Exception as e:
            raise ServiceUnavailable("取得指數快照失敗") from e

        results = []
        for name, snap in zip(all_names, snapshots):
            results.append({
                "name": name,
                "value": self._format_value(snap.close),
                "change": self._format_change(snap.change_price),
                "percent": self._format_percent(snap.change_rate),
                "up": snap.change_price >= 0,
                "spark": [],
            })

        self._cache.set("indices", results)
        return results

    def get_stock_quotes(self, codes: list[str]) -> list[dict]:
        """Fetch real-time snapshots for a list of stock codes."""
        if not codes:
            return []

        cache_key = "quotes_" + ",".join(sorted(codes))
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        api = self._api

        contracts = []
        valid_codes = []
        for code in codes:
            try:
                contract = api.Contracts.Stocks[code]
                contracts.append(contract)
                valid_codes.append(code)
            except (KeyError, AttributeError):
                logger.warning("Stock contract not found: %s", code)

        if not contracts:
            return []

        try:
            snapshots = api.snapshots(contracts)
        except Exception as e:
            raise ServiceUnavailable("取得股票快照失敗") from e

        results = []
        for code, contract, snap in zip(valid_codes, contracts, snapshots):
            name = getattr(contract, "name", code)
            change = snap.change_price
            results.append({
                "code": code,
                "name": name,
                "price": snap.close,
                "change": change,
                "percent": round(snap.change_rate, 2),
                "volume": int(snap.total_volume),
                "up": change >= 0,
            })

        self._cache.set(cache_key, results)
        return results

    def get_stock_detail(self, code: str) -> dict | None:
        """Fetch real-time snapshot + TWSE fundamentals for a single stock."""
        cache_key = f"stock_detail_{code}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        api = self._api

        try:
            contract = api.Contracts.Stocks[code]
        except (KeyError, AttributeError):
            return None

        try:
            snaps = api.snapshots([contract])
            if not snaps:
                raise ServiceUnavailable(f"取得 {code} 快照失敗：無資料")
            snap = snaps[0]
        except ServiceUnavailable:
            raise
        except Exception as e:
            raise ServiceUnavailable(f"取得 {code} 快照失敗") from e

        name = getattr(contract, "name", code)
        close = snap.close
        open_price = snap.open
        high = snap.high
        low = snap.low
        change = snap.change_price
        change_rate = snap.change_rate
        prev_close = close - change if close and change else 0
        volume = int(snap.total_volume)
        amount = float(snap.total_amount) if hasattr(snap, 'total_amount') else 0
        amplitude = ((high - low) / prev_close * 100) if prev_close else 0

        from market.twse import TWSEService
        twse = TWSEService()
        fundamentals = {}
        for s in twse.get_all_stocks():
            if s["code"] == code:
                fundamentals = s
                break

        pe = fundamentals.get("pe", 0)
        pb = fundamentals.get("pb", 0)
        div_yield = fundamentals.get("dividendYield", 0)
        eps = round(close / pe, 2) if pe and pe > 0 else 0
        market_cap = 0
        if hasattr(snap, 'total_amount'):
            market_cap = fundamentals.get("turnover", 0) * 100

        result = {
            "code": code,
            "name": name,
            "price": close,
            "change": change,
            "percent": round(change_rate, 2),
            "up": change >= 0,
            "open": open_price,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
            "prevClose": round(prev_close, 2),
            "amplitude": round(amplitude, 2),
            "turnover": amount,
            "pe": pe,
            "pb": pb,
            "marketCap": market_cap,
            "eps": eps,
            "dividendYield": div_yield,
        }

        self._cache.set(cache_key, result)
        return result

    @staticmethod
    def _parse_ts(ts) -> str:
        """Convert Shioaji kbar timestamp to ISO format string."""
        if isinstance(ts, (datetime, date)):
            return ts.isoformat()
        if isinstance(ts, (int, float)):
            # Shioaji uses nanosecond timestamps
            val = ts / 1e9 if ts > 1e12 else ts
            # Shioaji encodes Taiwan wall-clock time in the numeric UTC fields.
            return datetime.fromtimestamp(val, timezone.utc).replace(
                tzinfo=timezone(timedelta(hours=8))
            ).isoformat()
        return str(ts)

    def get_kbars(self, code: str, period: str = "Day", limit: int = 60) -> list[dict]:
        """Fetch minute bars in valid 30-day windows and aggregate requested periods."""
        if period not in {"1Min", "5Min", "15Min", "30Min", "60Min", "Day", "Week", "Month"}:
            raise ValueError(f"Unsupported K-bar period: {period}")
        if not 1 <= limit <= 365:
            raise ValueError("K-bar limit must be between 1 and 365")
        cache_key = f"kbars_{code}_{period}_{limit}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached
        deadline = time.monotonic() + 25

        api = self._api

        try:
            contract = api.Contracts.Stocks[code]
        except (KeyError, AttributeError):
            return []

        exchange = str(getattr(contract, "exchange", "")).split(".")[-1]
        if period in {"Day", "Week", "Month"} and exchange == "TSE":
            try:
                month = date.today().replace(day=1)
                months = (
                    limit + 2 if period == "Month" else
                    limit // 4 + 3 if period == "Week" else
                    limit // 18 + 3
                )
                rows = []
                for _ in range(min(months, 36)):
                    if time.monotonic() > deadline:
                        raise ServiceUnavailable(f"{code} 歷史行情查詢超過 25 秒，請稍後重試")
                    rows.extend(self._twse.get_stock_daily_month(code, month))
                    results = self._aggregate_kbars(rows, period)
                    if len(results) >= limit:
                        break
                    month = (month - timedelta(days=1)).replace(day=1)
                results = results[-limit:] if rows else []
                self._cache.set(cache_key, results)
                return results
            except ServiceUnavailable:
                raise
            except Exception as e:
                logger.exception("TWSE daily history failed code=%s period=%s", code, period)
                raise ServiceUnavailable(f"證交所 {code} 歷史行情資料來源查詢失敗") from e

        end = date.today()
        # Bound the work even when the source returns no bars (suspended/new stock).
        lookback_days = (
            limit * 34 if period == "Month" else
            limit * 9 if period == "Week" else
            limit * 2 + 30 if period == "Day" else 30
        )
        earliest = max(date(2020, 3, 2), end - timedelta(days=lookback_days))
        rows = []
        while end >= earliest:
            if time.monotonic() > deadline:
                raise ServiceUnavailable(f"{code} 歷史行情查詢超過 25 秒，請稍後重試")
            start = max(earliest, end - timedelta(days=29))
            window_key = f"kbars_raw_{code}_{start}_{end}"
            # Share raw windows between K-line and technical requests; avoid parallel SDK calls.
            with self._kbar_lock:
                if time.monotonic() > deadline:
                    raise ServiceUnavailable(f"{code} 歷史行情查詢超過 25 秒，請稍後重試")
                window = self._cache.get(window_key)
                if window is None:
                    try:
                        kbars = api.kbars(
                            contract=contract,
                            start=start.isoformat(),
                            end=end.isoformat(),
                            timeout=5000,
                        )
                    except Exception as e:
                        logger.exception("Shioaji kbars failed code=%s start=%s end=%s", code, start, end)
                        raise ServiceUnavailable(f"Shioaji {code} K 線資料來源查詢失敗（{start} 至 {end}）") from e
                    window = [
                        {
                            "ts": self._parse_ts(kbars.ts[i]),
                            "open": float(kbars.Open[i]),
                            "high": float(kbars.High[i]),
                            "low": float(kbars.Low[i]),
                            "close": float(kbars.Close[i]),
                            "volume": int(kbars.Volume[i]),
                        }
                        for i in range(len(kbars.Close))
                    ] if kbars is not None and hasattr(kbars, "Close") else []
                    self._cache.set(window_key, window)
            rows.extend(window)
            results = self._aggregate_kbars(rows, period)
            if len(results) >= limit:
                break
            end = start - timedelta(days=1)

        results = results[-limit:] if rows else []

        self._cache.set(cache_key, results)
        return results

    @staticmethod
    def _aggregate_kbars(rows: list[dict], period: str) -> list[dict]:
        """Collapse ordered minute rows to OHLCV for the selected time bucket."""
        bars = {}
        for row in sorted(rows, key=lambda item: item["ts"]):
            ts = datetime.fromisoformat(row["ts"])
            if period == "Day":
                key = ts.date().isoformat()
            elif period == "Week":
                year, week, _ = ts.isocalendar()
                key = f"{year}-W{week:02d}"
            elif period == "Month":
                key = ts.strftime("%Y-%m")
            else:
                minutes = int(period.removesuffix("Min"))
                minute = (ts.minute // minutes) * minutes
                key = ts.replace(minute=minute, second=0, microsecond=0).isoformat()
            if key not in bars:
                bars[key] = row.copy()
            else:
                bar = bars[key]
                bar["high"] = max(bar["high"], row["high"])
                bar["low"] = min(bar["low"], row["low"])
                bar["close"] = row["close"]
                bar["volume"] += row["volume"]
                bar["ts"] = row["ts"]
        return list(bars.values())
