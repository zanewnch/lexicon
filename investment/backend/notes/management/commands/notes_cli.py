"""Read and maintain notes without starting the HTTP API server."""

import json
import sys
import uuid
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from notes.models import Note


MUTABLE_FIELDS = {"title", "content", "category", "tags", "pinned"}


def configure_utf8_output():
    """Keep JSON output readable when Django is invoked from Windows shells."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def serialize_note(note):
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "category": note.category,
        "tags": note.tags,
        "pinned": note.pinned,
        "createdAt": note.created_at.isoformat(),
        "updatedAt": note.updated_at.isoformat(),
    }


def read_json_file(filename, *, description):
    try:
        with Path(filename).open("r", encoding="utf-8-sig") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        raise CommandError(f"Cannot read {description}: {exc}") from exc


def validate_note_data(data, *, creating):
    if not isinstance(data, dict):
        raise CommandError("Input JSON must be an object.")

    unknown_fields = set(data) - MUTABLE_FIELDS
    if unknown_fields:
        raise CommandError(
            "Unsupported field(s): " + ", ".join(sorted(unknown_fields))
        )
    if creating and not data.get("title"):
        raise CommandError("The title field is required when creating a note.")
    if not creating and not data:
        raise CommandError("Provide at least one field to update.")

    for field in ("title", "content", "category"):
        if field in data and not isinstance(data[field], str):
            raise CommandError(f"The {field} field must be a string.")
    if "tags" in data and (
        not isinstance(data["tags"], list)
        or any(not isinstance(tag, str) for tag in data["tags"])
    ):
        raise CommandError("The tags field must be a list of strings.")
    if "pinned" in data and not isinstance(data["pinned"], bool):
        raise CommandError("The pinned field must be a boolean.")
    return data


class Command(BaseCommand):
    help = "Access Django notes directly, without starting the HTTP API server."

    def add_arguments(self, parser):
        subparsers = parser.add_subparsers(dest="action", required=True)

        list_parser = subparsers.add_parser("list", help="List notes as JSON.")
        list_parser.add_argument(
            "--filter-file",
            help="UTF-8 JSON file with optional title, tags, category, pinned, and q filters.",
        )
        list_parser.add_argument("--limit", type=int, default=100)
        list_parser.add_argument("--offset", type=int, default=0)

        get_parser = subparsers.add_parser("get", help="Read one note by ID.")
        get_parser.add_argument("id")

        create_parser = subparsers.add_parser("create", help="Create a note from JSON.")
        create_parser.add_argument("--input-file", required=True)

        update_parser = subparsers.add_parser("update", help="Update a note from JSON.")
        update_parser.add_argument("id")
        update_parser.add_argument("--input-file", required=True)

        append_parser = subparsers.add_parser(
            "append", help="Append Markdown to a note without replacing its content."
        )
        append_parser.add_argument("id")
        append_parser.add_argument("--input-file", required=True)

        delete_parser = subparsers.add_parser("delete", help="Delete one note by ID.")
        delete_parser.add_argument("id")
        delete_parser.add_argument(
            "--confirm", action="store_true", help="Confirm the requested deletion."
        )

    def handle(self, *args, **options):
        configure_utf8_output()
        action = options["action"]
        if action == "list":
            return self.list_notes(options)
        if action == "get":
            return self.get_note(options["id"])
        if action == "create":
            return self.create_note(options["input_file"])
        if action == "update":
            return self.update_note(options["id"], options["input_file"])
        if action == "append":
            return self.append_note(options["id"], options["input_file"])
        if action == "delete":
            return self.delete_note(options["id"], options["confirm"])
        raise CommandError(f"Unknown action: {action}")

    def emit_json(self, value):
        self.stdout.write(json.dumps(value, ensure_ascii=False, indent=2))

    def list_notes(self, options):
        filters = {}
        if options["filter_file"]:
            filters = read_json_file(options["filter_file"], description="filter file")
            if not isinstance(filters, dict):
                raise CommandError("Filter JSON must be an object.")

        allowed_filters = {"title", "tags", "category", "pinned", "q"}
        unknown_filters = set(filters) - allowed_filters
        if unknown_filters:
            raise CommandError(
                "Unsupported filter(s): " + ", ".join(sorted(unknown_filters))
            )
        if "title" in filters and not isinstance(filters["title"], str):
            raise CommandError("The title filter must be a string.")
        if "category" in filters and not isinstance(filters["category"], str):
            raise CommandError("The category filter must be a string.")
        if "q" in filters and not isinstance(filters["q"], str):
            raise CommandError("The q filter must be a string.")
        if "pinned" in filters and not isinstance(filters["pinned"], bool):
            raise CommandError("The pinned filter must be a boolean.")
        if "tags" in filters and (
            not isinstance(filters["tags"], list)
            or any(not isinstance(tag, str) for tag in filters["tags"])
        ):
            raise CommandError("The tags filter must be a list of strings.")
        if options["limit"] < 1 or options["offset"] < 0:
            raise CommandError("Limit must be positive and offset cannot be negative.")

        notes = Note.objects.all()
        if "title" in filters:
            notes = notes.filter(title=filters["title"])
        if "category" in filters:
            notes = notes.filter(category=filters["category"])
        if "pinned" in filters:
            notes = notes.filter(pinned=filters["pinned"])
        if filters.get("q"):
            from django.db.models import Q

            notes = notes.filter(
                Q(title__icontains=filters["q"]) | Q(content__icontains=filters["q"])
            )

        matching_notes = [
            note
            for note in notes
            if all(tag in (note.tags or []) for tag in filters.get("tags", []))
        ]
        start = options["offset"]
        selected = matching_notes[start : start + options["limit"]]
        self.emit_json(
            {
                "count": len(matching_notes),
                "offset": start,
                "limit": options["limit"],
                "results": [serialize_note(note) for note in selected],
            }
        )

    def get_note(self, note_id):
        try:
            note = Note.objects.get(pk=note_id)
        except Note.DoesNotExist as exc:
            raise CommandError(f"Note not found: {note_id}") from exc
        self.emit_json(serialize_note(note))

    def create_note(self, input_file):
        data = validate_note_data(
            read_json_file(input_file, description="note input file"), creating=True
        )
        now = timezone.now()
        note = Note.objects.create(
            id=f"note-{uuid.uuid4().hex[:8]}",
            title=data["title"],
            content=data.get("content", ""),
            category=data.get("category", "其他"),
            tags=data.get("tags", []),
            pinned=data.get("pinned", False),
            created_at=now,
            updated_at=now,
        )
        self.emit_json(serialize_note(note))

    def update_note(self, note_id, input_file):
        data = validate_note_data(
            read_json_file(input_file, description="note input file"), creating=False
        )
        with transaction.atomic():
            try:
                note = Note.objects.select_for_update().get(pk=note_id)
            except Note.DoesNotExist as exc:
                raise CommandError(f"Note not found: {note_id}") from exc
            for field, value in data.items():
                setattr(note, field, value)
            note.updated_at = timezone.now()
            note.save()
        self.emit_json(serialize_note(note))

    def append_note(self, note_id, input_file):
        data = read_json_file(input_file, description="note input file")
        if not isinstance(data, dict) or set(data) != {"content"}:
            raise CommandError('Append input must be an object with only "content".')
        if not isinstance(data["content"], str) or not data["content"].strip():
            raise CommandError("Appended content must be a non-empty string.")
        with transaction.atomic():
            try:
                note = Note.objects.select_for_update().get(pk=note_id)
            except Note.DoesNotExist as exc:
                raise CommandError(f"Note not found: {note_id}") from exc
            note.content = f"{note.content.rstrip()}\n\n{data['content'].strip()}"
            note.updated_at = timezone.now()
            note.save(update_fields=["content", "updated_at"])
        self.emit_json(serialize_note(note))

    def delete_note(self, note_id, confirmed):
        if not confirmed:
            raise CommandError("Deletion requires the explicit --confirm option.")
        try:
            note = Note.objects.get(pk=note_id)
        except Note.DoesNotExist as exc:
            raise CommandError(f"Note not found: {note_id}") from exc
        note.delete()
        self.emit_json({"deleted": note_id})
