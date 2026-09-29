"""
Account API views — portfolio summary, holdings, trades, settlements, and order placement.

All views delegate to ``AccountService`` and inherit 503 error handling
from ``ServiceAPIView``.

Route prefix: ``/api/account/``
"""
from rest_framework.response import Response

from core.views import ServiceAPIView
from account.service import AccountService

_account = AccountService()


class PortfolioSummaryView(ServiceAPIView):
    """GET /api/account/portfolio/ — 帳戶餘額、持倉、今日損益摘要。"""
    def get(self, request):
        return Response(_account.get_portfolio_summary())


class HoldingsListView(ServiceAPIView):
    """GET /api/account/holdings/ — 目前持股清單（代碼、均成本、現價、損益）。"""
    def get(self, request):
        return Response(_account.get_holdings())


class RecentTradesView(ServiceAPIView):
    """GET /api/account/trades/?limit=N — 今日成交紀錄，預設最新 10 筆。"""
    def get(self, request):
        limit = int(request.query_params.get("limit", 10))
        return Response(_account.get_recent_trades()[:limit])


class SettlementsListView(ServiceAPIView):
    """GET /api/account/settlements/ — 待交割款項清單（日期、金額）。"""
    def get(self, request):
        return Response(_account.get_settlements())


class PlaceOrderView(ServiceAPIView):
    """POST /api/account/order/ — place a stock order."""
    def post(self, request):
        if 'client_ref' in request.data:
            return Response({"error": "client_ref 僅供內部委託使用"}, status=400)
        required = ("code", "side", "shares", "type", "trade_pin")
        missing = [f for f in required if not request.data.get(f)]
        if missing:
            return Response({"error": f"缺少必要欄位: {', '.join(missing)}"}, status=400)
        try:
            result = _account.place_order(request.data)
            return Response(result, status=201)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)


class CancelOrderView(ServiceAPIView):
    """POST /api/account/order/cancel/ — cancel one account stock order."""

    def post(self, request):
        try:
            result = _account.cancel_order(request.data)
            return Response(result, status=202)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
