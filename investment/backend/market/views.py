"""
Market API views — indices, stock list, rankings, K-bars, technicals,
sector summary, watchlist, bid/ask, and limit prices.

Route prefix: ``/api/``
"""
import logging

from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from core.response import api_error, api_success
from core.views import ServiceAPIView
from market.twse import TWSEService
from market.quote import QuoteService
from market.technicals import compute_technicals
from account.service import AccountService

logger = logging.getLogger(__name__)

_twse = TWSEService()
_quote = QuoteService()
_account = AccountService()


class IndicesView(ServiceAPIView):
    """GET /api/indices/ — 大盤指數（加權/櫃買/金融/電子/半導體 + 台指近）。"""
    def get(self, request):
        return Response(_quote.get_indices())


class StockListView(ServiceAPIView):
    """GET /api/stocks/ — 全部股票列表，支援搜尋、篩選、排序、分頁。"""
    def get(self, request):
        stocks = _twse.get_all_stocks()

        search = request.query_params.get("search", "").strip()
        if search:
            search_lower = search.lower()
            stocks = [s for s in stocks if search_lower in s["code"].lower() or search_lower in s["name"].lower()]

        exchange = request.query_params.get("exchange", "").strip().upper()
        if exchange:
            stocks = [s for s in stocks if s["exchange"] == exchange]

        sector = request.query_params.get("sector", "").strip()
        if sector:
            stocks = [s for s in stocks if s["sector"] == sector]

        sort_field = request.query_params.get("sort", "turnover")
        order = request.query_params.get("order", "desc")
        reverse = order != "asc"
        if stocks and sort_field in stocks[0]:
            stocks.sort(key=lambda x: x.get(sort_field, 0) or 0, reverse=reverse)

        total = len(stocks)
        offset = int(request.query_params.get("offset", 0))
        limit = request.query_params.get("limit")
        if limit:
            stocks = stocks[offset:offset + int(limit)]
        elif offset:
            stocks = stocks[offset:]

        return api_success(stocks, total=total)


class StockTreemapView(ServiceAPIView):
    """GET /api/stocks/treemap/ — 所有股票的熱力圖資料（市值/漲跌幅）。"""
    def get(self, request):
        return Response(_twse.get_treemap_data())


class StockRankingsView(ServiceAPIView):
    """GET /api/stocks/rankings/?type=gainers&limit=50 — 排行榜（漲幅/跌幅/量/殖利率等）。"""
    def get(self, request):
        rank_type = request.query_params.get("type", "yield")
        limit = int(request.query_params.get("limit", 50))
        return Response(_twse.get_rankings(rank_type, limit))


class StockDetailView(ServiceAPIView):
    """GET /api/stocks/<code>/ — 單支股票即時快照 + 基本面（PE/PB/殖利率）。"""
    def get(self, request, code):
        data = _quote.get_stock_detail(code)
        if not data:
            return api_error(f'Stock {code} not found', 404)
        return Response(data)


class StockKlineView(ServiceAPIView):
    """GET /api/stocks/<code>/kline/?period=Day&limit=60 — K 線歷史資料。"""
    def get(self, request, code):
        period = request.query_params.get("period", "Day")
        try:
            limit = int(request.query_params.get("limit", 60))
        except (ValueError, TypeError) as exc:
            raise ValidationError({"limit": "須為整數"}) from exc
        if period not in {"1Min", "5Min", "15Min", "30Min", "60Min", "Day", "Week", "Month"}:
            raise ValidationError({"period": "不支援的 K 線週期"})
        if not 1 <= limit <= 365:
            raise ValidationError({"limit": "須介於 1 與 365 之間"})
        return Response(_quote.get_kbars(code, period=period, limit=limit))


class StockInstitutionalView(ServiceAPIView):
    """GET /api/stocks/<code>/institutional/?days=5 — 法人買賣超資料。"""
    def get(self, request, code):
        try:
            days = int(request.query_params.get("days", 5))
        except (ValueError, TypeError) as exc:
            raise ValidationError({"days": "須為整數"}) from exc
        if not 1 <= days <= 10:
            raise ValidationError({"days": "須介於 1 與 10 之間"})
        return Response(_twse.get_institutional_trading(code, days=days))


class StockTechnicalsView(ServiceAPIView):
    """GET /api/stocks/<code>/technicals/ — 技術指標（MA/RSI/KD/MACD）。"""
    def get(self, request, code):
        kbars = _quote.get_kbars(code, period="Day", limit=60)
        closes = [bar["close"] for bar in kbars]
        return Response(compute_technicals(closes))


class SectorListView(ServiceAPIView):
    """GET /api/sectors/ — 所有產業別摘要（平均漲跌、成交額、前三強弱）。"""
    def get(self, request):
        return Response(_twse.get_sectors_summary())


class SectorDetailView(ServiceAPIView):
    """GET /api/sectors/<name>/ — 單一產業別詳細資料。"""
    def get(self, request, name):
        for s in _twse.get_sectors_summary():
            if s["name"] == name:
                return Response(s)
        return api_error('Sector not found', 404)


class WatchlistView(ServiceAPIView):
    """GET /api/watchlist/?codes=2330,2454 — 自選股即時報價（逗號分隔股票碼）。"""
    def get(self, request):
        codes_param = request.query_params.get("codes", "")
        if not codes_param:
            return Response([])
        codes = [c.strip() for c in codes_param.split(",") if c.strip()]
        return Response(_quote.get_stock_quotes(codes))


class BidAskView(ServiceAPIView):
    """GET /api/stocks/<code>/bidask/ — 五檔委託簿（買/賣各五檔價量）。"""
    def get(self, request, code):
        return Response(_account.get_bidask(code))


class LimitPricesView(ServiceAPIView):
    """GET /api/stocks/<code>/limits/ — 漲跌停價（limitUp / limitDown）。"""
    def get(self, request, code):
        return Response(_account.get_limit_prices(code))
