"""Exiter API views.

Route prefix: /api/exiter/
"""
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from exiter.service import ExiterService


class ExiterExecuteView(ServiceAPIView):
    """POST /api/exiter/execute/

    body (all optional):
      {
        "live": false,         # default false (paper trade)
        "tradePin": "..."      # required when live=true
      }
    """

    def post(self, request):
        live = request.data.get('live', False)
        if type(live) is not bool:
            return api_error('live must be a JSON boolean')
        try:
            result = ExiterService().execute(
                live=live,
                trade_pin=str(request.data.get('tradePin', '')),
                expected_venue=request.data.get('expectedVenue', ''),
            )
        except ValueError as e:
            return api_error(str(e))
        return Response(result, status=201)
