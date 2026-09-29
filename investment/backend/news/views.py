"""
News API views — aggregated financial news from Anue + ETtoday.

Route prefix: ``/api/news/``
"""
from rest_framework.response import Response

from core.views import ServiceAPIView
from news.service import NewsService

_news = NewsService()


class NewsListView(ServiceAPIView):
    """
    GET /api/news/

    Query params:
        source:  "all" | "anue" | "ettoday"  (default: "all")
        search:  關鍵字筛選（標題 / 摘要 / 股票 / tag）
        limit:   每頁筆數（預設 30）
        offset:  分頁偏移（預設 0）
    """
    def get(self, request):
        source = request.query_params.get("source", "all").strip().lower()
        search = request.query_params.get("search", "").strip()
        limit = int(request.query_params.get("limit", 30))
        offset = int(request.query_params.get("offset", 0))
        return Response(_news.get_news(source=source, search=search, limit=limit, offset=offset))
