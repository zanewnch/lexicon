"""
Strategy API views — CRUD + toggle + backtest for trading strategies.

Strategies are stored in ``strategy/data/strategies.json`` via ``StrategyService``.
Route prefix: ``/api/strategies/``
"""

from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from strategy.service import StrategyService
from strategy.backtest import run_backtest

_strategy = StrategyService()


class StrategyListView(ServiceAPIView):
    """
    GET  /api/strategies/  — 所有策略清單
    POST /api/strategies/  — 建立新策略（targets/conditions/logic/action）
    """
    def get(self, request):
        return Response(_strategy.list())

    def post(self, request):
        strategy = _strategy.create(request.data)
        return Response(strategy, status=201)


class StrategyDetailView(ServiceAPIView):
    """
    GET    /api/strategies/<pk>/ — 策略詳細
    PUT    /api/strategies/<pk>/ — 更新策略
    DELETE /api/strategies/<pk>/ — 刪除策略
    """
    def get(self, request, pk):
        s = _strategy.get(pk)
        if not s:
            return api_error('Strategy not found', 404)
        return Response(s)

    def put(self, request, pk):
        s = _strategy.update(pk, request.data)
        if not s:
            return api_error('Strategy not found', 404)
        return Response(s)

    def delete(self, request, pk):
        if not _strategy.delete(pk):
            return api_error('Strategy not found', 404)
        return Response(status=204)


class StrategyToggleView(ServiceAPIView):
    """POST /api/strategies/<pk>/toggle/ — 切換啟用/停用狀態。"""
    def post(self, request, pk):
        s = _strategy.toggle(pk)
        if not s:
            return api_error('Strategy not found', 404)
        return Response(s)


class StrategyBacktestView(ServiceAPIView):
    """
    POST /api/strategies/<pk>/backtest/?days=120

    對策略均寬記歷史 K 線回測，最多 365 日。
    回傳：訊號日期列表、股名、勝率、均報酐等。
    """
    def post(self, request, pk):
        s = _strategy.get(pk)
        if not s:
            return api_error('Strategy not found', 404)
        days = int(request.data.get("days", 120))
        days = min(days, 365)
        result = run_backtest(s, days=days)
        return Response(result)
