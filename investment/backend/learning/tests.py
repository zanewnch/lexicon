from django.test import TestCase

from .curriculum import get_curriculum
from .models import LearningProgress


class LearningApiTests(TestCase):
    def test_curriculum_has_ten_ordered_nodes_and_valid_stages(self):
        response = self.client.get('/api/learning/plan/')
        self.assertEqual(response.status_code, 200)
        plan = response.json()
        nodes = plan['nodes']
        self.assertEqual(len(nodes), 10)
        self.assertEqual([node['week'] for node in nodes], list(range(1, 11)))
        self.assertEqual(
            [node_id for stage in plan['stages'] for node_id in stage['nodeIds']],
            [node['id'] for node in nodes],
        )
        for node in nodes:
            self.assertTrue(set(node['prerequisiteIds']).issubset({item['id'] for item in nodes}))
            self.assertTrue(node['concept'])
            self.assertTrue(node['steps'])
            self.assertTrue(node['completionCriteria'])
            self.assertIn(len(node['resources']), (1, 2))

    def test_progress_can_be_completed_reloaded_edited_and_withdrawn(self):
        node_id = get_curriculum()['nodes'][0]['id']
        url = f'/api/learning/progress/{node_id}/'
        self.assertEqual(self.client.get('/api/learning/progress/').json(), {'items': []})

        completed = self.client.put(
            url,
            data={
                'status': 'completed',
                'artifactSummary': '已寫出進場與出場規則',
                'reflection': '盤整時可能反覆進出',
                'noteId': '',
                'strategyId': '',
                'externalUrl': '',
            },
            content_type='application/json',
        )
        self.assertEqual(completed.status_code, 200)
        self.assertIsNotNone(completed.json()['completedAt'])
        self.assertEqual(self.client.get('/api/learning/progress/').json()['items'][0]['status'], 'completed')

        edited = self.client.put(
            url,
            data={
                'status': 'completed',
                'artifactSummary': '補上明確的成交時點',
                'reflection': '仍須檢查滑價',
                'noteId': '',
                'strategyId': '',
                'externalUrl': 'https://example.com/research',
            },
            content_type='application/json',
        )
        self.assertEqual(edited.status_code, 200)
        self.assertEqual(edited.json()['completedAt'], completed.json()['completedAt'])
        self.assertEqual(LearningProgress.objects.get(node_id=node_id).artifact_summary, '補上明確的成交時點')

        withdrawn = self.client.put(
            url,
            data={'status': 'in_progress', 'artifactSummary': '', 'reflection': ''},
            content_type='application/json',
        )
        self.assertEqual(withdrawn.status_code, 200)
        self.assertIsNone(withdrawn.json()['completedAt'])

    def test_invalid_node_or_completion_does_not_create_progress(self):
        unknown = self.client.put(
            '/api/learning/progress/missing/',
            data={'status': 'completed', 'artifactSummary': '成果', 'reflection': '反思'},
            content_type='application/json',
        )
        self.assertEqual(unknown.status_code, 404)
        node_id = get_curriculum()['nodes'][0]['id']
        incomplete = self.client.put(
            f'/api/learning/progress/{node_id}/',
            data={'status': 'completed', 'artifactSummary': '成果', 'reflection': ''},
            content_type='application/json',
        )
        self.assertEqual(incomplete.status_code, 400)
        self.assertFalse(LearningProgress.objects.exists())
