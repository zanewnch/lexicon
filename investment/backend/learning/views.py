from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.response import Response

from core.views import ServiceAPIView
from .curriculum import get_curriculum, get_node_ids
from .models import LearningProgress


FIELDS = ('artifactSummary', 'reflection', 'noteId', 'strategyId', 'externalUrl')
STATUSES = {'not_started', 'in_progress', 'completed'}


def serialize_progress(item: LearningProgress) -> dict:
    return {
        'nodeId': item.node_id,
        'status': item.status,
        'artifactSummary': item.artifact_summary,
        'reflection': item.reflection,
        'noteId': item.note_id,
        'strategyId': item.strategy_id,
        'externalUrl': item.external_url,
        'completedAt': item.completed_at.isoformat() if item.completed_at else None,
        'updatedAt': item.updated_at.isoformat(),
    }


class CurriculumView(ServiceAPIView):
    def get(self, request):
        return Response(get_curriculum())


class LearningProgressListView(ServiceAPIView):
    def get(self, request):
        return Response({'items': [serialize_progress(item) for item in LearningProgress.objects.all()]})


class LearningProgressDetailView(ServiceAPIView):
    def put(self, request, node_id):
        if node_id not in get_node_ids():
            return Response({'error': 'Unknown learning node'}, status=404)

        status_value = request.data.get('status')
        if status_value not in STATUSES:
            return Response({'error': 'Invalid status'}, status=400)

        values = {}
        for field in FIELDS:
            value = request.data.get(field, '')
            if not isinstance(value, str):
                return Response({'error': f'{field} must be a string'}, status=400)
            values[field] = value.strip()

        if status_value == 'completed' and not (values['artifactSummary'] and values['reflection']):
            return Response({'error': 'Completed tasks need an artifact summary and reflection'}, status=400)

        if values['externalUrl']:
            try:
                URLValidator(schemes=['https', 'http'])(values['externalUrl'])
            except ValidationError:
                return Response({'error': 'Invalid external URL'}, status=400)

        item, _ = LearningProgress.objects.get_or_create(node_id=node_id)
        item.status = status_value
        item.artifact_summary = values['artifactSummary']
        item.reflection = values['reflection']
        item.note_id = values['noteId']
        item.strategy_id = values['strategyId']
        item.external_url = values['externalUrl']
        item.completed_at = (
            item.completed_at or timezone.now()
            if status_value == 'completed'
            else None
        )
        item.save()
        return Response(serialize_progress(item))
