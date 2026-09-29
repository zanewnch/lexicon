"""
Screener persisted data.

StockTrendTag — output of the nightly `rebuild_tags` batch. The on-the-fly
TagService merges these rows onto its snapshot so users can filter on
trend-style tags (多頭排列 / 剛翻多 / 爆量突破) that are too expensive to
compute per request.
"""
from django.db import models


class GlossaryTerm(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    term = models.CharField(max_length=64, db_index=True)
    description = models.TextField()
    category = models.CharField(max_length=32, db_index=True)
    example = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['category', 'key']

    def __str__(self) -> str:
        return f'GlossaryTerm({self.key}: {self.term})'


class StockTrendTag(models.Model):
    symbol = models.CharField(max_length=16, primary_key=True)
    trend = models.CharField(max_length=16, blank=True, default='')
    ma5 = models.FloatField(null=True, blank=True)
    ma20 = models.FloatField(null=True, blank=True)
    ma60 = models.FloatField(null=True, blank=True)
    rsi14 = models.FloatField(null=True, blank=True)
    avg_volume_5d = models.FloatField(null=True, blank=True)
    flags = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['symbol']

    def __str__(self) -> str:
        return f'StockTrendTag({self.symbol}, {self.trend})'
