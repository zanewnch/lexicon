"""Focused tests for Shioaji credential validation and connection setup."""

import os
from pathlib import Path
from unittest import TestCase
from unittest.mock import Mock, patch

from core.cache import ServiceUnavailable
from core.shioaji import ShioajiConnection


class ShioajiConnectionTests(TestCase):
    def setUp(self):
        self.connection = ShioajiConnection()
        production_gate = patch.dict(
            "os.environ", {"SHIOAJI_ENABLE_PRODUCTION_CONNECTION": "true"}
        )
        production_gate.start()
        self.addCleanup(production_gate.stop)

    def credentials(self, **overrides):
        values = {
            "api_key": "test-key",
            "api_secret": "test-secret",
            "ca_path": str(Path("test-Sinopac.pfx")),
            "ca_passwd": "test-password",
            "person_id": "A123456789",
            "simulation": True,
        }
        values.update(overrides)
        return values

    @patch("core.shioaji.sj.Shioaji")
    def test_missing_api_token_fails_before_login(self, shioaji):
        self.connection._load_credentials = lambda: self.credentials(api_key="")

        with self.assertRaisesRegex(ServiceUnavailable, "API Key/Secret"):
            self.connection.get_api()

        shioaji.assert_not_called()

    @patch("core.shioaji.time.sleep")
    @patch("trading_core.fill_handler.FillHandler.register")
    @patch("core.shioaji.sj.Shioaji")
    def test_simulation_login_does_not_require_or_activate_ca(self, shioaji, register, _sleep):
        api = Mock()
        shioaji.return_value = api
        self.connection._load_credentials = lambda: self.credentials(
            ca_path="missing-Sinopac.pfx", ca_passwd="", person_id=""
        )

        self.assertIs(self.connection.get_api(), api)

        api.login.assert_called_once_with("test-key", "test-secret")
        api.activate_ca.assert_not_called()
        register.assert_called_once_with(api, 'broker_simulation')

    @patch("core.shioaji.sj.Shioaji")
    def test_formal_mode_requires_certificate_password_and_person_id(self, shioaji):
        self.connection._load_credentials = lambda: self.credentials(
            simulation=False,
            ca_path=str(Path("missing-Sinopac.pfx")),
            ca_passwd="",
            person_id="",
        )

        with self.assertRaisesRegex(ServiceUnavailable, "正式模式缺少必要設定") as error:
            self.connection.get_api()

        self.assertIn("Sinopac.pfx", str(error.exception))
        self.assertIn("person_id", str(error.exception))
        shioaji.assert_not_called()

    @patch("core.shioaji.time.sleep")
    @patch("trading_core.fill_handler.FillHandler.register")
    @patch("core.shioaji.sj.Shioaji")
    def test_formal_mode_activates_ca_with_person_id(self, shioaji, register, _sleep):
        api = Mock()
        api.activate_ca.return_value = True
        shioaji.return_value = api
        cert = Path(__file__).resolve()
        self.connection._load_credentials = lambda: self.credentials(
            simulation=False, ca_path=str(cert)
        )

        self.assertIs(self.connection.get_api(), api)

        api.activate_ca.assert_called_once_with(
            ca_path=str(cert), ca_passwd="test-password", person_id="A123456789"
        )
        register.assert_called_once_with(api, 'broker_production')

    @patch("core.shioaji.ShioajiConnection.get_api")
    @patch("trading_core.models.Order.objects.filter")
    def test_failed_mode_switch_restores_previous_simulation_mode(self, orders, get_api):
        orders.return_value.exists.return_value = False
        get_api.side_effect = [ServiceUnavailable("production unavailable"), Mock()]
        self.connection.simulation_mode = True

        with patch.dict("os.environ", {"SHIOAJI_SIMULATION": "true"}):
            with self.assertRaisesRegex(ServiceUnavailable, "模式切換後重新連線失敗"):
                self.connection.switch_mode(False)
            self.assertEqual(self.connection.simulation_mode, True)
            self.assertEqual(os.environ["SHIOAJI_SIMULATION"], "true")
        self.assertEqual(get_api.call_count, 2)

