"""
Trader — entry stage of the trading pipeline.

Equal-weight sizing across unconsumed candidates, market buy.

Paper orders fill locally. Broker orders remain pending until confirmed deals
arrive from Shioaji or are reconciled from broker status.

A 3.5s sleep separates live orders to respect AccountService's per-order
cooldown.
"""
import logging
import time
from datetime import datetime, timezone

from django.db import transaction

from risk_guard.service import RiskGuardService
from trading_core.enums import ExecutionVenue, OrderStatus, OrderType, Side
from trading_core.models import Candidate, Order, Position, Trade
from trading_core.order_refs import make_client_ref

logger = logging.getLogger(__name__)

TWSE_LOT_SIZE = 1000  # shares per common lot
LIVE_ORDER_INTERVAL_SEC = 3.5  # ≥ AccountService.ORDER_COOLDOWN_SECONDS


class TraderService:
    """Sizes and submits entry orders for unconsumed candidates."""

    def execute(
        self,
        capital: float,
        prices: dict[str, float],
        live: bool = False,
        trade_pin: str = '',
        expected_venue: str = '',
        candidate_ids: list[int] | None = None,
    ) -> dict:
        """Equal-weight allocate capital across unconsumed candidates.

        Returns a summary {orders, positions, skipped, mode}.
        """
        if capital <= 0:
            raise ValueError('capital must be positive')
        if live and not trade_pin:
            raise ValueError('live mode requires trade_pin')

        if candidate_ids is not None and (
            not candidate_ids or any(type(value) is not int or value <= 0 for value in candidate_ids)
        ):
            raise ValueError('candidate_ids must be a non-empty list of positive integers')
        candidate_query = Candidate.objects.filter(consumed=False)
        if candidate_ids is not None:
            candidate_query = candidate_query.filter(pk__in=candidate_ids)
        candidates = list(candidate_query)
        if not candidates:
            return {'orders': 0, 'positions': 0, 'skipped': [], 'mode': 'live' if live else 'paper'}

        risk = RiskGuardService()
        per_slot = capital / len(candidates)
        if risk.config.enabled and risk.config.max_position_pct > 0:
            per_slot = min(per_slot, capital * risk.config.max_position_pct / 100)
        orders_created = 0
        positions_created = 0
        skipped: list[dict] = []

        account = None
        venue = ExecutionVenue.PAPER
        if live:
            from account.service import AccountService
            account = AccountService()
            _, venue = account.prepare_order(trade_pin, expected_venue)

        for idx, cand in enumerate(candidates):
            price = prices.get(cand.symbol)
            if not price or price <= 0:
                skipped.append({'symbol': cand.symbol, 'reason': 'no price'})
                continue

            lots = int(per_slot // (price * TWSE_LOT_SIZE))
            qty = lots * TWSE_LOT_SIZE
            if qty <= 0:
                skipped.append({'symbol': cand.symbol, 'reason': 'budget < 1 lot'})
                continue

            decision = risk.check_entry(cand.symbol, qty, price, capital, venue=venue)
            if not decision.ok:
                skipped.append({'symbol': cand.symbol, 'reason': f'risk: {decision.reason}'})
                logger.info('Trader blocked %s by risk guard: %s', cand.symbol, decision.reason)
                continue

            if live:
                if idx > 0:
                    time.sleep(LIVE_ORDER_INTERVAL_SEC)
                with transaction.atomic():
                    if not Candidate.objects.filter(pk=cand.pk, consumed=False).update(consumed=True):
                        skipped.append({'symbol': cand.symbol, 'reason': 'candidate already consumed'})
                        continue
                    order = Order.objects.create(
                        symbol=cand.symbol, side=Side.BUY, qty=qty,
                        order_type=OrderType.MARKET, status=OrderStatus.PENDING,
                        venue=venue, candidate=cand,
                        note='broker entry awaiting submission',
                    )
                    client_ref = make_client_ref(order.pk)
                    order.client_ref = client_ref
                    order.save(update_fields=['client_ref'])
                try:
                    result = account.place_order({
                        'code': cand.symbol,
                        'side': 'buy',
                        'shares': qty,
                        'type': 'market',
                        'price': 0,
                        'trade_pin': trade_pin,
                        'client_ref': client_ref,
                        'expected_venue': venue,
                    })
                    external_id = result.get('order_id', '')
                    current = Order.objects.get(pk=order.pk)
                    if current.external_id and current.external_id != external_id:
                        raise RuntimeError('broker order ID conflicts with callback; reconcile before retry')
                    if not current.external_id:
                        Order.objects.filter(pk=order.pk, external_id='').update(external_id=external_id)
                    Order.objects.filter(pk=order.pk, status=OrderStatus.PENDING).update(
                        status=OrderStatus.SUBMITTED,
                        note='broker entry submitted',
                    )
                except Exception as e:
                    logger.exception('Live order failed for %s', cand.symbol)
                    skipped.append({'symbol': cand.symbol, 'reason': f'broker outcome unconfirmed: {e}'})
                    Order.objects.filter(pk=order.pk, status=OrderStatus.PENDING).update(
                        note='broker entry outcome unconfirmed; reconcile before retry',
                    )
                    continue
            else:
                with transaction.atomic():
                    if not Candidate.objects.filter(pk=cand.pk, consumed=False).update(consumed=True):
                        skipped.append({'symbol': cand.symbol, 'reason': 'candidate already consumed'})
                        continue
                    filled_at = datetime.now(timezone.utc)
                    order = Order.objects.create(
                        symbol=cand.symbol, side=Side.BUY, qty=qty,
                        order_type=OrderType.MARKET, status=OrderStatus.FILLED,
                        filled_qty=qty, filled_value=qty * price,
                        venue=venue, candidate=cand, filled_at=filled_at,
                        note='paper-trade entry',
                    )
                    Position.objects.create(
                        symbol=cand.symbol, qty=qty, avg_cost=price,
                        venue=venue, entry_order=order,
                    )
                    Trade.objects.create(
                        symbol=cand.symbol, side=Side.BUY, qty=qty,
                        price=price, executed_at=filled_at, order=order,
                    )

            orders_created += 1
            if not live:
                positions_created += 1
            logger.info(
                'Trader entered %s x%d @ %s [%s]',
                cand.symbol, qty, price, 'live' if live else 'paper',
            )

        return {
            'orders': orders_created,
            'positions': positions_created,
            'skipped': skipped,
            'mode': 'live' if live else 'paper',
        }

    def list_positions(self, only_open: bool = True, venue: str = ExecutionVenue.PAPER) -> list[dict]:
        from trading_core.enums import PositionStatus
        qs = Position.objects.filter(venue=venue)
        if only_open:
            qs = qs.filter(status=PositionStatus.OPEN)
        return [
            {
                'id': p.id,
                'symbol': p.symbol,
                'qty': p.qty,
                'avgCost': p.avg_cost,
                'venue': p.venue,
                'status': p.status,
                'openedAt': p.opened_at.isoformat(),
                'closedAt': p.closed_at.isoformat() if p.closed_at else None,
            }
            for p in qs
        ]
