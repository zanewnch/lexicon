from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('screener', '0003_glossaryterm_example'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocktrendtag',
            name='avg_volume_5d',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
