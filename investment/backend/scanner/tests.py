"""Cancelled broker simulation candidates can be discarded without losing order history."""

from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from trading_core.enums import ExecutionVenue, OrderStatus, Side
from trading_core.models import Candidate, Order


class DiscardCancelledCandidatesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = Candidate.objects.create(symbol='2330')
        self.order = Order.objects.create(
            symbol='2330', side=Side.BUY, qty=1000,
            venue=ExecutionVenue.BROKER_SIMULATION,
            status=OrderStatus.CANCELLED, filled_qty=0,
            candidate=self.candidate, external_id='test-order',
        )
        self.url = '/api/scanner/candidates/discard-cancelled/'

    @patch('scanner.views.AccountService._verify_trade_pin', return_value=True)
    def test_discards_only_cancelled_zero_fill_and_preserves_order(self, verify):
        response = self.client.post(self.url, {
            'candidateIds': [self.candidate.pk], 'trade_pin': 'test',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['discarded'], 1)
        self.assertFalse(Candidate.objects.filter(pk=self.candidate.pk).exists())
        self.order.refresh_from_db()
        self.assertIsNone(self.order.candidate_id)
        verify.assert_called_once_with('test')

    @patch('scanner.views.AccountService._verify_trade_pin', return_value=True)
    def test_rejects_filled_order_without_partial_deletion(self, _verify):
        other = Candidate.objects.create(symbol='2330')
        Order.objects.create(
            symbol='2330', side=Side.BUY, qty=1000,
            venue=ExecutionVenue.BROKER_SIMULATION,
            status=OrderStatus.PARTIALLY_FILLED, filled_qty=100,
            candidate=other,
        )
        response = self.client.post(self.url, {
            'candidateIds': [self.candidate.pk, other.pk], 'trade_pin': 'test',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertTrue(Candidate.objects.filter(pk=self.candidate.pk).exists())
        self.assertTrue(Candidate.objects.filter(pk=other.pk).exists())
