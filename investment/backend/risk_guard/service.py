"""
RiskGuardService — cross-cutting portfolio-level risk checks.

Queried by Trader (before entries) and exposed via /api/risk/* to inspect
limits and today's stats. Enforces four v1 rules:

  1. Symbol is not blacklisted.
  2. Entry would not push concurrent open positions over ``max_positions``.
  3. Entry cost (qty × price) would not exceed ``max_position_pct`` of capital.
  4. Today's realised loss has not breached ``max_daily_loss``.
"""
import logging
from dataclasses import dataclass
from datetime import datetime, time, timezone as dt_timezone

from django.utils import timezone

from trading_core.enums import ExecutionVenue, OrderStatus, PositionStatus, Side
from trading_core.models import Order, Position, Trade

from risk_guard.models import RiskConfig

logger = logging.getLogger(__name__)


@dataclass
class RiskDecision:
    ok: bool
    reason: str = ''

    def as_dict(self) -> dict:
        return {'ok': self.ok, 'reason': self.reason}


class RiskGuardService:
    """Evaluates entry/exit requests against RiskConfig."""

    def __init__(self):
        self.config = RiskConfig.load()

    # ------------------------------------------------------------------
    # Runtime stats
    # ------------------------------------------------------------------

    @staticmethod
    def _today_start_utc() -> datetime:
        local_start = timezone.make_aware(datetime.combine(timezone.localdate(), time.min))
        return local_start.astimezone(dt_timezone.utc)

    def today_realised_pnl(self, venue: str = ExecutionVenue.PAPER) -> float:
        start = self._today_start_utc()
        qs = Trade.objects.filter(side=Side.SELL, pnl__isnull=False, executed_at__gte=start, order__venue=venue)
        return float(sum((t.pnl or 0.0) for t in qs))

    def open_position_count(self, venue: str = ExecutionVenue.PAPER) -> int:
        open_count = Position.objects.filter(status=PositionStatus.OPEN, venue=venue).count()
        pending_entries = Order.objects.filter(
            side=Side.BUY, venue=venue, filled_qty=0,
            status__in=[OrderStatus.PENDING, OrderStatus.SUBMITTED],
        ).count()
        return open_count + pending_entries

    def stats(self, venue: str = ExecutionVenue.PAPER) -> dict:
        return {
            'venue': venue,
            'openPositions': self.open_position_count(venue),
            'todayRealisedPnl': round(self.today_realised_pnl(venue), 2),
            'maxPositions': self.config.max_positions,
            'maxPositionPct': self.config.max_position_pct,
            'maxDailyLoss': self.config.max_daily_loss,
            'blacklist': list(self.config.blacklist or []),
            'enabled': self.config.enabled,
        }

    # ------------------------------------------------------------------
    # Gate check
    # ------------------------------------------------------------------

    def check_entry(self, symbol: str, qty: int, price: float, capital: float,
                    venue: str = ExecutionVenue.PAPER) -> RiskDecision:
        """Evaluate whether a single new entry should be allowed."""
        if not self.config.enabled:
            return RiskDecision(ok=True, reason='risk guard disabled')

        if symbol in (self.config.blacklist or []):
            return RiskDecision(ok=False, reason=f'symbol {symbol} is blacklisted')

        # Rule: daily loss circuit-breaker
        today_pnl = self.today_realised_pnl(venue)
        if today_pnl <= self.config.max_daily_loss:
            return RiskDecision(
                ok=False,
                reason=f'daily loss {today_pnl:.0f} breached limit {self.config.max_daily_loss:.0f}',
            )

        # Rule: max concurrent positions
        if self.open_position_count(venue) >= self.config.max_positions:
            return RiskDecision(
                ok=False,
                reason=f'open positions reached max {self.config.max_positions}',
            )

        # Rule: max single position as % of capital
        if capital > 0 and self.config.max_position_pct > 0:
            cost = qty * price
            max_cost = capital * (self.config.max_position_pct / 100)
            if cost > max_cost:
                return RiskDecision(
                    ok=False,
                    reason=(
                        f'position cost {cost:.0f} exceeds max '
                        f'{self.config.max_position_pct:.0f}% of capital ({max_cost:.0f})'
                    ),
                )

        return RiskDecision(ok=True)
