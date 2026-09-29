"""Trader API views.

Route prefix: /api/trader/
"""
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from trader.service import TraderService
from trading_core.enums import ExecutionVenue


class TraderExecuteView(ServiceAPIView):
    """POST /api/trader/execute/

    body: {
      capital:  float,                        # cash to allocate equal-weight
      prices:   { "<symbol>": <price>, ... }, # required for sizing
      live?:    bool,                         # default false (paper trade)
      tradePin?: str                          # required when live=true
    }
    """

    def post(self, request):
        try:
            capital = float(request.data.get('capital', 0))
        except (TypeError, ValueError):
            return api_error('capital must be numeric')
        prices = request.data.get('prices') or {}
        if not isinstance(prices, dict):
            return api_error('prices must be a {symbol: price} map')
        try:
            prices = {str(k): float(v) for k, v in prices.items()}
        except (TypeError, ValueError):
            return api_error('prices values must be numeric')

        live = request.data.get('live', False)
        if type(live) is not bool:
            return api_error('live must be a JSON boolean')
        candidate_ids = request.data.get('candidateIds')
        if candidate_ids is not None and (
            not isinstance(candidate_ids, list) or not candidate_ids
            or any(type(value) is not int or value <= 0 for value in candidate_ids)
        ):
            return api_error('candidateIds must be a non-empty list of positive integers')
        try:
            result = TraderService().execute(
                capital=capital,
                prices=prices,
                live=live,
                trade_pin=str(request.data.get('tradePin', '')),
                expected_venue=request.data.get('expectedVenue', ''),
                candidate_ids=candidate_ids,
            )
        except ValueError as e:
            return api_error(str(e))
        return Response(result, status=201)


class PositionsView(ServiceAPIView):
    """GET /api/trader/positions/?all=1 — default lists open positions only."""

    def get(self, request):
        only_open = request.query_params.get('all') != '1'
        venue = request.query_params.get('venue', ExecutionVenue.PAPER)
        if venue not in ExecutionVenue.values:
            return api_error('invalid trading venue')
        return Response(TraderService().list_positions(only_open=only_open, venue=venue))
