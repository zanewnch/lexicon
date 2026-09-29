from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='StockTrendTag',
            fields=[
                ('symbol', models.CharField(max_length=16, primary_key=True, serialize=False)),
                ('trend', models.CharField(blank=True, default='', max_length=16)),
                ('ma5', models.FloatField(blank=True, null=True)),
                ('ma20', models.FloatField(blank=True, null=True)),
                ('ma60', models.FloatField(blank=True, null=True)),
                ('rsi14', models.FloatField(blank=True, null=True)),
                ('flags', models.JSONField(blank=True, default=list)),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True)),
            ],
            options={'ordering': ['symbol']},
        ),
    ]
