"""
Market data stream manager — subscribes to Shioaji tick + bidask feeds
and forwards events to registered listeners via the Observer pattern.

Used by ``SubscriptionManager`` in ``consumers.py`` to push real-time
data through Django Channels to connected WebSocket clients.
"""
from datetime import datetime
from typing import Callable

import shioaji as sj
from shioaji.constant import QuoteVersion

from market.schemas import BidAskData, TickData

# Listener type: (code: str, data: TickData | BidAskData) -> None
TickListener = Callable[[str, TickData], None]
BidAskListener = Callable[[str, BidAskData], None]


class MarketDataManager:
    """即時行情訂閱管理，處理 tick 與五檔報價回呼。"""

    def __init__(self, api: sj.Shioaji):
        self.api = api
        self.latest_ticks: dict[str, TickData] = {}
        self.latest_bidasks: dict[str, BidAskData] = {}
        self._subscribed_contracts: list = []
        self._tick_listeners: list[TickListener] = []
        self._bidask_listeners: list[BidAskListener] = []

        # 註冊回呼
        self.api.quote.set_on_tick_fop_v1_callback(self._on_tick_callback)
        self.api.quote.set_on_bidask_fop_v1_callback(self._on_bidask_callback)
        self.api.quote.set_on_tick_stk_v1_callback(self._on_tick_callback)
        self.api.quote.set_on_bidask_stk_v1_callback(self._on_bidask_callback)

    def add_tick_listener(self, listener: TickListener):
        """註冊 tick 事件監聽器。"""
        if listener not in self._tick_listeners:
            self._tick_listeners.append(listener)

    def remove_tick_listener(self, listener: TickListener):
        """移除 tick 事件監聽器。"""
        self._tick_listeners.remove(listener)

    def add_bidask_listener(self, listener: BidAskListener):
        """註冊 bidask 事件監聽器。"""
        if listener not in self._bidask_listeners:
            self._bidask_listeners.append(listener)

    def remove_bidask_listener(self, listener: BidAskListener):
        """移除 bidask 事件監聯器。"""
        self._bidask_listeners.remove(listener)

    def subscribe_tick(self, contract):
        """訂閱逐筆成交。"""
        self.api.quote.subscribe(
            contract,
            quote_type=sj.constant.QuoteType.Tick,
            version=QuoteVersion.v1,
        )
        if contract not in self._subscribed_contracts:
            self._subscribed_contracts.append(contract)

    def subscribe_bidask(self, contract):
        """訂閱五檔報價。"""
        self.api.quote.subscribe(
            contract,
            quote_type=sj.constant.QuoteType.BidAsk,
            version=QuoteVersion.v1,
        )
        if contract not in self._subscribed_contracts:
            self._subscribed_contracts.append(contract)

    def _on_tick_callback(self, exchange, tick):
        """逐筆成交回呼。"""
        data = TickData(
            code=tick.code,
            close=tick.close,
            volume=tick.volume,
            total_volume=tick.total_volume,
            tick_type=tick.tick_type,
            timestamp=datetime.fromtimestamp(tick.datetime / 1e9)
            if isinstance(tick.datetime, (int, float))
            else tick.datetime,
        )
        self.latest_ticks[data.code] = data

        for listener in self._tick_listeners:
            try:
                listener(data.code, data)
            except Exception:
                pass

    def _on_bidask_callback(self, exchange, bidask):
        """五檔報價回呼。"""
        data = BidAskData(
            code=bidask.code,
            bid_prices=list(bidask.bid_price),
            bid_volumes=list(bidask.bid_volume),
            ask_prices=list(bidask.ask_price),
            ask_volumes=list(bidask.ask_volume),
            timestamp=datetime.fromtimestamp(bidask.datetime / 1e9)
            if isinstance(bidask.datetime, (int, float))
            else bidask.datetime,
        )
        self.latest_bidasks[data.code] = data

        for listener in self._bidask_listeners:
            try:
                listener(data.code, data)
            except Exception:
                pass

    def unsubscribe(self, contract):
        """取消訂閱 tick 與五檔。"""
        self.api.quote.unsubscribe(
            contract,
            quote_type=sj.constant.QuoteType.Tick,
            version=QuoteVersion.v1,
        )
        self.api.quote.unsubscribe(
            contract,
            quote_type=sj.constant.QuoteType.BidAsk,
            version=QuoteVersion.v1,
        )
        if contract in self._subscribed_contracts:
            self._subscribed_contracts.remove(contract)

    def unsubscribe_all(self):
        """取消所有訂閱。"""
        for contract in list(self._subscribed_contracts):
            self.unsubscribe(contract)
