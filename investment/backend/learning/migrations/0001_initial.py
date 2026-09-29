from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='LearningProgress',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node_id', models.CharField(max_length=64, unique=True)),
                ('status', models.CharField(default='not_started', max_length=20)),
                ('artifact_summary', models.TextField(blank=True, default='')),
                ('reflection', models.TextField(blank=True, default='')),
                ('note_id', models.CharField(blank=True, default='', max_length=64)),
                ('strategy_id', models.CharField(blank=True, default='', max_length=64)),
                ('external_url', models.URLField(blank=True, default='', max_length=500)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['node_id']},
        ),
    ]
