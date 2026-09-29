"""Refresh broker order status and apply confirmed deals to local orders."""

from django.core.management.base import BaseCommand, CommandError

from core.shioaji import ShioajiConnection
from trading_core.enums import ExecutionVenue, OrderStatus
from trading_core.fill_handler import FillHandler
from trading_core.models import Order


class Command(BaseCommand):
    help = 'Refresh stock order status and reconcile confirmed Shioaji deals.'

    def handle(self, *args, **options):
        connection = ShioajiConnection.get_instance()
        api = connection.get_api()
        venue = (ExecutionVenue.BROKER_SIMULATION if connection.simulation_mode
                 else ExecutionVenue.BROKER_PRODUCTION)
        api.update_status(api.stock_account)
        account_id = str(getattr(api.stock_account, 'account_id', '') or '')
        broker_id = str(getattr(api.stock_account, 'broker_id', '') or '')
        if not account_id or not broker_id:
            raise CommandError('Stock account identity is unavailable; refusing reconciliation')
        checked = applied = 0
        seen = set()
        unresolved = set()
        for trade in api.list_trades():
            account = getattr(trade.order, 'account', None)
            if (str(getattr(account, 'account_id', '') or '') != account_id
                    or str(getattr(account, 'broker_id', '') or '') != broker_id):
                continue
            trade_id = str(getattr(trade.order, 'id', '') or '')
            client_ref = str(getattr(trade.order, 'custom_field', '') or '')
            orders = Order.objects.filter(venue=venue)
            order = orders.filter(client_ref=client_ref).first() if client_ref else None
            if order is None and trade_id:
                order = orders.filter(external_id=trade_id).first()
            if order is None:
                continue
            seen.add(order.pk)
            checked += 1
            symbol = str(getattr(trade.contract, 'code', '') or '')
            side = FillHandler._enum_value(getattr(trade.order, 'action', None)).lower()
            lot = FillHandler._enum_value(getattr(trade.order, 'order_lot', None))
            try:
                broker_order_qty = int(getattr(trade.order, 'quantity')) * 1000
            except (TypeError, ValueError, AttributeError):
                broker_order_qty = None
            if (not trade_id or symbol != order.symbol or side != order.side
                    or lot != 'Common'
                    or broker_order_qty != order.qty
                    or (order.external_id and order.external_id != trade_id)
                    or (client_ref and order.client_ref and order.client_ref != client_ref)):
                unresolved.add(order.pk)
                continue
            applied += FillHandler.reconcile_trade(trade, venue=venue)
            order.refresh_from_db()
            broker_qty = sum(int(deal.quantity) for deal in
                             (getattr(trade.status, 'deals', []) or [])) * 1000
            if order.filled_qty != broker_qty:
                unresolved.add(order.pk)
            broker_status = FillHandler._enum_value(getattr(trade.status, 'status', None))
            expected_status = {
                'Submitted': OrderStatus.SUBMITTED,
                'PreSubmitted': OrderStatus.SUBMITTED,
                'Cancelled': OrderStatus.CANCELLED,
                'Canceled': OrderStatus.CANCELLED,
                'Failed': OrderStatus.FAILED,
                'Filled': OrderStatus.FILLED,
                'PartFilled': OrderStatus.PARTIALLY_FILLED,
            }.get(broker_status)
            if expected_status is None or order.status != expected_status:
                unresolved.add(order.pk)
        active = Order.objects.filter(
            venue=venue,
            status__in=[OrderStatus.PENDING, OrderStatus.SUBMITTED,
                        OrderStatus.PARTIALLY_FILLED],
        )
        unresolved.update(active.exclude(pk__in=seen).values_list('pk', flat=True))
        self.stdout.write(
            f'Checked {checked} tracked broker orders; applied {applied} new deals; '
            f'unresolved {len(unresolved)} local orders.'
        )
        if unresolved:
            raise CommandError(
                'Broker reconciliation incomplete for local order IDs: '
                + ', '.join(str(pk) for pk in sorted(unresolved))
            )
