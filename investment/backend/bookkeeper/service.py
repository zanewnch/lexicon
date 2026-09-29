"""
Bookkeeper — review stage of the trading pipeline.

Reads Trade records and produces P&L, win-rate, risk-adjusted metrics
(Sharpe / Sortino / Calmar / Profit Factor / Max Drawdown) and an equity
curve. Read-only; no broker side effects.

Risk metrics are computed on the realised P&L per closing trade, with an
``annualization_factor`` (default 252 — roughly one trade per trading day)
applied to Sharpe / Sortino so they are broadly comparable to daily-return
benchmarks.
"""
import logging
import math

from trading_core.enums import ExecutionVenue, Side
from trading_core.models import Trade

logger = logging.getLogger(__name__)


def _stdev(xs: list[float]) -> float:
    n = len(xs)
    if n < 2:
        return 0.0
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / (n - 1)
    return math.sqrt(var)


def _max_drawdown(equity: list[float]) -> tuple[float, float]:
    """Return (abs_dd, pct_dd) of the steepest peak-to-trough on the series."""
    if not equity:
        return 0.0, 0.0
    peak = equity[0]
    abs_dd = 0.0
    pct_dd = 0.0
    for v in equity:
        if v > peak:
            peak = v
        drop = peak - v
        if drop > abs_dd:
            abs_dd = drop
            # Guard against zero-peak (early in series before any wins)
            if peak > 0:
                pct_dd = drop / peak * 100
    return abs_dd, pct_dd


class BookkeeperService:
    """Aggregates Trade rows into performance reports."""

    ANNUALIZATION = 252

    def list_trades(self, limit: int = 200, venue: str = ExecutionVenue.PAPER) -> list[dict]:
        qs = Trade.objects.filter(order__venue=venue)[:limit]
        return [
            {
                'id': t.id,
                'symbol': t.symbol,
                'side': t.side,
                'qty': t.qty,
                'price': t.price,
                'executedAt': t.executed_at.isoformat() if t.executed_at else None,
                'pnl': t.pnl,
                'venue': t.order.venue,
            }
            for t in qs
        ]

    def get_report(self, venue: str = ExecutionVenue.PAPER) -> dict:
        """Aggregate realised P&L, win rate, risk metrics, equity curve."""
        trades = list(Trade.objects.filter(order__venue=venue).order_by('executed_at'))

        total_pnl = 0.0
        wins = 0
        losses = 0
        gross_profit = 0.0
        gross_loss = 0.0
        equity_curve: list[dict] = []
        equity_series: list[float] = []
        closing_pnls: list[float] = []
        running_equity = 0.0

        for t in trades:
            pnl = t.pnl or 0.0
            if t.side == Side.SELL and t.pnl is not None:
                closing_pnls.append(pnl)
                total_pnl += pnl
                if pnl > 0:
                    wins += 1
                    gross_profit += pnl
                elif pnl < 0:
                    losses += 1
                    gross_loss += -pnl
            running_equity += pnl
            equity_series.append(running_equity)
            equity_curve.append({
                'ts': t.executed_at.isoformat() if t.executed_at else None,
                'equity': round(running_equity, 2),
            })

        closed = wins + losses
        win_rate = round(wins / closed * 100, 2) if closed else 0.0

        avg_win = (gross_profit / wins) if wins else 0.0
        avg_loss = (gross_loss / losses) if losses else 0.0
        expectancy = (
            (wins / closed) * avg_win - (losses / closed) * avg_loss
            if closed else 0.0
        )

        # Risk-adjusted metrics — on the realised-PnL series
        sharpe = 0.0
        sortino = 0.0
        if len(closing_pnls) >= 2:
            mean_pnl = sum(closing_pnls) / len(closing_pnls)
            sd = _stdev(closing_pnls)
            if sd > 0:
                sharpe = mean_pnl / sd * math.sqrt(self.ANNUALIZATION)
            downside = [x for x in closing_pnls if x < 0]
            if len(downside) >= 2:
                sd_down = _stdev(downside)
                if sd_down > 0:
                    sortino = mean_pnl / sd_down * math.sqrt(self.ANNUALIZATION)

        abs_dd, pct_dd = _max_drawdown(equity_series)
        calmar = (total_pnl / abs_dd) if abs_dd > 0 else 0.0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0.0

        return {
            'venue': venue,
            'totalTrades': len(trades),
            'closedTrades': closed,
            'wins': wins,
            'losses': losses,
            'winRate': win_rate,
            'totalPnl': round(total_pnl, 2),
            'avgWin': round(avg_win, 2),
            'avgLoss': round(avg_loss, 2),
            'expectancy': round(expectancy, 2),
            'grossProfit': round(gross_profit, 2),
            'grossLoss': round(gross_loss, 2),
            'profitFactor': round(profit_factor, 2),
            'sharpe': round(sharpe, 3),
            'sortino': round(sortino, 3),
            'maxDrawdown': round(abs_dd, 2),
            'maxDrawdownPct': round(pct_dd, 2),
            'calmar': round(calmar, 3),
            'equityCurve': equity_curve,
        }
