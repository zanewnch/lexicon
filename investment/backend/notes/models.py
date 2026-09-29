from django.db import models
from django.utils import timezone


class Note(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    title = models.TextField()
    content = models.TextField(blank=True, default='')
    category = models.CharField(max_length=64, default='其他')
    tags = models.JSONField(default=list)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['created_at', 'id']
