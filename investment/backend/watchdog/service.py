"""
Watchdog — monitoring stage of the trading pipeline.

Fixed % stop-loss / take-profit rule. Iterates over open Positions, compares
current price (supplied by caller or pulled from QuoteService), and emits an
ExitSignal when a rule is breached. Pure observation; never places orders.
"""
import logging

from trading_core.enums import ExecutionVenue, ExitReason, OrderStatus, PositionStatus, Side
from trading_core.models import ExitSignal, Order, Position

logger = logging.getLogger(__name__)


class WatchdogService:
    """Position monitor that emits ExitSignals."""

    DEFAULT_STOP_LOSS_PCT = -5.0
    DEFAULT_TAKE_PROFIT_PCT = 10.0

    def _fetch_prices(self, symbols: list[str]) -> dict[str, float]:
        """Pull live close prices via QuoteService snapshots. Lazy-imports
        the broker stack so explicit-price mode works without Shioaji."""
        from market.quote import QuoteService

        quote = QuoteService()
        out: dict[str, float] = {}
        for sym in symbols:
            try:
                detail = quote.get_stock_detail(sym)
                if detail and detail.get('close'):
                    out[sym] = float(detail['close'])
            except Exception:
                logger.exception('Watchdog: snapshot failed for %s', sym)
        return out

    def check(
        self,
        prices: dict[str, float] | None = None,
        stop_loss_pct: float | None = None,
        take_profit_pct: float | None = None,
        venue: str = ExecutionVenue.PAPER,
    ) -> list[ExitSignal]:
        """For each open position, evaluate stop-loss / take-profit against price.

        If ``prices`` is None, pull live prices via QuoteService for every open
        position symbol. Returns the list of newly created ExitSignals.
        """
        sl = stop_loss_pct if stop_loss_pct is not None else self.DEFAULT_STOP_LOSS_PCT
        tp = take_profit_pct if take_profit_pct is not None else self.DEFAULT_TAKE_PROFIT_PCT

        open_positions = list(Position.objects.filter(status=PositionStatus.OPEN, venue=venue))
        if prices is None:
            symbols = list({p.symbol for p in open_positions})
            prices = self._fetch_prices(symbols) if symbols else {}
            logger.info('Watchdog: pulled live prices for %d/%d positions', len(prices), len(symbols))

        signals: list[ExitSignal] = []
        for pos in open_positions:
            if ExitSignal.objects.filter(position=pos, processed=False).exists():
                continue
            if Order.objects.filter(
                position=pos, side=Side.SELL,
                status__in=[OrderStatus.PENDING, OrderStatus.SUBMITTED, OrderStatus.PARTIALLY_FILLED],
            ).exists():
                continue
            current = prices.get(pos.symbol)
            if current is None or pos.avg_cost <= 0:
                continue
            change_pct = (current - pos.avg_cost) / pos.avg_cost * 100

            reason = None
            if change_pct <= sl:
                reason = ExitReason.STOP_LOSS
            elif change_pct >= tp:
                reason = ExitReason.TAKE_PROFIT
            if reason is None:
                continue

            sig = ExitSignal.objects.create(
                position=pos,
                reason=reason,
                triggered_price=current,
                note=f'change={change_pct:.2f}% (sl={sl}, tp={tp})',
            )
            signals.append(sig)
            logger.info(
                'Watchdog emitted %s for %s @ %s (%.2f%%)',
                reason, pos.symbol, current, change_pct,
            )
        return signals

    def list_signals(self, only_pending: bool = True,
                     venue: str = ExecutionVenue.PAPER) -> list[dict]:
        qs = ExitSignal.objects.filter(position__venue=venue)
        if only_pending:
            qs = qs.filter(processed=False)
        return [
            {
                'id': s.id,
                'positionId': s.position_id,
                'symbol': s.position.symbol,
                'reason': s.reason,
                'triggeredPrice': s.triggered_price,
                'triggeredAt': s.triggered_at.isoformat(),
                'processed': s.processed,
                'note': s.note,
                'venue': s.position.venue,
            }
            for s in qs
        ]
