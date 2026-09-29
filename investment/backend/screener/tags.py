"""
Tag-based stock browser.

On-the-fly tag computation over the full TWSE + TPEx universe. Consumers
select tag values (產業 / 流動性 / 動能 / 估值 / 殖利率) and get back the
matching list. Tags are derived from TWSEService.get_all_stocks() which is
already cached for 5 minutes, so a filter request is a pure in-memory scan.

Market capitalisation is not available from the free TWSE feed, so we use
daily turnover as a liquidity proxy ("高流動性" / "中" / "低") and mark it
clearly in the UI — it is a practical stand-in, not a true cap bucket.
"""
from __future__ import annotations

import logging

from core.cache import CacheManager
from market.twse import TWSEService

logger = logging.getLogger(__name__)


# ----- Tag vocabulary (single source of truth for backend + frontend options) -----

INDUSTRY_UNKNOWN = "其他"

LIQUIDITY_BUCKETS = [
    ("高流動性", 1_000_000_000),   # ≥ 10 億成交金額
    ("中流動性", 100_000_000),     # ≥ 1 億
    ("低流動性", 0),
]

VALUATION_BUCKETS = [
    ("便宜", lambda pe: 0 < pe <= 15),
    ("合理", lambda pe: 15 < pe <= 25),
    ("偏貴", lambda pe: pe > 25),
]
VALUATION_UNKNOWN = "無法評估"

DIVIDEND_BUCKETS = [
    ("高殖利率", lambda y: y >= 5),
    ("中殖利率", lambda y: 3 <= y < 5),
    ("低殖利率", lambda y: 0 < y < 3),
]
DIVIDEND_NONE = "無股利"

MOMENTUM_STRONG = "強勢"
MOMENTUM_NEUTRAL = "同步"
MOMENTUM_WEAK = "弱勢"

TREND_BULL = "多頭排列"
TREND_BEAR = "空頭排列"
TREND_RANGE = "盤整"
TREND_UNKNOWN = "未分析"

FLAG_HEAVY_VOLUME = "爆量"         # 成交量 ≥ 5 日均量 × 2（batch 有均量則用真實比值，否則 fallback）
FLAG_LIMIT_UP = "漲停"
FLAG_LIMIT_DOWN = "跌停"
FLAG_VOLUME_BREAKOUT = "爆量突破"   # 批次計算：當日量 > 20 日均量 × 1.5 且收紅

# 市值規模（以實收資本額 × 股價估算真實市值，單位 TWD）
CAP_SIZE_LARGE = "大型股"   # ≥ 1000 億
CAP_SIZE_MID = "中型股"     # 100 億 ～ 1000 億
CAP_SIZE_SMALL = "小型股"   # 10 億 ～ 100 億
CAP_SIZE_MICRO = "微型股"   # < 10 億

CAP_SIZE_BUCKETS = [
    (CAP_SIZE_LARGE, 100_000_000_000),   # 1000 億
    (CAP_SIZE_MID,    10_000_000_000),   # 100 億
    (CAP_SIZE_SMALL,   1_000_000_000),   # 10 億
    (CAP_SIZE_MICRO,               0),
]

# 投資風格 (由 PE + 殖利率推算；單一分類)
STYLE_INCOME = "收益股"    # 高殖利率 ≥ 5%
STYLE_GROWTH = "成長股"    # PE > 30
STYLE_VALUE = "價值股"     # 0 < PE ≤ 15
STYLE_BLUECHIP = "藍籌股"  # 大型股（市值 ≥ 1000 億）+ 合理 PE
STYLE_GENERAL = "一般"

# 特殊屬性 (multi-value，同 flags)
SPECIAL_ETF = "ETF"
SPECIAL_PENNY = "仙股"     # 股價 < 10 元
SPECIAL_ZOMBIE = "僵屍股"  # 成交金額 < 50 萬（幾乎無人交易）


# ----- Service -----


class TagService:
    """Produces tagged snapshots of the whole market and filters them."""

    def __init__(self):
        self._twse = TWSEService()
        # Full tagged snapshot is cached for 60 s; underlying data is cached
        # for 5 min inside TWSEService, so worst case we recompute tags 5×/h.
        self._cache = CacheManager(ttl=60)

    # ---------- Tag building ----------

    def build_all(self) -> list[dict]:
        """Return every stock with its computed tags."""
        cached = self._cache.get("tagged_snapshot")
        if cached is not None:
            return cached

        stocks = self._twse.get_all_stocks()
        if not stocks:
            return []

        # 大盤動能參考：用所有股票當日漲跌幅的中位數
        changes = sorted(s.get("changePercent", 0) or 0 for s in stocks)
        market_change = changes[len(changes) // 2] if changes else 0

        # 合併批次計算的趨勢 tag（由 rebuild_tags management command 產出）
        trend_map = _load_trend_map()

        tagged: list[dict] = []
        for s in stocks:
            trend_row = trend_map.get(s["code"])
            avg_vol_5d = (trend_row or {}).get("avg_volume_5d")
            flags = _collect_flags(s, avg_vol_5d)
            if trend_row and trend_row.get("flags"):
                flags.extend(trend_row["flags"])
            market_cap = s.get("market_cap", 0) or 0
            tagged.append({
                "code": s["code"],
                "name": s["name"],
                "exchange": s["exchange"],
                "price": s["price"],
                "changePercent": s["changePercent"],
                "pe": s.get("pe", 0),
                "pb": s.get("pb", 0),
                "dividendYield": s.get("dividendYield", 0),
                "turnover": s.get("turnover", 0),
                "volume": s.get("volume", 0),
                "market_cap": market_cap,
                "tags": {
                    "industry": s.get("sector") or INDUSTRY_UNKNOWN,
                    "liquidity": _classify_liquidity(s.get("turnover", 0)),
                    "momentum": _classify_momentum(
                        s.get("changePercent", 0), market_change
                    ),
                    "trend": (trend_row or {}).get("trend") or TREND_UNKNOWN,
                    "valuation": _classify_valuation(s.get("pe", 0)),
                    "dividend": _classify_dividend(s.get("dividendYield", 0)),
                    "cap_size": _classify_cap_size(market_cap, s.get("turnover", 0)),
                    "style": _classify_style(
                        s.get("pe", 0),
                        s.get("dividendYield", 0),
                        market_cap,
                    ),
                    "special": _collect_special(s),
                    "flags": flags,
                },
            })

        self._cache.set("tagged_snapshot", tagged)
        return tagged

    # ---------- Options exposed to the UI ----------

    def get_options(self) -> dict:
        """Return the concrete tag values that currently have ≥ 1 stock."""
        snapshot = self.build_all()
        industries = sorted({row["tags"]["industry"] for row in snapshot})
        return {
            "industry": industries,
            "liquidity": [b[0] for b in LIQUIDITY_BUCKETS],
            "cap_size": [b[0] for b in CAP_SIZE_BUCKETS],
            "style": [STYLE_INCOME, STYLE_GROWTH, STYLE_VALUE, STYLE_BLUECHIP, STYLE_GENERAL],
            "momentum": [MOMENTUM_STRONG, MOMENTUM_NEUTRAL, MOMENTUM_WEAK],
            "trend": [TREND_BULL, TREND_BEAR, TREND_RANGE, TREND_UNKNOWN],
            "valuation": [b[0] for b in VALUATION_BUCKETS] + [VALUATION_UNKNOWN],
            "dividend": [b[0] for b in DIVIDEND_BUCKETS] + [DIVIDEND_NONE],
            "flags": [
                FLAG_HEAVY_VOLUME, FLAG_LIMIT_UP, FLAG_LIMIT_DOWN,
                FLAG_VOLUME_BREAKOUT,
            ],
            "special": [SPECIAL_ETF, SPECIAL_PENNY, SPECIAL_ZOMBIE],
            "trendTagsUpdatedAt": _get_trend_tags_updated_at(),
        }

    # ---------- Filtering ----------

    def filter(self, selectors: dict) -> list[dict]:
        """Apply multi-select AND filters.

        selectors keys (each optional, each a list of allowed tag values):
          industry, liquidity, momentum, valuation, dividend, flags, exchange
        """
        snapshot = self.build_all()
        picks: dict[str, set[str]] = {
            k: set(v) for k, v in selectors.items() if v
        }
        if not picks:
            # Default to top-turnover sample to keep the payload small.
            return sorted(snapshot, key=lambda r: r["turnover"], reverse=True)[:200]

        out: list[dict] = []
        for row in snapshot:
            if "exchange" in picks and row["exchange"] not in picks["exchange"]:
                continue
            tags = row["tags"]
            if "industry" in picks and tags["industry"] not in picks["industry"]:
                continue
            if "liquidity" in picks and tags["liquidity"] not in picks["liquidity"]:
                continue
            if "cap_size" in picks and tags["cap_size"] not in picks["cap_size"]:
                continue
            if "style" in picks and tags["style"] not in picks["style"]:
                continue
            if "momentum" in picks and tags["momentum"] not in picks["momentum"]:
                continue
            if "trend" in picks and tags["trend"] not in picks["trend"]:
                continue
            if "valuation" in picks and tags["valuation"] not in picks["valuation"]:
                continue
            if "dividend" in picks and tags["dividend"] not in picks["dividend"]:
                continue
            if "flags" in picks and not picks["flags"].intersection(tags["flags"]):
                continue
            if "special" in picks and not picks["special"].intersection(tags["special"]):
                continue
            out.append(row)
        out.sort(key=lambda r: r["turnover"], reverse=True)
        return out


# ----- Classifiers -----


def _get_trend_tags_updated_at() -> str | None:
    """Return ISO timestamp of the most recent StockTrendTag row, or None."""
    try:
        from django.db.models import Max
        from screener.models import StockTrendTag
    except Exception:
        return None
    try:
        latest = StockTrendTag.objects.aggregate(Max('updated_at')).get('updated_at__max')
        return latest.isoformat() if latest else None
    except Exception:
        logger.exception('Failed to query StockTrendTag.updated_at')
        return None


def _load_trend_map() -> dict[str, dict]:
    """Load the most recent batch-computed trend tags keyed by symbol."""
    try:
        from screener.models import StockTrendTag
    except Exception:
        return {}
    try:
        rows = StockTrendTag.objects.all().values('symbol', 'trend', 'flags', 'avg_volume_5d')
        return {
            r['symbol']: {
                'trend': r['trend'],
                'flags': r['flags'] or [],
                'avg_volume_5d': r['avg_volume_5d'],
            }
            for r in rows
        }
    except Exception:
        logger.exception('Failed to load StockTrendTag rows')
        return {}


def _classify_liquidity(turnover: float) -> str:
    for label, threshold in LIQUIDITY_BUCKETS:
        if turnover >= threshold:
            return label
    return LIQUIDITY_BUCKETS[-1][0]


def _classify_momentum(change_pct: float, market_change: float) -> str:
    rs = (change_pct or 0) - (market_change or 0)
    if rs >= 1.5:
        return MOMENTUM_STRONG
    if rs <= -1.5:
        return MOMENTUM_WEAK
    return MOMENTUM_NEUTRAL


def _classify_valuation(pe: float) -> str:
    if pe is None or pe <= 0:
        return VALUATION_UNKNOWN
    for label, predicate in VALUATION_BUCKETS:
        if predicate(pe):
            return label
    return VALUATION_UNKNOWN


def _classify_dividend(yield_pct: float) -> str:
    if not yield_pct or yield_pct <= 0:
        return DIVIDEND_NONE
    for label, predicate in DIVIDEND_BUCKETS:
        if predicate(yield_pct):
            return label
    return DIVIDEND_NONE


def _classify_cap_size(market_cap: float, turnover_fallback: float = 0) -> str:
    """Use real market cap when available; fall back to turnover proxy."""
    if market_cap and market_cap > 0:
        for label, threshold in CAP_SIZE_BUCKETS:
            if market_cap >= threshold:
                return label
        return CAP_SIZE_MICRO
    # Turnover fallback (成交金額代理，不精確)
    TURNOVER_BUCKETS = [
        (CAP_SIZE_LARGE, 500_000_000),
        (CAP_SIZE_MID,    50_000_000),
        (CAP_SIZE_SMALL,   5_000_000),
    ]
    for label, thr in TURNOVER_BUCKETS:
        if (turnover_fallback or 0) >= thr:
            return label
    return CAP_SIZE_MICRO


def _classify_style(pe: float, dividend_yield: float, market_cap: float) -> str:
    dy = dividend_yield or 0
    pe = pe or 0
    mc = market_cap or 0
    if dy >= 5:
        return STYLE_INCOME
    if pe > 30:
        return STYLE_GROWTH
    if 0 < pe <= 15:
        return STYLE_VALUE
    # 藍籌：大型股（市值 ≥ 1000 億）且 PE 合理
    if mc >= 100_000_000_000 and 0 < pe <= 25:
        return STYLE_BLUECHIP
    return STYLE_GENERAL


def _collect_special(stock: dict) -> list[str]:
    specials: list[str] = []
    code = stock.get("code", "")
    price = stock.get("price", 0) or 0
    turnover = stock.get("turnover", 0) or 0

    if code.startswith("00"):
        specials.append(SPECIAL_ETF)
    if 0 < price < 10:
        specials.append(SPECIAL_PENNY)
    if turnover < 500_000:
        specials.append(SPECIAL_ZOMBIE)
    return specials


def _collect_flags(stock: dict, avg_volume_5d: float | None = None) -> list[str]:
    flags: list[str] = []
    change_pct = stock.get("changePercent", 0) or 0
    if change_pct >= 9.8:
        flags.append(FLAG_LIMIT_UP)
    elif change_pct <= -9.8:
        flags.append(FLAG_LIMIT_DOWN)

    today_vol = stock.get("volume", 0) or 0
    if avg_volume_5d and avg_volume_5d > 0:
        # 真實爆量：當日量 ≥ 5 日均量 × 2
        if today_vol >= avg_volume_5d * 2:
            flags.append(FLAG_HEAVY_VOLUME)
    else:
        # Fallback：無歷史均量時，用成交金額 > 5 億且漲跌幅 > 3% 近似
        if (stock.get("turnover", 0) or 0) > 500_000_000 and abs(change_pct) >= 3:
            flags.append(FLAG_HEAVY_VOLUME)

    return flags
