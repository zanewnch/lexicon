"""
Exiter — exit stage of the trading pipeline.

Consumes pending ExitSignals, full liquidation per signal (market sell of
the whole position).

Paper orders fill locally. Broker orders remain pending until confirmed deals
arrive from Shioaji or are reconciled from broker status.
"""
import logging
import time
from datetime import datetime, timezone

from django.db import transaction

from trading_core.enums import ExecutionVenue, OrderStatus, OrderType, PositionStatus, Side
from trading_core.models import ExitSignal, Order, Trade
from trading_core.order_refs import make_client_ref

logger = logging.getLogger(__name__)

LIVE_ORDER_INTERVAL_SEC = 3.5  # ≥ AccountService.ORDER_COOLDOWN_SECONDS


class ExiterService:
    """Executes pending ExitSignals as market sells."""

    def execute(self, live: bool = False, trade_pin: str = '', expected_venue: str = '') -> dict:
        if live and not trade_pin:
            raise ValueError('live mode requires trade_pin')

        account = None
        venue = ExecutionVenue.PAPER
        if live:
            from account.service import AccountService
            account = AccountService()
            _, venue = account.prepare_order(trade_pin, expected_venue)

        signals = list(ExitSignal.objects.filter(
            processed=False, position__venue=venue,
        ).select_related('position'))
        if not signals:
            return {'closed': 0, 'submitted': 0, 'skipped': [], 'mode': 'live' if live else 'paper'}

        closed = 0
        submitted = 0
        skipped: list[dict] = []

        for idx, sig in enumerate(signals):
            pos = sig.position
            if pos.venue != venue:
                skipped.append({'signalId': sig.id, 'reason': 'position belongs to another trading mode'})
                continue
            if pos.status != PositionStatus.OPEN:
                sig.processed = True
                sig.note = (sig.note + ' | position-not-open').strip(' |')
                sig.save(update_fields=['processed', 'note'])
                skipped.append({'signalId': sig.id, 'reason': 'position not open'})
                continue
            if Order.objects.filter(
                position=pos,
                side=Side.SELL,
                status__in=[OrderStatus.PENDING, OrderStatus.SUBMITTED, OrderStatus.PARTIALLY_FILLED],
            ).exists():
                skipped.append({'signalId': sig.id, 'reason': 'sell order already pending'})
                continue

            exit_price = sig.triggered_price
            pnl = (exit_price - pos.avg_cost) * pos.qty

            now = datetime.now(timezone.utc)

            if live:
                if idx > 0:
                    time.sleep(LIVE_ORDER_INTERVAL_SEC)
                with transaction.atomic():
                    if not ExitSignal.objects.filter(pk=sig.pk, processed=False).update(processed=True):
                        skipped.append({'signalId': sig.id, 'reason': 'signal already processed'})
                        continue
                    order = Order.objects.create(
                        symbol=pos.symbol, side=Side.SELL, qty=pos.qty,
                        order_type=OrderType.MARKET, status=OrderStatus.PENDING,
                        venue=venue, position=pos,
                        exit_signal=sig, note='broker exit awaiting submission',
                    )
                    client_ref = make_client_ref(order.pk)
                    order.client_ref = client_ref
                    order.save(update_fields=['client_ref'])
                try:
                    result = account.place_order({
                        'code': pos.symbol,
                        'side': 'sell',
                        'shares': pos.qty,
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
                        status=OrderStatus.SUBMITTED, note='broker exit submitted',
                    )
                except Exception as e:
                    logger.exception('Live exit failed for %s', pos.symbol)
                    skipped.append({'signalId': sig.id, 'reason': f'broker outcome unconfirmed: {e}'})
                    Order.objects.filter(pk=order.pk, status=OrderStatus.PENDING).update(
                        note='broker exit outcome unconfirmed; reconcile before retry',
                    )
                    continue
                submitted += 1
            else:
                with transaction.atomic():
                    if not ExitSignal.objects.filter(pk=sig.pk, processed=False).update(processed=True):
                        skipped.append({'signalId': sig.id, 'reason': 'signal already processed'})
                        continue
                    order = Order.objects.create(
                        symbol=pos.symbol, side=Side.SELL, qty=pos.qty,
                        order_type=OrderType.MARKET, status=OrderStatus.FILLED,
                        filled_qty=pos.qty, filled_value=pos.qty * exit_price,
                        venue=venue, position=pos, exit_signal=sig,
                        filled_at=now, note=f'paper-trade exit ({sig.reason})',
                    )
                    Trade.objects.create(
                        symbol=pos.symbol, side=Side.SELL, qty=pos.qty,
                        price=exit_price, executed_at=now, pnl=pnl, order=order,
                    )
                    pos.status = PositionStatus.CLOSED
                    pos.closed_at = now
                    pos.save(update_fields=['status', 'closed_at'])
                closed += 1
            logger.info(
                'Exiter %s %s x%d reason=%s',
                'submitted' if live else 'closed', pos.symbol, pos.qty, sig.reason,
            )

        return {'closed': closed, 'submitted': submitted, 'skipped': skipped, 'mode': 'live' if live else 'paper'}
