"""
WebSocket consumer for real-time market data (tick + bidask).

Frontend connects to: ws://localhost:8000/ws/market/<stock_code>/
"""

import asyncio
import json
import logging
from threading import Lock, RLock

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class SubscriptionManager:
    """管理 Shioaji 訂閱與 channel layer 廣播的 singleton。"""

    _instance: "SubscriptionManager | None" = None
    _instance_lock = Lock()

    def __init__(self):
        self._subscriptions: dict[str, set] = {}  # code -> set of channel_names
        self._manager = None
        self._lock = RLock()

    @classmethod
    def get_instance(cls) -> "SubscriptionManager":
        if cls._instance is not None:
            return cls._instance
        with cls._instance_lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def _get_manager(self):
        """Lazy-init the MarketDataManager."""
        if self._manager is not None:
            return self._manager

        with self._lock:
            if self._manager is not None:
                return self._manager

            from core.shioaji import ShioajiConnection
            from market.stream import MarketDataManager

            api = ShioajiConnection.get_instance().get_api()
            self._manager = MarketDataManager(api)

            self._manager.add_tick_listener(self._on_tick)
            self._manager.add_bidask_listener(self._on_bidask)

            return self._manager

    def refresh_api(self, api):
        """Rebind active subscriptions after a broker connection switch."""
        with self._lock:
            old_manager = self._manager
            if old_manager is None or old_manager.api is api:
                return

            from market.stream import MarketDataManager

            manager = MarketDataManager(api)
            manager.add_tick_listener(self._on_tick)
            manager.add_bidask_listener(self._on_bidask)
            old_manager.remove_tick_listener(self._on_tick)
            old_manager.remove_bidask_listener(self._on_bidask)
            self._manager = manager

            for code, channels in self._subscriptions.items():
                if not channels:
                    continue
                try:
                    contract = api.Contracts.Stocks[code]
                    manager.subscribe_tick(contract)
                    manager.subscribe_bidask(contract)
                    logger.info("Resubscribed market data for %s", code)
                except Exception:
                    logger.exception("Failed to resubscribe market data for %s", code)

    def _on_tick(self, code: str, tick_data):
        """Broadcast tick data to all WebSocket subscribers."""
        ts = tick_data.timestamp
        self._broadcast(code, {
            "type": "tick",
            "code": code,
            "time": ts.strftime("%H:%M:%S") if hasattr(ts, 'strftime') else str(ts)[-8:],
            "price": float(tick_data.close),
            "volume": int(tick_data.volume),
            "totalVolume": int(tick_data.total_volume),
            "tickType": int(tick_data.tick_type),
        })

    def _on_bidask(self, code: str, bidask_data):
        """Broadcast bidask data to all WebSocket subscribers."""
        ts = bidask_data.timestamp
        self._broadcast(code, {
            "type": "bidask",
            "code": code,
            "askPrices": [float(p) for p in bidask_data.ask_prices],
            "askVolumes": [int(v) for v in bidask_data.ask_volumes],
            "bidPrices": [float(p) for p in bidask_data.bid_prices],
            "bidVolumes": [int(v) for v in bidask_data.bid_volumes],
            "time": ts.strftime("%H:%M:%S") if hasattr(ts, 'strftime') else str(ts)[-8:],
        })

    @staticmethod
    def _broadcast(code: str, data: dict):
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        try:
            async_to_sync(channel_layer.group_send)(
                f"market_{code}",
                {"type": "market.data", "data": data},
            )
        except Exception:
            logger.exception("Failed to broadcast to group market_%s", code)

    def subscribe(self, code: str, channel_name: str):
        """Subscribe a channel to a stock's tick+bidask feed."""
        with self._lock:
            manager = self._get_manager()
            self._subscriptions.setdefault(code, set())

            if not self._subscriptions[code]:
                try:
                    contract = manager.api.Contracts.Stocks[code]
                    manager.subscribe_tick(contract)
                    manager.subscribe_bidask(contract)
                    logger.info("Subscribed to Shioaji tick+bidask for %s", code)
                except (KeyError, AttributeError):
                    logger.warning("Stock contract not found: %s", code)
                except Exception:
                    logger.exception("Failed to subscribe to %s", code)

            self._subscriptions[code].add(channel_name)

    def unsubscribe(self, code: str, channel_name: str):
        """Remove a channel; unsubscribe from Shioaji if no listeners remain."""
        with self._lock:
            if code not in self._subscriptions:
                return

            self._subscriptions[code].discard(channel_name)
            if not self._subscriptions[code]:
                try:
                    manager = self._get_manager()
                    contract = manager.api.Contracts.Stocks[code]
                    manager.unsubscribe(contract)
                    logger.info("Unsubscribed from Shioaji for %s", code)
                except Exception:
                    logger.exception("Failed to unsubscribe from %s", code)
                del self._subscriptions[code]


class MarketDataConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint: /ws/market/<code>/

    On connect: subscribes to Shioaji tick+bidask for the stock.
    Pushes JSON messages with type "tick" or "bidask" as they arrive.
    On disconnect: cleans up subscription.
    """

    async def connect(self):
        self.stock_code = self.scope["url_route"]["kwargs"]["code"]
        self.group_name = f"market_{self.stock_code}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._sync_subscribe)

        logger.info("WebSocket connected: %s for %s", self.channel_name, self.stock_code)

    def _sync_subscribe(self):
        SubscriptionManager.get_instance().subscribe(self.stock_code, self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            SubscriptionManager.get_instance().unsubscribe,
            self.stock_code,
            self.channel_name,
        )

        logger.info("WebSocket disconnected: %s for %s", self.channel_name, self.stock_code)

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            try:
                msg = json.loads(text_data)
                if msg.get("action") == "ping":
                    await self.send(text_data=json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass

    async def market_data(self, event):
        await self.send(text_data=json.dumps(event["data"]))
