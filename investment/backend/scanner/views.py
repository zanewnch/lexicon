"""Scanner API views.

Route prefix: /api/scanner/
"""
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from account.service import AccountService
from scanner.service import ScannerService


class ScannerRunView(ServiceAPIView):
    """POST /api/scanner/run/

    Two body shapes:

    1. Explicit symbol list:
       { "symbols": ["2330", ...], "meta": {} }

    2. Funnel mode — wraps screener.FunnelService:
       { "funnel": {
           "codes":   ["2330", "2317", ...],   // starting universe
           "filters": { "pe_max": 30, ... },   // optional Layer 2
           "topN":    10,
           "minScore": 1
         }
       }
    """

    def post(self, request):
        funnel = request.data.get('funnel')
        if isinstance(funnel, dict):
            codes = funnel.get('codes') or []
            if not isinstance(codes, list) or not codes:
                return api_error('funnel.codes must be a non-empty list')
            created = ScannerService().run_from_funnel(
                codes=codes,
                filters=funnel.get('filters') or None,
                top_n=int(funnel.get('topN', 10)),
                min_score=int(funnel.get('minScore', 0)),
            )
            return Response({'created': len(created), 'mode': 'funnel'}, status=201)

        symbols = request.data.get('symbols') or []
        if not isinstance(symbols, list) or not symbols:
            return api_error('provide either "symbols" list or "funnel" object')
        meta = request.data.get('meta') or {}
        created = ScannerService().run(symbols, meta=meta)
        return Response({'created': len(created), 'mode': 'explicit'}, status=201)


class ScannerCandidatesView(ServiceAPIView):
    """GET /api/scanner/candidates/?all=1 — list candidates (default unconsumed only)."""

    def get(self, request):
        only_unconsumed = request.query_params.get('all') != '1'
        return Response(ScannerService().list_candidates(only_unconsumed=only_unconsumed))


class DiscardCancelledSimulationCandidatesView(ServiceAPIView):
    """POST /api/scanner/candidates/discard-cancelled/ with exact candidate IDs."""

    def post(self, request):
        ids = request.data.get('candidateIds')
        pin = request.data.get('trade_pin')
        if (not isinstance(ids, list) or not ids
                or any(type(candidate_id) is not int or candidate_id <= 0 for candidate_id in ids)
                or len(ids) != len(set(ids))):
            return api_error('candidateIds 必須是不重複的候選編號清單')
        if not isinstance(pin, str) or not AccountService()._verify_trade_pin(pin):
            return api_error('交易密碼未設定或錯誤', status=403)
        try:
            discarded = ScannerService().discard_cancelled_simulation_candidates(ids)
        except ValueError as exc:
            return api_error(str(exc))
        return Response({'discarded': discarded})
