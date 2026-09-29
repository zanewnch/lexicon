"""
Data classes for real-time market events (tick and bidask).
Used by ``MarketDataManager`` and ``SubscriptionManager``.
"""
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class TickData:
    """逐筆成交資料。"""
    code: str
    close: float
    volume: int
    total_volume: int
    tick_type: int  # 0=外盤(買), 1=內盤(賣)
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def tick_type_label(self) -> str:
        return "買" if self.tick_type == 0 else "賣"


@dataclass
class BidAskData:
    """五檔報價資料。"""
    code: str
    bid_prices: list[float] = field(default_factory=lambda: [0.0] * 5)
    bid_volumes: list[int] = field(default_factory=lambda: [0] * 5)
    ask_prices: list[float] = field(default_factory=lambda: [0.0] * 5)
    ask_volumes: list[int] = field(default_factory=lambda: [0] * 5)
    timestamp: datetime = field(default_factory=datetime.now)
