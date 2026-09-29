"""Watchdog API views.

Route prefix: /api/watchdog/
"""
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from watchdog.service import WatchdogService
from trading_core.enums import ExecutionVenue


class WatchdogCheckView(ServiceAPIView):
    """POST /api/watchdog/check/

    body (all optional):
      {
        "prices": { "<symbol>": <price>, ... },   # if omitted, pulled live via QuoteService
        "stopLossPct":  -5,
        "takeProfitPct": 10
      }
    """

    def post(self, request):
        venue = request.data.get('venue', ExecutionVenue.PAPER)
        if venue not in ExecutionVenue.values:
            return api_error('invalid trading venue')
        prices_in = request.data.get('prices')
        prices: dict[str, float] | None = None
        if prices_in is not None:
            if not isinstance(prices_in, dict):
                return api_error('prices must be a {symbol: price} map')
            try:
                prices = {str(k): float(v) for k, v in prices_in.items()}
            except (TypeError, ValueError):
                return api_error('prices values must be numeric')

        signals = WatchdogService().check(
            prices=prices,
            stop_loss_pct=request.data.get('stopLossPct'),
            take_profit_pct=request.data.get('takeProfitPct'),
            venue=venue,
        )
        return Response(
            {'created': len(signals), 'pricesSource': 'supplied' if prices is not None else 'live'},
            status=201,
        )


class ExitSignalsView(ServiceAPIView):
    """GET /api/watchdog/exit-signals/?all=1 — default lists pending only."""

    def get(self, request):
        only_pending = request.query_params.get('all') != '1'
        venue = request.query_params.get('venue', ExecutionVenue.PAPER)
        if venue not in ExecutionVenue.values:
            return api_error('invalid trading venue')
        return Response(WatchdogService().list_signals(only_pending=only_pending, venue=venue))
