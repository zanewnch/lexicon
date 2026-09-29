"""
RiskConfig — singleton-style model holding portfolio-level risk limits.

Always accessed via ``RiskConfig.load()`` which returns (creates if needed)
the single row with ``pk=1``.
"""
from django.db import models


class RiskConfig(models.Model):
    max_positions = models.IntegerField(
        default=5, help_text='Maximum concurrent open positions',
    )
    max_position_pct = models.FloatField(
        default=25.0, help_text='Maximum single position as % of capital',
    )
    max_daily_loss = models.FloatField(
        default=-50000.0, help_text='Block new entries when today realised PnL <= this',
    )
    blacklist = models.JSONField(
        default=list, blank=True, help_text='List of symbols that may never be traded',
    )
    enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def load(cls) -> 'RiskConfig':
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self) -> str:
        return f'RiskConfig(max_positions={self.max_positions}, enabled={self.enabled})'
