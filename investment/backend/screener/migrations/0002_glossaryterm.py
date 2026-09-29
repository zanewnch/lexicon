from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('screener', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GlossaryTerm',
            fields=[
                ('key', models.CharField(max_length=64, primary_key=True, serialize=False)),
                ('term', models.CharField(db_index=True, max_length=64)),
                ('description', models.TextField()),
                ('category', models.CharField(db_index=True, max_length=32)),
            ],
            options={'ordering': ['category', 'key']},
        ),
    ]
