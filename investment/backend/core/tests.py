"""Tests for the Shioaji diagnostic entry point."""

import importlib.util
from pathlib import Path
from unittest import TestCase
from unittest.mock import MagicMock, Mock, patch

from django.test import TestCase as DjangoTestCase

from core.shioaji import ShioajiConnection


_DIAGNOSTIC_PATH = Path(__file__).resolve().parents[1] / "run_market_data.py"
_SPEC = importlib.util.spec_from_file_location("run_market_data", _DIAGNOSTIC_PATH)
_DIAGNOSTIC = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_DIAGNOSTIC)


class MarketDataDiagnosticTests(TestCase):
    def test_main_uses_current_connection_and_market_data_services(self):
        api = MagicMock()
        contract = Mock(code="2330", name="測試合約")
        api.Contracts.Stocks.__getitem__.return_value = contract
        manager = Mock()

        with (
            patch("builtins.print"),
            patch.object(_DIAGNOSTIC.ShioajiConnection, "get_instance") as get_instance,
            patch.object(_DIAGNOSTIC, "MarketDataManager", return_value=manager),
            patch.object(_DIAGNOSTIC.time, "sleep"),
        ):
            get_instance.return_value.get_api.return_value = api
            _DIAGNOSTIC.main()

        api.Contracts.Stocks.__getitem__.assert_called_once_with("2330")
        manager.subscribe_tick.assert_called_once_with(contract)
        manager.subscribe_bidask.assert_called_once_with(contract)
        manager.unsubscribe_all.assert_called_once_with()


class ConnectionSwitchTests(DjangoTestCase):
    @patch.dict('os.environ', {'SHIOAJI_SIMULATION': 'true'})
    @patch('market.consumers.SubscriptionManager.get_instance')
    @patch.object(ShioajiConnection, 'get_api')
    def test_switch_rebinds_quote_subscriptions(self, get_api, get_subscriptions):
        connection = ShioajiConnection()
        connection.api = MagicMock()
        connection.contracts_ready = True
        new_api = MagicMock()
        get_api.return_value = new_api

        result = connection.switch_mode(False)

        self.assertEqual(result, {'simulation': False, 'connected': True})
        get_subscriptions.return_value.refresh_api.assert_called_once_with(new_api)
