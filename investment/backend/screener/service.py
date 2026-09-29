"""Stock screening funnel service — three-layer progressive filter."""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from market.twse import TWSEService
from market.quote import QuoteService
from market.technicals import compute_technicals, detect_ma_alignment, detect_volume_breakout

logger = logging.getLogger(__name__)

# Last reviewed: 2026-04-05
# This map is manually curated. Update periodically as market themes shift.
THEME_MAP = {
    "AI伺服器": ["2317", "3711", "6669", "3034", "2382", "3037", "2376", "5274"],
    "半導體": ["2330", "2303", "2379", "3443", "2344", "6770", "3529", "2408"],
    "綠能": ["6244", "3576", "6464", "3691", "1513", "1514", "6443"],
    "國防": ["2634", "2208", "1583", "4551", "2233"],
    "低軌衛星": ["3714", "6285", "2345", "4977", "3376"],
    "矽光子": ["2379", "3443", "5347", "3708", "4966"],
    "電動車": ["2308", "2327", "3702", "1319", "3231", "2231"],
    "生技醫療": ["6446", "1760", "4743", "6547", "4726", "1795"],
}


class FunnelService:
    """Three-layer stock screening funnel."""

    def __init__(self):
        self._twse = TWSEService()
        self._quote = QuoteService()

    def get_layer1_sectors(self) -> list[dict]:
        """Layer 1: Return sectors + themes with performance stats."""
        sectors = self._twse.get_sectors_summary()

        # Build theme groups from THEME_MAP
        all_stocks = self._twse.get_all_stocks()
        stock_map = {s["code"]: s for s in all_stocks}

        themes = []
        for theme_name, codes in THEME_MAP.items():
            group = [stock_map[c] for c in codes if c in stock_map]
            if not group:
                continue
            avg_change = sum(s["changePercent"] for s in group) / len(group)
            total_turnover = sum(s["turnover"] for s in group)
            valid_codes = [s["code"] for s in group]
            themes.append({
                "name": theme_name,
                "stockCount": len(group),
                "avgChange": round(avg_change, 2),
                "totalTurnover": total_turnover,
                "up": avg_change >= 0,
                "isTheme": True,
                "codes": valid_codes,
            })

        # Add sector codes
        for sec in sectors:
            sec["isTheme"] = False
            sec["codes"] = [s["code"] for s in sec.get("stocks", [])]
            # Remove full stocks list to reduce payload
            sec.pop("stocks", None)
            sec.pop("topGainers", None)
            sec.pop("topLosers", None)

        themes.sort(key=lambda x: x["totalTurnover"], reverse=True)
        return themes + sectors

    def screen_layer2(self, codes: list[str], filters: dict) -> list[dict]:
        """Layer 2: Quantitative filter on a subset of stocks."""
        all_stocks = self._twse.get_all_stocks()
        revenue_map = self._twse.get_monthly_revenue_map()
        inst_map = self._twse.get_institutional_net_all()

        code_set = set(codes)
        pe_max = filters.get("pe_max", 30)
        pb_max = filters.get("pb_max", 4)
        mom_pct_min = filters.get("mom_pct_min", 0)
        yoy_pct_min = filters.get("yoy_pct_min", 0)
        inst_net_min = filters.get("inst_net_min")  # None means no filter

        results = []
        for s in all_stocks:
            if s["code"] not in code_set:
                continue

            pe = s.get("pe", 0)
            pb = s.get("pb", 0)
            rev = revenue_map.get(s["code"], {})
            mom_pct = rev.get("mom_pct")
            yoy_pct = rev.get("yoy_pct")
            inst_net = inst_map.get(s["code"], 0)

            # Apply filters
            if pe_max is not None and pe > 0 and pe > pe_max:
                continue
            if pb_max is not None and pb > 0 and pb > pb_max:
                continue
            if mom_pct is not None and mom_pct_min is not None and mom_pct < mom_pct_min:
                continue
            if yoy_pct is not None and yoy_pct_min is not None and yoy_pct < yoy_pct_min:
                continue
            if inst_net_min is not None and inst_net < inst_net_min:
                continue

            results.append({
                "code": s["code"],
                "name": s["name"],
                "exchange": s["exchange"],
                "sector": s["sector"],
                "price": s["price"],
                "changePercent": s["changePercent"],
                "pe": pe,
                "pb": pb,
                "dividendYield": s.get("dividendYield", 0),
                "momPct": mom_pct,
                "yoyPct": yoy_pct,
                "instNet": inst_net,
                "volume": s.get("volume", 0),
                "turnover": s.get("turnover", 0),
            })

        results.sort(key=lambda x: x.get("turnover", 0), reverse=True)
        return results

    def screen_layer3(self, codes: list[str]) -> list[dict]:
        """Layer 3: Technical scoring for a small set of stocks."""
        if len(codes) > 100:
            codes = codes[:100]

        results = []

        def _process_one(code: str) -> dict | None:
            try:
                kbars = self._quote.get_kbars(code, period="Day", limit=30)
                if not kbars:
                    return None
                closes = [bar["close"] for bar in kbars]
                volumes = [bar["volume"] for bar in kbars]

                tech = compute_technicals(closes)
                ma_aligned = detect_ma_alignment(
                    closes[-1] if closes else 0,
                    tech["ma5"], tech["ma10"], tech["ma20"],
                )
                vol_breakout = detect_volume_breakout(closes, volumes)

                score = 0
                if ma_aligned:
                    score += 1
                if vol_breakout:
                    score += 1
                if 40 <= tech["rsi14"] <= 70:
                    score += 1

                return {
                    "code": code,
                    "ma5": tech["ma5"],
                    "ma10": tech["ma10"],
                    "ma20": tech["ma20"],
                    "maAligned": ma_aligned,
                    "volumeBreakout": vol_breakout,
                    "rsi14": tech["rsi14"],
                    "kd_k": tech["kd_k"],
                    "kd_d": tech["kd_d"],
                    "macd": tech["macd"],
                    "score": score,
                }
            except Exception:
                logger.exception("Failed to compute technicals for %s", code)
                return None

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(_process_one, c): c for c in codes}
            for future in as_completed(futures):
                result = future.result()
                if result:
                    results.append(result)

        results.sort(key=lambda x: x["score"], reverse=True)
        return results
