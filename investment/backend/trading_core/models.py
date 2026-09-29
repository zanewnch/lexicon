"""
Trading pipeline shared models.

Five data contracts used by Scanner / Trader / Watchdog / Exiter / Bookkeeper apps:
  Candidate   — Scanner output, Trader input
  Order       — Trader / Exiter request to broker
  Position    — Open holdings; Watchdog reads, Exiter closes
  ExitSignal  — Watchdog output, Exiter input
  Trade       — Filled execution record; Bookkeeper input
"""
from django.db import models

from trading_core.enums import (
    ExecutionVenue,
    ExitReason,
    OrderStatus,
    OrderType,
    PositionStatus,
    Side,
)


class Candidate(models.Model):
    """Scanner output. A symbol that passes the screening criteria."""

    symbol = models.CharField(max_length=16, db_index=True)
    score = models.FloatField(null=True, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    consumed = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Candidate({self.symbol}, score={self.score})'


class Order(models.Model):
    """Order request submitted by Trader (entry) or Exiter (exit)."""

    symbol = models.CharField(max_length=16, db_index=True)
    side = models.CharField(max_length=8, choices=Side.choices)
    qty = models.IntegerField(help_text='Shares (multiples of 1000 for TWSE common lot)')
    order_type = models.CharField(max_length=8, choices=OrderType.choices, default=OrderType.MARKET)
    price = models.FloatField(null=True, blank=True, help_text='Limit price; null for market order')
    status = models.CharField(
        max_length=16, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True
    )
    external_id = models.CharField(max_length=64, blank=True, default='', help_text='Broker order id')
    client_ref = models.CharField(max_length=6, null=True, blank=True, unique=True)
    venue = models.CharField(max_length=24, choices=ExecutionVenue.choices, default=ExecutionVenue.PAPER, db_index=True)
    filled_qty = models.IntegerField(default=0)
    filled_value = models.FloatField(default=0)
    candidate = models.ForeignKey('Candidate', on_delete=models.SET_NULL, null=True, blank=True)
    position = models.ForeignKey('Position', on_delete=models.SET_NULL, null=True, blank=True)
    exit_signal = models.ForeignKey('ExitSignal', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    filled_at = models.DateTimeField(null=True, blank=True)
    note = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Order({self.side} {self.symbol} x{self.qty} [{self.status}])'


class Position(models.Model):
    """Open or closed position. Single source of truth for current holdings."""

    symbol = models.CharField(max_length=16, db_index=True)
    qty = models.IntegerField()
    avg_cost = models.FloatField()
    venue = models.CharField(max_length=24, choices=ExecutionVenue.choices, default=ExecutionVenue.PAPER, db_index=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=8, choices=PositionStatus.choices, default=PositionStatus.OPEN, db_index=True
    )
    entry_order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='opened_positions'
    )

    class Meta:
        ordering = ['-opened_at']

    def __str__(self) -> str:
        return f'Position({self.symbol} x{self.qty} @ {self.avg_cost} [{self.status}])'


class ExitSignal(models.Model):
    """Watchdog → Exiter signal that a position should be closed."""

    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='exit_signals')
    reason = models.CharField(max_length=16, choices=ExitReason.choices)
    triggered_price = models.FloatField()
    triggered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed = models.BooleanField(default=False, db_index=True)
    note = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-triggered_at']

    def __str__(self) -> str:
        return f'ExitSignal({self.position.symbol} reason={self.reason})'


class Trade(models.Model):
    """Filled execution record. Bookkeeper analyses these to produce reports."""

    symbol = models.CharField(max_length=16, db_index=True)
    side = models.CharField(max_length=8, choices=Side.choices)
    qty = models.IntegerField()
    price = models.FloatField()
    executed_at = models.DateTimeField(db_index=True)
    pnl = models.FloatField(null=True, blank=True, help_text='Realised P&L; only set on closing trades')
    order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='trades'
    )

    class Meta:
        ordering = ['-executed_at']

    def __str__(self) -> str:
        return f'Trade({self.side} {self.symbol} x{self.qty} @ {self.price})'


class BrokerFill(models.Model):
    """One broker deal event; the unique event key makes callbacks idempotent."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='fills')
    event_key = models.CharField(max_length=128, unique=True)
    qty = models.PositiveIntegerField()
    price = models.FloatField()
    executed_at = models.DateTimeField()
