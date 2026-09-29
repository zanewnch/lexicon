"""Shared enums for trading pipeline (Scanner → Trader → Watchdog → Exiter → Bookkeeper)."""
from django.db import models


class Side(models.TextChoices):
    BUY = 'buy', 'Buy'
    SELL = 'sell', 'Sell'


class OrderType(models.TextChoices):
    MARKET = 'market', 'Market'
    LIMIT = 'limit', 'Limit'


class OrderStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SUBMITTED = 'submitted', 'Submitted'
    PARTIALLY_FILLED = 'partially_filled', 'Partially filled'
    FILLED = 'filled', 'Filled'
    CANCELLED = 'cancelled', 'Cancelled'
    FAILED = 'failed', 'Failed'


class PositionStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    CLOSED = 'closed', 'Closed'


class ExecutionVenue(models.TextChoices):
    PAPER = 'paper', 'Paper'
    BROKER_SIMULATION = 'broker_simulation', 'Broker simulation'
    BROKER_PRODUCTION = 'broker_production', 'Broker production'


class ExitReason(models.TextChoices):
    STOP_LOSS = 'stop_loss', 'Stop Loss'
    TAKE_PROFIT = 'take_profit', 'Take Profit'
    MANUAL = 'manual', 'Manual'
