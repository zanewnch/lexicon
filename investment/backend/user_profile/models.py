from django.db import models


class UserProfile(models.Model):
    display_name = models.CharField(max_length=100, default='', blank=True)
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)

    class Meta:
        db_table = 'user_profile'
