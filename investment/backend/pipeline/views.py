"""
Pipeline API views — 串接 Scanner 結果到 Trader 的中介層。

Route prefix: /api/pipeline/
"""
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from pipeline.service import PipelineService

_service = PipelineService()


class PipelineMatchView(ServiceAPIView):
    """POST /api/pipeline/match/

    body: {
      symbols:        ["2330", ...],
      signals:        ["ma_cross", "macd", ...],
      params:         { ma_short, ma_long, macd_fast, ... },
      mode:           "all" | "any",
      lookback_days:  int
    }
    """
    def post(self, request):
        symbols = request.data.get('symbols') or []
        signals = request.data.get('signals') or []
        params = request.data.get('params') or {}
        mode = request.data.get('mode', 'all')
        try:
            lookback = int(request.data.get('lookback_days', 60))
        except (TypeError, ValueError):
            return api_error('lookback_days must be int')

        if not isinstance(symbols, list) or not symbols:
            return api_error('symbols is required')
        if not isinstance(signals, list) or not signals:
            return api_error('signals is required')
        if mode not in ('all', 'any'):
            return api_error('mode must be "all" or "any"')

        return Response(_service.match(symbols, signals, params, mode, lookback))


class PipelineCommitView(ServiceAPIView):
    """POST /api/pipeline/commit/ — 寫入 Candidate table 供 Trader 消化。

    body: {
      items: [{ symbol, shares, estimatedPrice, stopLossPrice, takeProfitPrice }, ...],
      meta:  { timeframe, entry, sizing }
    }
    """
    def post(self, request):
        items = request.data.get('items') or []
        meta = request.data.get('meta') or {}
        if not isinstance(items, list) or not items:
            return api_error('items is required')
        return Response(_service.commit(items, meta), status=201)


class PipelinePendingView(ServiceAPIView):
    """GET /api/pipeline/pending/ — 列出尚未被消化的 Candidate。"""
    def get(self, request):
        return Response(_service.list_pending())
