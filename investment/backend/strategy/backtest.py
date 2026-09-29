"""
Backtest service — evaluate a strategy against historical K-bar data.

For each target stock, fetches daily K-bars and walks through the bars
checking whether the strategy's conditions are met on each day.
Produces a list of signal dates and basic performance metrics.
"""

import logging
from datetime import date, timedelta

from market.quote import QuoteService
from market.twse import TWSEService

logger = logging.getLogger(__name__)

_quote = QuoteService()
_twse = TWSEService()


def _sma(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    return sum(closes[-period:]) / period


def _avg_volume(volumes: list[int], period: int) -> float | None:
    if len(volumes) < period:
        return None
    return sum(volumes[-period:]) / period


def _check_condition(cond: dict, bar: dict, closes_so_far: list[float], volumes_so_far: list[int]) -> bool:
    """Evaluate a single condition against the current bar + history."""
    ctype = cond.get("type", "")
    params = cond.get("params", {})

    close = bar["close"]

    if ctype == "price_above":
        target = float(params.get("price", 0))
        return close > target

    if ctype == "price_below":
        target = float(params.get("price", 0))
        return close < target

    if ctype == "price_change_pct":
        pct = float(params.get("pct", 0))
        if len(closes_so_far) < 2:
            return False
        prev = closes_so_far[-2]
        if prev == 0:
            return False
        change_pct = (close - prev) / prev * 100
        return abs(change_pct) >= pct

    if ctype == "price_above_ma":
        period = int(params.get("period", 20))
        ma = _sma(closes_so_far, period)
        if ma is None:
            return False
        return close > ma

    if ctype == "price_below_ma":
        period = int(params.get("period", 20))
        ma = _sma(closes_so_far, period)
        if ma is None:
            return False
        return close < ma

    if ctype == "volume_surge":
        period = int(params.get("period", 5))
        multiplier = float(params.get("multiplier", 1.5))
        avg_vol = _avg_volume(volumes_so_far[:-1], period)
        if avg_vol is None or avg_vol == 0:
            return False
        return bar["volume"] > avg_vol * multiplier

    # institutional conditions require external data — skip in backtest for now
    if ctype in ("institutional_consecutive_buy", "institutional_consecutive_sell"):
        return False

    return False


def run_backtest(strategy: dict, days: int = 120) -> dict:
    """
    Run backtest for a strategy over the given number of trading days.

    Returns:
        {
            "strategy_id": str,
            "strategy_name": str,
            "days": int,
            "results": [
                {
                    "code": str,
                    "name": str,
                    "signals": [{ "date": str, "close": float, "conditions_met": [...] }],
                    "signal_count": int,
                    "performance": { ... }
                }
            ],
            "summary": { "total_signals": int, "stocks_triggered": int }
        }
    """
    conditions = strategy.get("conditions", [])
    logic = strategy.get("logic", "AND")
    targets = strategy.get("targets", [])

    if not targets:
        # 全市場太慢，回測限制最多 20 檔
        all_stocks = _twse.get_all_stocks()
        # 取成交量前 20 的股票
        sorted_stocks = sorted(all_stocks, key=lambda s: s.get("turnover", 0) or 0, reverse=True)
        targets = [s["code"] for s in sorted_stocks[:20]]

    results = []
    total_signals = 0

    for code in targets:
        try:
            kbars = _quote.get_kbars(code, period="Day", limit=days)
        except Exception as e:
            logger.warning("Backtest: failed to get kbars for %s: %s", code, e)
            continue

        if not kbars:
            continue

        # Get stock name
        stock_name = code
        try:
            contract = _quote._api.Contracts.Stocks[code]
            stock_name = getattr(contract, "name", code)
        except Exception:
            pass

        signals = []
        closes_so_far: list[float] = []
        volumes_so_far: list[int] = []

        for bar in kbars:
            closes_so_far.append(bar["close"])
            volumes_so_far.append(bar["volume"])

            if not conditions:
                continue

            met = []
            for cond in conditions:
                if _check_condition(cond, bar, closes_so_far, volumes_so_far):
                    met.append(cond["type"])

            triggered = False
            if logic == "AND":
                triggered = len(met) == len(conditions)
            else:  # OR
                triggered = len(met) > 0

            if triggered:
                signals.append({
                    "date": bar.get("ts", "")[:10],
                    "close": bar["close"],
                    "volume": bar["volume"],
                    "conditions_met": met,
                })

        # Performance: simple buy-on-signal analysis
        performance = _calc_performance(signals, kbars)

        results.append({
            "code": code,
            "name": stock_name,
            "signals": signals,
            "signal_count": len(signals),
            "kbars": kbars,
            "performance": performance,
        })
        total_signals += len(signals)

    stocks_triggered = sum(1 for r in results if r["signal_count"] > 0)

    return {
        "strategy_id": strategy.get("id", ""),
        "strategy_name": strategy.get("name", ""),
        "days": days,
        "results": results,
        "summary": {
            "total_signals": total_signals,
            "stocks_triggered": stocks_triggered,
            "stocks_tested": len(results),
        },
    }


def _calc_performance(signals: list[dict], kbars: list[dict]) -> dict:
    """Calculate simple performance metrics for signals."""
    if not signals or not kbars:
        return {"win_rate": 0, "avg_return_pct": 0, "best_return_pct": 0, "worst_return_pct": 0}

    # Map date → index for quick lookup
    date_to_idx = {}
    for i, bar in enumerate(kbars):
        d = bar.get("ts", "")[:10]
        date_to_idx[d] = i

    returns = []
    for sig in signals:
        idx = date_to_idx.get(sig["date"])
        if idx is None:
            continue
        buy_price = sig["close"]
        # Look at price 5 days later (or last available)
        sell_idx = min(idx + 5, len(kbars) - 1)
        sell_price = kbars[sell_idx]["close"]
        if buy_price > 0:
            ret = (sell_price - buy_price) / buy_price * 100
            returns.append(ret)

    if not returns:
        return {"win_rate": 0, "avg_return_pct": 0, "best_return_pct": 0, "worst_return_pct": 0}

    wins = sum(1 for r in returns if r > 0)
    return {
        "win_rate": round(wins / len(returns) * 100, 1),
        "avg_return_pct": round(sum(returns) / len(returns), 2),
        "best_return_pct": round(max(returns), 2),
        "worst_return_pct": round(min(returns), 2),
    }
