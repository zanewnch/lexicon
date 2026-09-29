"""Bookkeeper API views.

Route prefix: /api/bookkeeper/
"""
from rest_framework.response import Response

from bookkeeper.service import BookkeeperService
from core.views import ServiceAPIView
from core.response import api_error
from trading_core.enums import ExecutionVenue


class BookkeeperReportView(ServiceAPIView):
    """GET /api/bookkeeper/report/ — realised P&L, win rate, equity curve."""

    def get(self, request):
        venue = request.query_params.get('venue', ExecutionVenue.PAPER)
        if venue not in ExecutionVenue.values:
            return api_error('invalid trading venue')
        return Response(BookkeeperService().get_report(venue=venue))


class BookkeeperTradesView(ServiceAPIView):
    """GET /api/bookkeeper/trades/?limit=N — recent filled trades."""

    def get(self, request):
        limit = int(request.query_params.get('limit', 200))
        venue = request.query_params.get('venue', ExecutionVenue.PAPER)
        if venue not in ExecutionVenue.values:
            return api_error('invalid trading venue')
        return Response(BookkeeperService().list_trades(limit=limit, venue=venue))
