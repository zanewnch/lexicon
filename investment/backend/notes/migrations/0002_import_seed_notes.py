"""Import the existing Markdown notes without changing their IDs or timestamps."""

import json
import os
from pathlib import Path

from django.conf import settings
from django.db import migrations
from django.utils.dateparse import parse_datetime


def import_seed_notes(apps, schema_editor):
    source = Path(os.environ['LEXICON_INVESTMENT_SEED_NOTES']) if os.environ.get('LEXICON_INVESTMENT_SEED_NOTES') else settings.BASE_DIR.parent / 'frontend' / 'src' / 'data' / 'seedNotes.json'
    with source.open(encoding='utf-8') as file:
        notes = json.load(file)

    Note = apps.get_model('notes', 'Note')
    database = schema_editor.connection.alias
    for note in notes:
        created_at = parse_datetime(note['createdAt'])
        updated_at = parse_datetime(note['updatedAt'])
        if created_at is None or updated_at is None:
            raise ValueError(f"Invalid note timestamp: {note['id']}")
        Note.objects.using(database).get_or_create(
            id=note['id'],
            defaults={
                'title': note['title'],
                'content': note['content'],
                'category': note['category'],
                'tags': note['tags'],
                'pinned': note['pinned'],
                'created_at': created_at,
                'updated_at': updated_at,
            },
        )


class Migration(migrations.Migration):
    dependencies = [('notes', '0001_initial')]

    operations = [migrations.RunPython(import_seed_notes, migrations.RunPython.noop)]
