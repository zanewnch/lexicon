import json
from unittest.mock import patch, MagicMock
from django.test import RequestFactory, SimpleTestCase
from core.english import rpc

class EnglishGatewayTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.env = patch.dict('os.environ', {
            'UNUS_FRONTEND_ORIGIN': 'http://127.0.0.1:5174',
            'UNUS_ENGLISH_SERVICE_URL': 'http://127.0.0.1:55555',
            'UNUS_ENGLISH_SERVICE_TOKEN': 'private-internal-token',
        })
        self.env.start()
        self.addCleanup(self.env.stop)
    def request(self, **headers):
        return self.factory.post('/api/english/rpc/', json.dumps({'operation': 'model:status', 'args': []}), content_type='application/json', HTTP_X_UNUS_CLIENT='web', **headers)
    def test_cross_origin_write_is_rejected_before_contacting_service(self):
        with patch('urllib.request.urlopen') as upstream:
            self.assertEqual(rpc(self.request(HTTP_ORIGIN='https://example.com')).status_code, 403)
            upstream.assert_not_called()
    def test_custom_header_is_required_even_without_origin(self):
        request = self.request()
        del request.META['HTTP_X_UNUS_CLIENT']
        self.assertEqual(rpc(request).status_code, 403)
    def test_token_is_forwarded_only_to_internal_service(self):
        stream = MagicMock()
        stream.read.return_value = b'{"result":{"exists":true}}'
        stream.__enter__.return_value = stream
        with patch('urllib.request.urlopen', return_value=stream) as upstream:
            response = rpc(self.request(HTTP_ORIGIN='http://127.0.0.1:5174'))
            self.assertEqual(response.status_code, 200)
            self.assertNotIn(b'private-internal-token', response.content)
            self.assertEqual(upstream.call_args.args[0].get_header('Authorization'), 'Bearer private-internal-token')
    def test_offline_service_returns_actionable_503(self):
        with patch('urllib.request.urlopen', side_effect=ConnectionError):
            self.assertEqual(rpc(self.request()).status_code, 503)
    def test_oversized_request_and_bad_json_are_rejected(self):
        request = self.factory.post('/api/english/rpc/', b'x' * (256 * 1024 + 1), content_type='application/json', HTTP_X_UNUS_CLIENT='web')
        self.assertEqual(rpc(request).status_code, 413)
        request = self.factory.post('/api/english/rpc/', 'invalid', content_type='application/json', HTTP_X_UNUS_CLIENT='web')
        self.assertEqual(rpc(request).status_code, 400)
