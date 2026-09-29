"""Market subscriptions follow the active broker connection."""

from unittest.mock import MagicMock

from django.test import SimpleTestCase

from market.consumers import SubscriptionManager


class SubscriptionManagerTests(SimpleTestCase):
    def test_refresh_api_moves_existing_websocket_subscription(self):
        subscriptions = SubscriptionManager()
        old_manager = MagicMock()
        old_manager.api = object()
        subscriptions._manager = old_manager
        subscriptions._subscriptions = {'2330': {'websocket-channel'}}
        new_api = MagicMock()

        subscriptions.refresh_api(new_api)

        self.assertIs(subscriptions._manager.api, new_api)
        self.assertEqual(subscriptions._subscriptions['2330'], {'websocket-channel'})
        old_manager.remove_tick_listener.assert_called_once()
        old_manager.remove_bidask_listener.assert_called_once()
        self.assertEqual(new_api.quote.subscribe.call_count, 2)
