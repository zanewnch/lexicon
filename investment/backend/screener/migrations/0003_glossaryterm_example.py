# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('screener', '0002_glossaryterm'),
    ]

    operations = [
        migrations.AddField(
            model_name='glossaryterm',
            name='example',
            field=models.TextField(blank=True, default=''),
        ),
    ]
