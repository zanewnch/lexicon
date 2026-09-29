from django.db import models


class LearningProgress(models.Model):
    node_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, default='not_started')
    artifact_summary = models.TextField(blank=True, default='')
    reflection = models.TextField(blank=True, default='')
    note_id = models.CharField(max_length=64, blank=True, default='')
    strategy_id = models.CharField(max_length=64, blank=True, default='')
    external_url = models.URLField(max_length=500, blank=True, default='')
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['node_id']
