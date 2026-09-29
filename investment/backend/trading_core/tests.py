"""Isolated paper and broker-callback tests; no broker orders are sent."""

from datetime import datetime, timezone
from enum import Enum
from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch

import shioaji as sj
from django.test import TestCase
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.test import APIClient

from bookkeeper.service import BookkeeperService
from exiter.service import ExiterService
from risk_guard.models import RiskConfig
from trader.service import TraderService
from trading_core.enums import ExecutionVenue, OrderStatus, PositionStatus
from trading_core.fill_handler import FillHandler
from trading_core.models import BrokerFill, Candidate, ExitSignal, Order, Position, Trade
from watchdog.service import WatchdogService


class SdkMapping:
    """SDK callback mappings expose items() but are not Python dicts."""

    __slots__ = ('values',)

    def __init__(self, values):
        self.values = values

    def items(self):
        return self.values.items()


class TradingPipelineTests(TestCase):
    class BrokerOrderStatus(str, Enum):
        PartFilled = 'PartFilled'
        Cancelled = 'Cancelled'

    class BrokerAction(str, Enum):
        Buy = 'Buy'

    class BrokerLot(str, Enum):
        Common = 'Common'

    def setUp(self):
        RiskConfig.objects.create(pk=1, max_position_pct=100)
        Candidate.objects.create(symbol='2330')

    def test_paper_entry_watchdog_exit_and_report_without_broker(self):
        with patch('account.service.AccountService.place_order') as place_order:
            entered = TraderService().execute(100_000, {'2330': 50})
            self.assertEqual((entered['orders'], entered['positions']), (1, 1))
            self.assertEqual(Order.objects.get().venue, ExecutionVenue.PAPER)
            self.assertEqual(Position.objects.get().qty, 2000)

            signals = WatchdogService().check({'2330': 55})
            self.assertEqual(len(signals), 1)
            self.assertEqual(len(WatchdogService().check({'2330': 56})), 0)
            exited = ExiterService().execute()

        place_order.assert_not_called()
        self.assertEqual(exited['closed'], 1)
        self.assertEqual(Position.objects.get().status, PositionStatus.CLOSED)
        self.assertEqual(BookkeeperService().get_report()['totalPnl'], 10_000)

    def test_candidate_selection_and_risk_sizing_prevent_other_orders(self):
        selected = Candidate.objects.get(symbol='2330')
        other = Candidate.objects.create(symbol='2454')
        config = RiskConfig.load()
        config.max_position_pct = 25
        config.save(update_fields=['max_position_pct'])

        result = TraderService().execute(
            10_000_000, {'2330': 2500, '2454': 1000},
            candidate_ids=[selected.pk],
        )

        self.assertEqual(result['orders'], 1)
        self.assertEqual(Order.objects.get().qty, 1000)
        other.refresh_from_db()
        self.assertFalse(other.consumed)

    def test_reconciliation_and_cancel_keep_confirmed_partial_fill(self):
        candidate = Candidate.objects.get()
        candidate.consumed = True
        candidate.save(update_fields=['consumed'])
        order = Order.objects.create(
            symbol='2330', side='buy', qty=2000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='abc123', external_id='buy-2', candidate=candidate,
        )
        broker_trade = SimpleNamespace(
            contract=SimpleNamespace(code='2330'),
            order=SimpleNamespace(
                id='buy-2', custom_field='abc123', order_lot=self.BrokerLot.Common,
                quantity=2,
                action=self.BrokerAction.Buy,
            ),
            status=SimpleNamespace(
                status=self.BrokerOrderStatus.PartFilled,
                deals=[SimpleNamespace(
                    seq='001', quantity=1, price=50,
                    ts=datetime.now(timezone.utc).timestamp(),
                )],
            ),
        )
        self.assertEqual(FillHandler.reconcile_trade(broker_trade), 1)
        self.assertEqual(FillHandler.reconcile_trade(broker_trade), 0)
        broker_trade.status.status = self.BrokerOrderStatus.Cancelled
        self.assertEqual(FillHandler.reconcile_trade(broker_trade), 0)
        order.refresh_from_db()
        candidate.refresh_from_db()
        self.assertEqual((order.status, order.filled_qty), (OrderStatus.CANCELLED, 1000))
        self.assertTrue(candidate.consumed)
        self.assertEqual(Position.objects.get().qty, 1000)

    def test_callback_and_snapshot_with_different_sequence_ids_count_once(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=2000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00001', external_id='broker-1',
        )
        ts = datetime.now(timezone.utc)
        callback = {
            'trade_id': 'broker-1', 'exchange_seq': 'exchange-985',
            'custom_field': 'P00001', 'action': 'Buy', 'code': '2330',
            'order_lot': 'Common', 'quantity': 1, 'price': 50,
            'ts': ts.timestamp(),
        }
        FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), callback)
        broker_trade = SimpleNamespace(
            contract=SimpleNamespace(code='2330'),
            order=SimpleNamespace(
                id='broker-1', custom_field='P00001', order_lot='Common', action='Buy',
                quantity=2,
            ),
            status=SimpleNamespace(status='PartFilled', deals=[
                SimpleNamespace(seq='000001', quantity=1, price=50, ts=ts.timestamp()),
            ]),
        )
        self.assertEqual(FillHandler.reconcile_trade(broker_trade), 0)
        self.assertEqual(BrokerFill.objects.count(), 1)
        self.assertEqual(Position.objects.get().qty, 1000)

        second_ts = datetime.fromtimestamp(ts.timestamp() + 2, timezone.utc)
        broker_trade.status.deals.append(SimpleNamespace(
            seq='000002', quantity=1, price=52, ts=second_ts.timestamp(),
        ))
        self.assertEqual(FillHandler.reconcile_trade(broker_trade), 1)
        self.assertEqual(Position.objects.get().qty, 2000)
        late_callback = {**callback, 'exchange_seq': 'exchange-986',
                         'quantity': 1, 'price': 52, 'ts': second_ts.timestamp()}
        FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), late_callback)
        self.assertEqual(BrokerFill.objects.count(), 2)
        self.assertEqual(Position.objects.get().qty, 2000)

    def test_late_callback_with_rounded_time_cannot_duplicate_snapshot_fill(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=2000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00014', external_id='broker-14',
        )
        ts = datetime.now(timezone.utc)
        common = dict(client_ref=order.client_ref, symbol='2330', side='buy',
                      venue=ExecutionVenue.BROKER_SIMULATION)
        self.assertTrue(FillHandler.on_fill(
            'broker-14', 50, 1000, ts,
            event_key='broker-14:snapshot:001:broker_simulation', **common,
        ))
        rounded_ts = datetime.fromtimestamp(ts.timestamp() + 0.5, timezone.utc)
        self.assertFalse(FillHandler.on_fill(
            'broker-14', 50, 1000, rounded_ts,
            event_key='broker-14:exchange-001:broker_simulation', **common,
        ))
        order.refresh_from_db()
        self.assertEqual((order.filled_qty, Position.objects.get().qty), (1000, 1000))
        self.assertEqual(BrokerFill.objects.count(), 1)

        later_ts = datetime.fromtimestamp(ts.timestamp() + 2, timezone.utc)
        self.assertTrue(FillHandler.on_fill(
            'broker-14', 50, 1000, later_ts,
            event_key='broker-14:exchange-002:broker_simulation', **common,
        ))
        self.assertEqual(Position.objects.get().qty, 2000)

    def test_callback_from_other_stock_account_does_not_fill_local_order(self):
        Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00002', external_id='broker-2',
        )
        api = SimpleNamespace(stock_account=SimpleNamespace(
            account_id='expected-account', broker_id='expected-broker',
        ))
        with patch.object(FillHandler, '_registered_api', api):
            FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
                'trade_id': 'broker-2', 'exchange_seq': 'exchange-1',
                'custom_field': 'P00002', 'action': 'Buy', 'code': '2330',
                'account_id': 'another-account', 'broker_id': 'expected-broker',
                'order_lot': 'Common', 'quantity': 1, 'price': 50,
                'ts': datetime.now(timezone.utc).timestamp(),
            })
        self.assertFalse(BrokerFill.objects.exists())
        self.assertFalse(Position.objects.exists())

    def test_simulation_callback_cannot_fill_production_order(self):
        Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_PRODUCTION,
            client_ref='P00006', external_id='broker-6',
        )
        api = SimpleNamespace(stock_account=SimpleNamespace(
            account_id='account', broker_id='broker',
        ))
        with (patch.object(FillHandler, '_registered_api', api),
              patch.object(FillHandler, '_registered_venue', ExecutionVenue.BROKER_SIMULATION)):
            FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
                'trade_id': 'broker-6', 'exchange_seq': 'exchange-6',
                'custom_field': 'P00006', 'action': 'Buy', 'code': '2330',
                'account_id': 'account', 'broker_id': 'broker',
                'order_lot': 'Common', 'quantity': 1, 'price': 50,
                'ts': datetime.now(timezone.utc).timestamp(),
            })
            FillHandler._raw_callback(SimpleNamespace(name='StockOrder'), {
                'operation': {'op_type': 'Cancel', 'op_code': '00'},
                'order': {
                    'id': 'broker-6', 'custom_field': 'P00006', 'action': 'Buy',
                    'account': {'account_id': 'account', 'broker_id': 'broker'},
                },
                'contract': {'code': '2330'},
            })
        self.assertFalse(BrokerFill.objects.exists())
        self.assertFalse(Position.objects.exists())
        self.assertEqual(Order.objects.get(client_ref='P00006').status, OrderStatus.SUBMITTED)

    def test_same_broker_sequence_in_both_venues_keeps_distinct_fills(self):
        account = SimpleNamespace(account_id='account', broker_id='broker')
        api = SimpleNamespace(stock_account=account)
        ts = datetime.now(timezone.utc).timestamp()
        for venue, client_ref in (
            (ExecutionVenue.BROKER_SIMULATION, 'P00007'),
            (ExecutionVenue.BROKER_PRODUCTION, 'P00008'),
        ):
            Order.objects.create(
                symbol='2330', side='buy', qty=1000,
                status=OrderStatus.SUBMITTED, venue=venue,
                client_ref=client_ref, external_id='same-broker-id',
            )
            with (patch.object(FillHandler, '_registered_api', api),
                  patch.object(FillHandler, '_registered_venue', venue)):
                FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
                    'trade_id': 'same-broker-id', 'exchange_seq': 'same-sequence',
                    'custom_field': client_ref, 'action': 'Buy', 'code': '2330',
                    'account_id': 'account', 'broker_id': 'broker',
                    'order_lot': 'Common', 'quantity': 1, 'price': 50, 'ts': ts,
                })
        self.assertEqual(BrokerFill.objects.count(), 2)
        self.assertEqual(Position.objects.filter(qty=1000).count(), 2)

    def test_sdk_stock_deal_then_cancel_preserves_partial_position(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=2000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00009', external_id='sdk-order-1',
        )
        account = SimpleNamespace(account_id='account', broker_id='broker')
        api = SimpleNamespace(stock_account=account)
        with (patch.object(FillHandler, '_registered_api', api),
              patch.object(FillHandler, '_registered_venue', ExecutionVenue.BROKER_SIMULATION)):
            FillHandler._raw_callback(sj.OrderState.StockDeal, SdkMapping({
                'trade_id': 'sdk-order-1', 'exchange_seq': 'exchange-9',
                'account_id': 'account', 'broker_id': 'broker',
                'custom_field': 'P00009', 'action': 'Buy', 'code': '2330',
                'order_lot': 'Common', 'quantity': 1, 'price': 2500,
                'ts': datetime.now(timezone.utc).timestamp(),
            }))
            FillHandler._raw_callback(sj.OrderState.StockOrder, SdkMapping({
                'operation': SdkMapping({'op_type': 'Cancel', 'op_code': '00'}),
                'order': SdkMapping({
                    'id': 'sdk-order-1', 'custom_field': 'P00009',
                    'account': SdkMapping({'account_id': 'account', 'broker_id': 'broker'}),
                    'action': 'Buy',
                }),
                'contract': SdkMapping({'code': '2330'}),
            }))
        order.refresh_from_db()
        self.assertEqual((order.status, order.filled_qty), (OrderStatus.CANCELLED, 1000))
        self.assertEqual(Position.objects.get(entry_order=order).qty, 1000)

    def test_callback_without_account_fields_requires_known_broker_order(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00004', external_id='broker-4',
        )
        api = SimpleNamespace(stock_account=SimpleNamespace(
            account_id='expected-account', broker_id='expected-broker',
        ))
        with (patch.object(FillHandler, '_registered_api', api),
              patch.object(FillHandler, '_registered_venue', ExecutionVenue.BROKER_SIMULATION)):
            FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
                'trade_id': 'unknown', 'exchange_seq': '1',
                'custom_field': order.client_ref, 'action': 'Buy', 'code': '2330',
                'order_lot': 'Common', 'quantity': 1, 'price': 50,
                'ts': datetime.now(timezone.utc).timestamp(),
            })
            self.assertFalse(Position.objects.exists())
            FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
                'trade_id': 'broker-4', 'exchange_seq': '2',
                'custom_field': order.client_ref, 'action': 'Buy', 'code': '2330',
                'order_lot': 'Common', 'quantity': 1, 'price': 50,
                'ts': datetime.now(timezone.utc).timestamp(),
            })
        self.assertEqual(Position.objects.get().qty, 1000)

    def test_callback_before_broker_order_id_is_saved_uses_local_client_ref(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.PENDING, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00005',
        )
        api = SimpleNamespace(stock_account=SimpleNamespace(
            account_id='expected-account', broker_id='expected-broker',
        ))
        with (patch.object(FillHandler, '_registered_api', api),
              patch.object(FillHandler, '_registered_venue', ExecutionVenue.BROKER_SIMULATION)):
            FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
                'trade_id': 'broker-5', 'exchange_seq': 'exchange-5',
                'custom_field': order.client_ref, 'action': 'Buy', 'code': '2330',
                'order_lot': 'Common', 'quantity': 1, 'price': 50,
                'ts': datetime.now(timezone.utc).timestamp(),
            })
        order.refresh_from_db()
        self.assertEqual((order.external_id, order.status, order.filled_qty),
                         ('broker-5', OrderStatus.FILLED, 1000))
        self.assertEqual(Position.objects.get().qty, 1000)

    def test_reconcile_command_reports_pending_order_missing_from_broker_list(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.PENDING, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00003',
        )
        account = SimpleNamespace(account_id='account', broker_id='broker')
        api = SimpleNamespace(stock_account=account, update_status=lambda _: None,
                              list_trades=lambda: [])
        connection = SimpleNamespace(simulation_mode=True, get_api=lambda: api)
        with patch('trader.management.commands.reconcile_broker_orders.ShioajiConnection.get_instance',
                   return_value=connection):
            with self.assertRaisesRegex(CommandError, str(order.pk)):
                call_command('reconcile_broker_orders', stdout=StringIO())

    def test_reconcile_confirms_submission_after_unknown_send_result(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.PENDING, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00010',
        )
        account = SimpleNamespace(account_id='account', broker_id='broker')
        broker_trade = SimpleNamespace(
            contract=SimpleNamespace(code='2330'),
            order=SimpleNamespace(
                id='accepted-10', custom_field='P00010', account=account,
                action='Buy', order_lot='Common', quantity=1,
            ),
            status=SimpleNamespace(status='Submitted', deals=[]),
        )
        api = SimpleNamespace(stock_account=account, update_status=lambda _: None,
                              list_trades=lambda: [broker_trade])
        connection = SimpleNamespace(simulation_mode=True, get_api=lambda: api)
        output = StringIO()

        with patch('trader.management.commands.reconcile_broker_orders.ShioajiConnection.get_instance',
                   return_value=connection):
            call_command('reconcile_broker_orders', stdout=output)

        order.refresh_from_db()
        self.assertEqual((order.status, order.external_id),
                         (OrderStatus.SUBMITTED, 'accepted-10'))
        self.assertIn('unresolved 0 local orders', output.getvalue())

    def test_reconcile_rejects_mismatched_broker_symbol(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00011', external_id='accepted-11',
        )
        account = SimpleNamespace(account_id='account', broker_id='broker')
        broker_trade = SimpleNamespace(
            contract=SimpleNamespace(code='2454'),
            order=SimpleNamespace(
                id='accepted-11', custom_field='P00011', account=account,
                action='Buy', order_lot='Common', quantity=1,
            ),
            status=SimpleNamespace(status='Submitted', deals=[]),
        )
        api = SimpleNamespace(stock_account=account, update_status=lambda _: None,
                              list_trades=lambda: [broker_trade])
        connection = SimpleNamespace(simulation_mode=True, get_api=lambda: api)

        with patch('trader.management.commands.reconcile_broker_orders.ShioajiConnection.get_instance',
                   return_value=connection):
            with self.assertRaisesRegex(CommandError, str(order.pk)):
                call_command('reconcile_broker_orders', stdout=StringIO())
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.SUBMITTED)

    def test_reconcile_rejects_mismatched_broker_quantity_before_fill(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=2000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00012', external_id='accepted-12',
        )
        account = SimpleNamespace(account_id='account', broker_id='broker')
        broker_trade = SimpleNamespace(
            contract=SimpleNamespace(code='2330'),
            order=SimpleNamespace(
                id='accepted-12', custom_field='P00012', account=account,
                action='Buy', order_lot='Common', quantity=1,
            ),
            status=SimpleNamespace(status='Filled', deals=[SimpleNamespace(
                seq='001', quantity=1, price=2500,
                ts=datetime.now(timezone.utc).timestamp(),
            )]),
        )
        api = SimpleNamespace(stock_account=account, update_status=lambda _: None,
                              list_trades=lambda: [broker_trade])
        connection = SimpleNamespace(simulation_mode=True, get_api=lambda: api)

        with patch('trader.management.commands.reconcile_broker_orders.ShioajiConnection.get_instance',
                   return_value=connection):
            with self.assertRaisesRegex(CommandError, str(order.pk)):
                call_command('reconcile_broker_orders', stdout=StringIO())
        order.refresh_from_db()
        self.assertEqual((order.status, order.filled_qty), (OrderStatus.SUBMITTED, 0))
        self.assertFalse(Position.objects.exists())

    def test_cancel_callback_rejects_conflicting_broker_id(self):
        order = Order.objects.create(
            symbol='2330', side='buy', qty=1000,
            status=OrderStatus.SUBMITTED, venue=ExecutionVenue.BROKER_SIMULATION,
            client_ref='P00013', external_id='accepted-13',
        )
        FillHandler._on_order_event({
            'operation': {'op_type': 'Cancel', 'op_code': '00'},
            'order': {'id': 'another-order', 'custom_field': 'P00013', 'action': 'Buy'},
            'contract': {'code': '2330'},
        }, venue=ExecutionVenue.BROKER_SIMULATION)
        order.refresh_from_db()
        self.assertEqual((order.status, order.external_id),
                         (OrderStatus.SUBMITTED, 'accepted-13'))

    @patch('account.service.AccountService.place_order', side_effect=RuntimeError('timeout'))
    @patch('account.service.AccountService.prepare_order')
    def test_uncertain_broker_submission_stays_pending_for_reconciliation(self, prepare, place):
        prepare.return_value = (object(), ExecutionVenue.BROKER_SIMULATION)
        result = TraderService().execute(
            100_000, {'2330': 50}, live=True, trade_pin='test',
            expected_venue=ExecutionVenue.BROKER_SIMULATION,
        )
        order = Order.objects.get()
        self.assertEqual(result['orders'], 0)
        self.assertEqual(order.status, OrderStatus.PENDING)
        self.assertEqual(len(order.client_ref), 6)
        self.assertTrue(Candidate.objects.get().consumed)
        self.assertFalse(Position.objects.exists())

    @patch('account.service.AccountService.place_order')
    @patch('account.service.AccountService.prepare_order')
    def test_exit_does_not_overwrite_callback_broker_id(self, prepare, place):
        prepare.return_value = (object(), ExecutionVenue.BROKER_SIMULATION)
        position = Position.objects.create(
            symbol='2330', qty=1000, avg_cost=50,
            venue=ExecutionVenue.BROKER_SIMULATION,
        )
        ExitSignal.objects.create(position=position, reason='take_profit', triggered_price=55)

        def callback_first(_payload):
            Order.objects.filter(side='sell').update(external_id='callback-id')
            return {'order_id': 'different-id'}

        place.side_effect = callback_first
        result = ExiterService().execute(
            live=True, trade_pin='test', expected_venue=ExecutionVenue.BROKER_SIMULATION,
        )
        order = Order.objects.get(side='sell')
        self.assertEqual(result['submitted'], 0)
        self.assertEqual(order.external_id, 'callback-id')
        self.assertEqual(order.status, OrderStatus.PENDING)

    @patch('account.service.AccountService.place_order')
    @patch('account.service.AccountService.prepare_order')
    def test_broker_orders_wait_for_distinct_deals_and_keep_modes_separate(self, prepare, place):
        prepare.return_value = (object(), ExecutionVenue.BROKER_SIMULATION)
        place.side_effect = lambda payload: {
            'order_id': 'buy-1' if payload['side'] == 'buy' else 'sell-1',
        }
        entered = TraderService().execute(
            100_000, {'2330': 50}, live=True, trade_pin='test',
            expected_venue=ExecutionVenue.BROKER_SIMULATION,
        )
        self.assertEqual((entered['orders'], entered['positions']), (1, 0))
        buy = Order.objects.get(side='buy')
        self.assertEqual(buy.status, OrderStatus.SUBMITTED)
        self.assertFalse(Position.objects.exists())
        self.assertFalse(Trade.objects.exists())

        self._deal(buy, 'buy-1', 'fill-1', 50, 'Buy')
        buy.refresh_from_db()
        self.assertEqual((buy.status, buy.filled_qty), (OrderStatus.PARTIALLY_FILLED, 1000))
        self.assertEqual(Position.objects.get().qty, 1000)
        self._deal(buy, 'buy-1', 'fill-1', 50, 'Buy')
        self.assertEqual(BrokerFill.objects.count(), 1)
        self._deal(buy, 'buy-1', 'fill-2', 52, 'Buy')
        buy.refresh_from_db()
        self.assertEqual((buy.status, buy.filled_qty), (OrderStatus.FILLED, 2000))
        self.assertEqual(Position.objects.get().avg_cost, 51)

        self.assertEqual(len(WatchdogService().check({'2330': 60})), 0)
        self.assertEqual(len(WatchdogService().check(
            {'2330': 60}, venue=ExecutionVenue.BROKER_SIMULATION,
        )), 1)
        exited = ExiterService().execute(
            live=True, trade_pin='test', expected_venue=ExecutionVenue.BROKER_SIMULATION,
        )
        self.assertEqual((exited['submitted'], exited['closed']), (1, 0))
        sell = Order.objects.get(side='sell')
        self.assertEqual(Position.objects.get().status, PositionStatus.OPEN)
        self.assertEqual(Trade.objects.filter(side='sell').count(), 0)

        self._deal(sell, 'sell-1', 'fill-3', 60, 'Sell')
        self.assertEqual(Position.objects.get().qty, 1000)
        self.assertEqual(Position.objects.get().status, PositionStatus.OPEN)
        self._deal(sell, 'sell-1', 'fill-4', 61, 'Sell')
        self.assertEqual(Position.objects.get().status, PositionStatus.CLOSED)
        self.assertEqual(BookkeeperService().get_report()['totalTrades'], 0)
        report = BookkeeperService().get_report(ExecutionVenue.BROKER_SIMULATION)
        self.assertEqual(report['totalPnl'], 19_000)

    @staticmethod
    def _deal(order, external_id, event_key, price, action):
        FillHandler._raw_callback(SimpleNamespace(name='StockDeal'), {
            'event_id': event_key,
            'exchange_seq': event_key,
            'trade_id': external_id,
            'custom_field': order.client_ref,
            'action': action,
            'code': '2330',
            'order_lot': 'Common',
            'quantity': 1,
            'price': price,
            'ts': datetime.now(timezone.utc).timestamp(),
        })


class TradingRequestValidationTests(TestCase):
    def test_http_paper_pipeline_has_no_broker_side_effect(self):
        RiskConfig.objects.create(pk=1, max_position_pct=100)
        client = APIClient()
        with patch('account.service.AccountService.place_order') as place_order:
            scanner = client.post('/api/scanner/run/', {'symbols': ['2330']}, format='json')
            self.assertEqual(scanner.status_code, 201)
            trader = client.post('/api/trader/execute/', {
                'capital': 100_000, 'prices': {'2330': 50}, 'live': False,
            }, format='json')
            self.assertEqual(trader.status_code, 201)
            watchdog = client.post('/api/watchdog/check/', {
                'prices': {'2330': 55}, 'venue': 'paper',
            }, format='json')
            self.assertEqual(watchdog.status_code, 201)
            exiter = client.post('/api/exiter/execute/', {'live': False}, format='json')
            self.assertEqual(exiter.status_code, 201)
        place_order.assert_not_called()
        self.assertEqual(client.get('/api/bookkeeper/report/').data['totalPnl'], 10_000)

    def test_strings_cannot_enable_broker_orders_or_switch_mode(self):
        client = APIClient()
        self.assertEqual(client.post('/api/trader/execute/', {
            'capital': 100_000, 'prices': {}, 'live': 'false',
        }, format='json').status_code, 400)
        self.assertEqual(client.post('/api/exiter/execute/', {
            'live': 'false',
        }, format='json').status_code, 400)
        self.assertEqual(client.post('/api/system/mode/', {
            'simulation': 'false',
        }, format='json').status_code, 400)
        self.assertEqual(client.post('/api/trader/execute/', {
            'capital': 100_000, 'prices': {}, 'candidateIds': [True],
        }, format='json').status_code, 400)

    @patch('account.service.AccountService._verify_trade_pin', return_value=False)
    def test_risk_limits_cannot_be_disabled_without_configured_pin(self, verify_pin):
        client = APIClient()
        response = client.put('/api/risk/config/', {
            'enabled': False, 'tradePin': 'guess',
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(RiskConfig.load().enabled)
