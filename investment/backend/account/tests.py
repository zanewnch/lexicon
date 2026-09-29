"""Broker order gates use fake APIs; tests never submit to Shioaji."""

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, PropertyMock, patch

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from account.service import AccountService
from core.cache import CacheManager, ServiceUnavailable
from trading_core.enums import ExecutionVenue, OrderStatus
from trading_core.fill_handler import FillHandler
from trading_core.models import Order, Position, Trade


class BrokerAccessTests(SimpleTestCase):
    def setUp(self):
        self.service = AccountService()
        self.service._conn = SimpleNamespace(simulation_mode=True)

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    def test_bidask_snapshot_has_only_real_best_prices(self, api_property):
        api = MagicMock()
        api.snapshots.return_value = [SimpleNamespace(
            sell_price=2480.0, sell_volume=46,
            buy_price=2475.0, buy_volume=1065,
            close=2475.0,
        )]
        api_property.return_value = api
        self.service._conn.cache = CacheManager()

        result = self.service.get_bidask('2330')

        self.assertEqual(result, {
            'asks': [{'price': 2480.0, 'volume': 46}],
            'bids': [{'price': 2475.0, 'volume': 1065}],
        })

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch('core.shioaji._CREDENTIALS_PATH')
    @patch.dict('os.environ', {'SHIOAJI_TRADE_PIN': ''})
    def test_missing_pin_configuration_blocks_before_login(self, credentials, api):
        credentials.is_file.return_value = False
        with self.assertRaisesRegex(ValueError, '交易密碼未設定或錯誤'):
            self.service.prepare_order('guess', ExecutionVenue.BROKER_SIMULATION)
        api.assert_not_called()

    @patch('trading_core.fill_handler.FillHandler.register')
    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch.dict('os.environ', {'SHIOAJI_TRADE_PIN': 'configured-pin'})
    def test_expected_broker_venue_must_match_connection(self, api, register):
        with self.assertRaisesRegex(ValueError, '環境不符'):
            self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_PRODUCTION)
        register.assert_not_called()

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch.dict('os.environ', {
        'SHIOAJI_TRADE_PIN': 'configured-pin', 'SHIOAJI_ENABLE_LIVE_TRADING': '',
    })
    def test_production_order_requires_explicit_enable(self, api):
        self.service._conn.simulation_mode = False
        api.return_value.stock_account.signed = True
        with self.assertRaisesRegex(ServiceUnavailable, '正式下單未啟用'):
            self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_PRODUCTION)

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch.dict('os.environ', {
        'SHIOAJI_TRADE_PIN': 'configured-pin', 'SHIOAJI_ENABLE_LIVE_TRADING': 'true',
    })
    def test_production_order_requires_signed_stock_account(self, api):
        self.service._conn.simulation_mode = False
        api.return_value.stock_account.signed = False
        with self.assertRaisesRegex(ServiceUnavailable, '未確認完成 API 簽署'):
            self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_PRODUCTION)

    @patch('trading_core.fill_handler.FillHandler.register')
    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch.dict('os.environ', {'SHIOAJI_TRADE_PIN': 'configured-pin'})
    def test_new_broker_order_refreshes_trade_status_before_submission(self, api_property, register):
        api = MagicMock()
        api.trade_cache_health.return_value = SimpleNamespace(state='Healthy', reasons=[])
        api_property.return_value = api

        result = self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_SIMULATION)

        self.assertEqual(result, (api, ExecutionVenue.BROKER_SIMULATION))
        register.assert_called_once_with(api, ExecutionVenue.BROKER_SIMULATION)
        api.update_status.assert_called_once_with(api.stock_account)
        api.trade_cache_health.assert_called_once_with(api.stock_account)

    @patch('trading_core.fill_handler.FillHandler.register')
    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch.dict('os.environ', {'SHIOAJI_TRADE_PIN': 'configured-pin'})
    def test_degraded_trade_cache_blocks_new_order_but_not_cancel(self, api_property, _register):
        api = MagicMock()
        api.trade_cache_health.return_value = SimpleNamespace(state='Degraded', reasons=[])
        api_property.return_value = api

        with self.assertRaisesRegex(ServiceUnavailable, '回報狀態異常'):
            self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_SIMULATION)
        api.update_status.assert_called_once_with(api.stock_account)

        api.reset_mock()
        self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_SIMULATION,
                                   new_order=False)
        api.update_status.assert_not_called()

    @patch('trading_core.fill_handler.FillHandler.register')
    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    @patch.dict('os.environ', {'SHIOAJI_TRADE_PIN': 'configured-pin'})
    def test_unsubscribed_trade_reports_block_new_order(self, api_property, _register):
        api = MagicMock()
        api.trade_cache_health.return_value = SimpleNamespace(
            state='Unknown', reasons=[SimpleNamespace(reason='NotSubscribed')],
        )
        api_property.return_value = api

        with self.assertRaisesRegex(ServiceUnavailable, '回報狀態異常'):
            self.service.prepare_order('configured-pin', ExecutionVenue.BROKER_SIMULATION)

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    def test_simulation_order_history_uses_broker_status(self, api_property):
        account = SimpleNamespace(account_id='account', broker_id='broker')
        trade = SimpleNamespace(
            contract=SimpleNamespace(code='2330'),
            order=SimpleNamespace(account=account, action='Buy', price=0, quantity=1,
                                  price_type='MKT'),
            status=SimpleNamespace(
                status='Submitted', deals=[],
                order_datetime=datetime.fromisoformat('2026-09-27T12:19:00+08:00'),
            ),
        )
        api = MagicMock(stock_account=account)
        api.list_trades.return_value = [trade]
        api.Contracts.Stocks['2330'].name = '台積電'
        api_property.return_value = api
        self.service._conn = SimpleNamespace(simulation_mode=True, cache=CacheManager())

        result = self.service.get_recent_trades()

        api.update_status.assert_called_once_with(account)
        self.assertEqual(result[0]['status'], '委託中')
        self.assertEqual(result[0]['filledShares'], 0)
        self.assertEqual(result[0]['orderId'], '')
        self.assertEqual(result[0]['time'], '12:19:00')
        self.assertEqual(result[0]['orderType'], '市價')

    @patch('account.service.AccountService.prepare_order')
    def test_cancel_targets_exact_order_on_same_stock_account(self, prepare):
        account = SimpleNamespace(account_id='account', broker_id='broker')
        trade = SimpleNamespace(
            order=SimpleNamespace(id='broker-order-1', account=account),
            status=SimpleNamespace(status='Submitted'),
        )
        api = MagicMock(stock_account=account)
        api.list_trades.return_value = [trade]
        prepare.return_value = (api, ExecutionVenue.BROKER_SIMULATION)
        self.service._conn = SimpleNamespace(simulation_mode=True, cache=CacheManager())

        result = self.service.cancel_order({
            'order_id': 'broker-order-1', 'trade_pin': 'test',
            'expected_venue': ExecutionVenue.BROKER_SIMULATION,
        })

        prepare.assert_called_once_with('test', ExecutionVenue.BROKER_SIMULATION,
                                        new_order=False)
        api.update_status.assert_called_once_with(account)
        api.cancel_order.assert_called_once_with(trade)
        self.assertEqual(result['venue'], ExecutionVenue.BROKER_SIMULATION)

    @patch('account.service.AccountService.prepare_order')
    def test_cancel_rejects_order_from_another_account(self, prepare):
        account = SimpleNamespace(account_id='account', broker_id='broker')
        other = SimpleNamespace(account_id='other', broker_id='broker')
        trade = SimpleNamespace(
            order=SimpleNamespace(id='broker-order-1', account=other),
            status=SimpleNamespace(status='Submitted'),
        )
        api = MagicMock(stock_account=account)
        api.list_trades.return_value = [trade]
        prepare.return_value = (api, ExecutionVenue.BROKER_SIMULATION)
        with self.assertRaisesRegex(ValueError, '找不到'):
            self.service.cancel_order({
                'order_id': 'broker-order-1', 'trade_pin': 'test',
                'expected_venue': ExecutionVenue.BROKER_SIMULATION,
            })
        api.cancel_order.assert_not_called()

    @patch('account.views._account.cancel_order')
    def test_cancel_endpoint_returns_submission_not_final_cancel(self, cancel):
        cancel.return_value = {'order_id': 'broker-order-1', 'message': '取消請求已送出'}
        response = APIClient().post('/api/account/order/cancel/', {
            'order_id': 'broker-order-1', 'trade_pin': 'test',
            'expected_venue': ExecutionVenue.BROKER_SIMULATION,
        }, format='json')
        self.assertEqual(response.status_code, 202)


class DirectBrokerOrderTests(TestCase):
    def setUp(self):
        self.service = AccountService()
        self.service._conn = SimpleNamespace(cache=CacheManager())
        self.account_api = MagicMock()
        self.account_api.Contracts.Stocks['2330'].limit_up = 2750
        self.account_api.Contracts.Stocks['2330'].limit_down = 2250
        self.account_api.snapshots.return_value = [SimpleNamespace(close=2500)]
        self.account_api.place_order.return_value = SimpleNamespace(
            status=SimpleNamespace(id='direct-broker-1'),
        )
        AccountService._last_order_time = 0
        AccountService._daily_order_count = 0
        AccountService._recent_order_hashes = []

    def payload(self, side='buy'):
        return {
            'code': '2330', 'side': side, 'shares': 1000, 'type': 'limit',
            'price': 2500, 'trade_pin': 'test',
            'expected_venue': ExecutionVenue.BROKER_SIMULATION,
        }

    @patch('account.service.AccountService.prepare_order')
    def test_direct_buy_is_tracked_before_submission_and_fill(self, prepare):
        prepare.return_value = (self.account_api, ExecutionVenue.BROKER_SIMULATION)

        def fill_before_return(_contract, sdk_order):
            ref = self.account_api.Order.call_args.kwargs['custom_field']
            self.assertEqual(Order.objects.get(client_ref=ref).status, OrderStatus.PENDING)
            FillHandler.on_fill(
                'direct-broker-1', 2500, 1000, datetime.now(timezone.utc),
                event_key='direct-broker-1:deal-1:broker_simulation',
                client_ref=ref, symbol='2330', side='buy',
                venue=ExecutionVenue.BROKER_SIMULATION,
            )
            return SimpleNamespace(status=SimpleNamespace(id='direct-broker-1'))

        self.account_api.place_order.side_effect = fill_before_return
        result = self.service.place_order(self.payload())

        order = Order.objects.get()
        self.assertEqual(result['order_id'], 'direct-broker-1')
        self.assertEqual((order.status, order.filled_qty), (OrderStatus.FILLED, 1000))
        self.assertEqual(Position.objects.get(entry_order=order).qty, 1000)
        self.assertEqual(Trade.objects.get(order=order).qty, 1000)

    @patch('account.service.AccountService.prepare_order')
    def test_direct_sell_requires_tracked_position(self, prepare):
        prepare.return_value = (self.account_api, ExecutionVenue.BROKER_SIMULATION)
        with self.assertRaisesRegex(ValueError, '本機持倉'):
            self.service.place_order(self.payload(side='sell'))
        self.account_api.place_order.assert_not_called()
        self.assertFalse(Order.objects.exists())

    @patch('account.service.AccountService.prepare_order')
    def test_direct_sell_debits_matching_position_after_confirmed_fill(self, prepare):
        prepare.return_value = (self.account_api, ExecutionVenue.BROKER_SIMULATION)
        position = Position.objects.create(
            symbol='2330', qty=1000, avg_cost=2400,
            venue=ExecutionVenue.BROKER_SIMULATION,
        )

        def fill_before_return(_contract, _sdk_order):
            ref = self.account_api.Order.call_args.kwargs['custom_field']
            local_order = Order.objects.get(client_ref=ref)
            self.assertEqual(local_order.position_id, position.pk)
            FillHandler.on_fill(
                'direct-broker-1', 2500, 1000, datetime.now(timezone.utc),
                event_key='direct-broker-1:deal-2:broker_simulation',
                client_ref=ref, symbol='2330', side='sell',
                venue=ExecutionVenue.BROKER_SIMULATION,
            )
            return SimpleNamespace(status=SimpleNamespace(id='direct-broker-1'))

        self.account_api.place_order.side_effect = fill_before_return
        self.service.place_order(self.payload(side='sell'))

        position.refresh_from_db()
        self.assertEqual(position.qty, 0)
        self.assertEqual(Trade.objects.get(side='sell').pnl, 100_000)

    @patch('account.service.AccountService.prepare_order')
    def test_uncertain_direct_submission_stays_pending(self, prepare):
        prepare.return_value = (self.account_api, ExecutionVenue.BROKER_SIMULATION)
        self.account_api.place_order.side_effect = TimeoutError('unknown outcome')

        with self.assertRaisesRegex(ServiceUnavailable, '結果未確認'):
            self.service.place_order(self.payload())

        order = Order.objects.get()
        self.assertEqual(order.status, OrderStatus.PENDING)
        self.assertTrue(order.client_ref)
        self.assertFalse(Position.objects.exists())

    @patch('account.views._account.place_order')
    def test_http_cannot_supply_internal_client_ref(self, place):
        response = APIClient().post('/api/account/order/', {
            **self.payload(), 'client_ref': 'P99999',
        }, format='json')
        self.assertEqual(response.status_code, 400)
        place.assert_not_called()


class SimulationPortfolioTests(TestCase):
    def setUp(self):
        self.service = AccountService()
        self.service._conn = SimpleNamespace(simulation_mode=True, cache=CacheManager())

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    def test_only_confirmed_simulation_positions_appear(self, api_property):
        Position.objects.create(symbol='2330', qty=1000, avg_cost=2400,
                                venue=ExecutionVenue.BROKER_SIMULATION)
        Position.objects.create(symbol='2330', qty=1000, avg_cost=2500,
                                venue=ExecutionVenue.BROKER_SIMULATION)
        Position.objects.create(symbol='2454', qty=1000, avg_cost=1000,
                                venue=ExecutionVenue.PAPER)
        api = MagicMock()
        api.Contracts.Stocks['2330'].name = '台積電'
        api.snapshots.return_value = [SimpleNamespace(close=2600)]
        api_property.return_value = api

        holdings = self.service.get_holdings()
        summary = self.service.get_portfolio_summary()

        self.assertEqual(len(holdings), 1)
        self.assertEqual((holdings[0]['shares'], holdings[0]['avgCost']), (2000, 2450))
        self.assertEqual(holdings[0]['pnl'], 300_000)
        self.assertEqual(summary['totalCost'], 4_900_000)
        self.assertEqual(summary['totalValue'], 5_200_000)
        self.assertIsNone(summary['totalAssets'])
        self.assertIsNone(summary['accBalance'])

    @patch('account.service.AccountService._api', new_callable=PropertyMock)
    def test_missing_quote_does_not_invent_valuation(self, api_property):
        Position.objects.create(symbol='2330', qty=1000, avg_cost=2400,
                                venue=ExecutionVenue.BROKER_SIMULATION)
        api_property.return_value.snapshots.return_value = []

        holdings = self.service.get_holdings()
        summary = self.service.get_portfolio_summary()

        self.assertIsNone(holdings[0]['current'])
        self.assertIsNone(holdings[0]['pnl'])
        self.assertIsNone(summary['totalValue'])
        self.assertIsNone(summary['unrealizedPnl'])
        self.assertFalse(summary['valuationComplete'])
