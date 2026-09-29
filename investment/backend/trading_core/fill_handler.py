"""Reconcile Shioaji stock deal events into confirmed fills and positions."""

import logging
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from django.db import transaction

from trading_core.enums import ExecutionVenue, OrderStatus, PositionStatus, Side
from trading_core.models import BrokerFill, Order, Position, Trade

logger = logging.getLogger(__name__)


class FillHandler:
    """Process each uniquely identified broker deal exactly once."""

    _lock = Lock()
    _registered_api: Any = None
    _registered_venue: str = ''

    @staticmethod
    def _enum_value(value: Any) -> str:
        """Shioaji string enums render as `OrderStatus.Cancelled` via str()."""
        return str(getattr(value, 'value', None) or getattr(value, 'name', None) or value or '')

    @classmethod
    def _callback_payload(cls, value: Any) -> Any:
        """Convert SDK OrderEventDict and nested mapping objects into dictionaries."""
        if callable(getattr(value, 'items', None)):
            return {key: cls._callback_payload(item) for key, item in value.items()}
        return value

    @staticmethod
    def _same_deal(fill: BrokerFill, qty: int, price: float, ts: datetime) -> bool:
        """Match the same deal across callback and list_trades identifiers."""
        return (fill.qty == qty and abs(fill.price - price) < 1e-6
                and abs((fill.executed_at - ts).total_seconds()) <= 0.001)

    @classmethod
    def _from_registered_stock_account(cls, state: str, data: dict) -> bool:
        api = cls._registered_api
        if api is None:
            return True
        account = getattr(api, 'stock_account', None)
        expected_id = str(getattr(account, 'account_id', '') or '')
        expected_broker = str(getattr(account, 'broker_id', '') or '')
        reported = ((data.get('order') or {}).get('account') or {}
                    if state in ('StockOrder', 'SORDER') else data)
        reported_id = str(reported.get('account_id') or '')
        reported_broker = str(reported.get('broker_id') or '')
        if (not expected_id or not expected_broker
                or (reported_id and reported_id != expected_id)
                or (reported_broker and reported_broker != expected_broker)):
            logger.error('Broker callback account mismatched; reconcile manually')
            return False
        if not reported_id or not reported_broker:
            broker_order = (data.get('order') or {}) if state in ('StockOrder', 'SORDER') else data
            trade_id = (str(broker_order.get('id') or '') if state in ('StockOrder', 'SORDER')
                        else str(data.get('trade_id') or ''))
            client_ref = str(broker_order.get('custom_field') or '')
            known_order = Order.objects.filter(venue=cls._registered_venue)
            matched = (trade_id and known_order.filter(external_id=trade_id).exists())
            if not matched and client_ref:
                matched = known_order.filter(
                    client_ref=client_ref, external_id__in=['', trade_id],
                ).exists()
            if not matched:
                logger.warning('Broker callback lacks account identity and known order; reconcile manually')
                return False
        return True

    @classmethod
    def register(cls, api: Any, venue: str) -> bool:
        with cls._lock:
            if cls._registered_api is api and cls._registered_venue == venue:
                return False
            if not hasattr(api, 'set_order_callback'):
                raise RuntimeError('Broker API does not support order callbacks')
            api.set_order_callback(cls._raw_callback)
            cls._registered_api = api
            cls._registered_venue = venue
            return True

    @classmethod
    def _raw_callback(cls, stat: Any, msg: Any) -> None:
        """Shioaji StockDeal contains trade_id, exchange_seq, lots and price."""
        try:
            state = cls._enum_value(stat)
            data = cls._callback_payload(msg)
            if not isinstance(data, dict):
                logger.error('Unsupported broker callback payload; reconcile manually')
                return
            if state not in ('StockOrder', 'SORDER', 'StockDeal', 'SDEAL'):
                return
            if not cls._from_registered_stock_account(state, data):
                return
            if state in ('StockOrder', 'SORDER'):
                cls._on_order_event(data, venue=cls._registered_venue)
                return
            trade_id = str(data.get('trade_id') or '')
            client_ref = str(data.get('custom_field') or '')
            event_key = (f"{trade_id}:{data['exchange_seq']}"
                         + (f':{cls._registered_venue}' if cls._registered_venue else '')
                         if trade_id and data.get('exchange_seq') else '')
            if not (trade_id or client_ref) or not event_key:
                logger.error('Broker deal missing order or event identity; reconcile manually')
                return
            lot = data.get('order_lot')
            if cls._enum_value(lot) != 'Common':
                logger.error('Unsupported broker deal lot type; reconcile manually')
                return
            qty = int(data.get('quantity', 0)) * 1000
            price = float(data.get('price', 0))
            raw_ts = data.get('ts')
            ts = datetime.fromtimestamp(float(raw_ts), timezone.utc) if raw_ts else datetime.now(timezone.utc)
            cls.on_fill(
                trade_id, price, qty, ts, event_key=event_key,
                client_ref=client_ref, symbol=str(data.get('code') or ''),
                side=cls._enum_value(data.get('action')).lower(),
                venue=cls._registered_venue,
            )
        except Exception:
            logger.exception('Broker fill callback failed; reconcile manually')

    @classmethod
    def _on_order_event(cls, data: dict, venue: str = '') -> None:
        operation = data.get('operation') or {}
        op_type = operation.get('op_type')
        op_code = str(operation.get('op_code') or '')
        if op_type == 'Cancel' and op_code == '00':
            new_status = OrderStatus.CANCELLED
        elif op_type == 'New' and op_code and op_code != '00':
            new_status = OrderStatus.FAILED
        else:
            return
        broker_order = data.get('order') or {}
        contract = data.get('contract') or {}
        broker_id = str(broker_order.get('id') or '')
        client_ref = str(broker_order.get('custom_field') or '')
        with transaction.atomic():
            qs = Order.objects.select_for_update()
            order = qs.filter(client_ref=client_ref).first() if client_ref else None
            if order is None and broker_id:
                order = qs.filter(external_id=broker_id).first()
            if order is None:
                logger.error('Broker order event has no matching local order; reconcile manually')
                return
            if venue and order.venue != venue:
                logger.error('Broker order event venue mismatch; reconcile manually')
                return
            if broker_id and order.external_id and broker_id != order.external_id:
                logger.error('Broker order event ID conflicts with local order; reconcile manually')
                return
            if order.venue == ExecutionVenue.PAPER or order.status in (
                OrderStatus.FILLED, OrderStatus.CANCELLED, new_status,
            ):
                return
            if (contract.get('code') != order.symbol
                    or cls._enum_value(broker_order.get('action')).lower() != order.side):
                logger.error('Broker order event contract or action mismatch; reconcile manually')
                return
            order.status = new_status
            order.external_id = broker_id or order.external_id
            order.note = 'broker cancelled remaining quantity' if new_status == OrderStatus.CANCELLED else 'broker rejected order'
            order.save(update_fields=['status', 'external_id', 'note'])
            if order.side == Side.BUY and order.filled_qty == 0 and order.candidate_id:
                order.candidate.consumed = False
                order.candidate.save(update_fields=['consumed'])
            if order.side == Side.SELL and order.exit_signal_id and order.position_id:
                if order.position.status == PositionStatus.OPEN:
                    order.exit_signal.processed = False
                    order.exit_signal.save(update_fields=['processed'])

    @classmethod
    def on_fill(
        cls, external_id: str, price: float, qty: int, ts: datetime,
        *, event_key: str, client_ref: str = '', symbol: str = '', side: str = '',
        venue: str = '',
    ) -> bool:
        """Apply one confirmed common-lot fill; never infer a fill from submission."""
        if not event_key or qty <= 0 or price <= 0 or qty % 1000:
            logger.error('Invalid broker fill; reconcile manually')
            return False
        with transaction.atomic():
            qs = Order.objects.select_for_update()
            order = qs.filter(client_ref=client_ref).first() if client_ref else None
            if order is None and external_id:
                order = qs.filter(external_id=external_id).first()
            if order is None:
                logger.error('Fill for unknown broker order; reconcile manually')
                return False
            if venue and order.venue != venue:
                logger.error('Broker fill venue mismatch; reconcile manually')
                return False
            if external_id and order.external_id and order.external_id != external_id:
                logger.error('Broker fill ID disagrees with stored order; reconcile manually')
                return False
            if symbol != order.symbol or side != order.side:
                logger.error('Broker fill contract or action disagrees with stored order; reconcile manually')
                return False
            if BrokerFill.objects.filter(event_key=event_key).exists():
                return False
            if venue and event_key.endswith(f':{venue}'):
                legacy_key = event_key[:-(len(venue) + 1)]
                if BrokerFill.objects.filter(order=order, event_key=legacy_key).exists():
                    return False
            if not event_key.startswith(f'{external_id}:snapshot:'):
                snapshots = list(BrokerFill.objects.filter(
                    order=order, event_key__startswith=f'{external_id}:snapshot:',
                ))
                if any(cls._same_deal(fill, qty, price, ts) for fill in snapshots):
                    return False
                if any(fill.qty == qty and abs(fill.price - price) < 1e-6
                       and abs((fill.executed_at - ts).total_seconds()) <= 1
                       for fill in snapshots):
                    logger.error('Callback is ambiguous with reconciled broker snapshot; reconcile manually')
                    return False
                if snapshots and ts <= max(fill.executed_at for fill in snapshots):
                    logger.error('Callback predates reconciled broker snapshot; reconcile manually')
                    return False
            if order.venue == ExecutionVenue.PAPER or order.filled_qty + qty > order.qty:
                logger.error('Broker fill exceeds order or targets paper trade; reconcile manually')
                return False
            if order.side == Side.SELL:
                pos = Position.objects.select_for_update().filter(pk=order.position_id).first()
                if pos is None or pos.venue != order.venue or pos.status != PositionStatus.OPEN or pos.qty < qty:
                    logger.error('Broker sell fill has no matching open position; reconcile manually')
                    return False

            _, created = BrokerFill.objects.get_or_create(
                event_key=event_key,
                defaults={'order': order, 'qty': qty, 'price': price, 'executed_at': ts},
            )
            if not created:
                return False

            if order.side == Side.BUY:
                pos = Position.objects.select_for_update().filter(entry_order=order).first()
                if pos is None:
                    Position.objects.create(
                        symbol=order.symbol, qty=qty, avg_cost=price,
                        venue=order.venue, entry_order=order,
                    )
                else:
                    pos.avg_cost = (pos.avg_cost * pos.qty + price * qty) / (pos.qty + qty)
                    pos.qty += qty
                    pos.save(update_fields=['avg_cost', 'qty'])
                pnl = None
            else:
                pnl = (price - pos.avg_cost) * qty
                pos.qty -= qty
                if pos.qty == 0:
                    pos.status = PositionStatus.CLOSED
                    pos.closed_at = ts
                    pos.save(update_fields=['qty', 'status', 'closed_at'])
                else:
                    pos.save(update_fields=['qty'])

            Trade.objects.create(
                symbol=order.symbol, side=order.side, qty=qty, price=price,
                executed_at=ts, pnl=pnl, order=order,
            )
            order.filled_qty += qty
            order.filled_value += price * qty
            order.price = order.filled_value / order.filled_qty
            order.status = (OrderStatus.FILLED if order.filled_qty == order.qty
                            else OrderStatus.PARTIALLY_FILLED)
            if external_id and not order.external_id:
                order.external_id = external_id
            if order.status == OrderStatus.FILLED:
                order.filled_at = ts
            order.save(update_fields=[
                'filled_qty', 'filled_value', 'price', 'status', 'external_id', 'filled_at',
            ])
            logger.info('Broker fill reconciled: local order=%s qty=%s', order.pk, qty)
            return True

    @classmethod
    def reconcile_trade(cls, broker_trade: Any, *, venue: str = '') -> int:
        """Apply deals returned by update_status/list_trades after a callback gap."""
        with transaction.atomic():
            return cls._reconcile_trade_locked(broker_trade, venue=venue)

    @classmethod
    def _reconcile_trade_locked(cls, broker_trade: Any, *, venue: str = '') -> int:
        broker_order = broker_trade.order
        trade_id = str(getattr(broker_order, 'id', '') or '')
        client_ref = str(getattr(broker_order, 'custom_field', '') or '')
        lot = getattr(broker_order, 'order_lot', None)
        if cls._enum_value(lot) != 'Common':
            return 0
        symbol = str(getattr(broker_trade.contract, 'code', '') or '')
        side = cls._enum_value(getattr(broker_order, 'action', None)).lower()
        orders = Order.objects.select_for_update()
        if venue:
            orders = orders.filter(venue=venue)
        order = orders.filter(client_ref=client_ref).first() if client_ref else None
        if order is None and trade_id:
            order = orders.filter(external_id=trade_id).first()
        if order is None or order.venue == ExecutionVenue.PAPER:
            return 0
        if order.external_id and order.external_id != trade_id:
            logger.error('Broker snapshot ID conflicts with local order; reconcile manually')
            return 0
        try:
            broker_qty = int(getattr(broker_order, 'quantity')) * 1000
        except (TypeError, ValueError, AttributeError):
            logger.error('Broker snapshot quantity unavailable; reconcile manually')
            return 0
        if broker_qty != order.qty:
            logger.error('Broker snapshot quantity conflicts with local order; reconcile manually')
            return 0
        if order.symbol != symbol or order.side != side:
            logger.error('Broker snapshot contract or action mismatch; reconcile manually')
            return 0
        broker_deals = []
        for deal in getattr(broker_trade.status, 'deals', []) or []:
            seq = str(getattr(deal, 'seq', '') or '')
            if not trade_id or not seq:
                logger.error('Broker deal missing stable sequence; reconcile manually')
                return 0
            broker_deals.append((seq, int(deal.quantity) * 1000, float(deal.price),
                                 datetime.fromtimestamp(float(deal.ts), timezone.utc)))
        unmatched = list(BrokerFill.objects.filter(order=order))
        missing = []
        for seq, qty, price, ts in broker_deals:
            match = next((fill for fill in unmatched
                          if cls._same_deal(fill, qty, price, ts)), None)
            if match is None:
                missing.append((seq, qty, price, ts))
            else:
                unmatched.remove(match)
        if unmatched:
            logger.error('Broker snapshot does not cover local fills; reconcile manually')
            return 0
        applied = 0
        for seq, qty, price, ts in missing:
            if cls.on_fill(
                trade_id, price, qty, ts,
                event_key=f'{trade_id}:snapshot:{seq}:{order.venue}', client_ref=client_ref,
                symbol=symbol, side=side, venue=venue,
            ):
                applied += 1
        order.refresh_from_db()
        if trade_id and not order.external_id:
            order.external_id = trade_id
            order.save(update_fields=['external_id'])
        status = getattr(broker_trade.status, 'status', None)
        status_name = cls._enum_value(status)
        if status_name in ('Submitted', 'PreSubmitted') and order.status == OrderStatus.PENDING:
            if not trade_id:
                logger.error('Submitted broker order lacks ID; reconcile manually')
                return applied
            order.status = OrderStatus.SUBMITTED
            order.note = 'broker submission confirmed by reconciliation'
            order.save(update_fields=['status', 'note'])
        if status_name in ('Cancelled', 'Canceled', 'Failed'):
            cls._on_order_event({
                'operation': ({'op_type': 'New', 'op_code': '01'}
                              if status_name == 'Failed'
                              else {'op_type': 'Cancel', 'op_code': '00'}),
                'order': {
                    'id': trade_id, 'custom_field': client_ref,
                    'action': side.capitalize(),
                },
                'contract': {'code': symbol},
            }, venue=venue)
        return applied
