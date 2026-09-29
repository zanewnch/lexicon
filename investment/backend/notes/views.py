"""Notes API views backed by the Django database."""

import uuid

from django.utils import timezone
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from .models import Note


def serialize_note(note: Note) -> dict:
    return {
        'id': note.id,
        'title': note.title,
        'content': note.content,
        'category': note.category,
        'tags': note.tags,
        'pinned': note.pinned,
        'createdAt': note.created_at.isoformat(),
        'updatedAt': note.updated_at.isoformat(),
    }


class NoteListView(ServiceAPIView):
    """List and create Markdown notes at /api/notes/."""

    def get(self, request):
        return Response([serialize_note(note) for note in Note.objects.all()])

    def post(self, request):
        now = timezone.now()
        note = Note.objects.create(
            id=f'note-{uuid.uuid4().hex[:8]}',
            title=request.data.get('title', '無標題'),
            content=request.data.get('content', ''),
            category=request.data.get('category', '其他'),
            tags=request.data.get('tags', []),
            pinned=request.data.get('pinned', False),
            created_at=now,
            updated_at=now,
        )
        return Response(serialize_note(note), status=201)


class NoteDetailView(ServiceAPIView):
    """Update and delete one Markdown note at /api/notes/<pk>/."""

    def put(self, request, pk):
        note = Note.objects.filter(pk=pk).first()
        if note is None:
            return api_error('Not found', 404)
        for field in ('title', 'content', 'category', 'tags', 'pinned'):
            if field in request.data:
                setattr(note, field, request.data[field])
        note.updated_at = timezone.now()
        note.save()
        return Response(serialize_note(note))

    def delete(self, request, pk):
        deleted, _ = Note.objects.filter(pk=pk).delete()
        if not deleted:
            return api_error('Not found', 404)
        return Response(status=204)
