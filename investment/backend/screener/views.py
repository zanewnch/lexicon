"""
Screener API views — three-layer stock funnel (sectors, quantitative, technical).

Route prefix: ``/api/funnel/``
"""

from django.db.models import Q
from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from screener.models import GlossaryTerm
from screener.service import FunnelService
from screener.tags import TagService

_funnel = FunnelService()
_tags = TagService()


class FunnelSectorsView(ServiceAPIView):
    """GET /api/funnel/sectors/ — Layer 1 sector + theme data."""
    def get(self, request):
        return Response(_funnel.get_layer1_sectors())


class FunnelLayer2View(ServiceAPIView):
    """POST /api/funnel/layer2/ — Layer 2 quantitative filter."""
    def post(self, request):
        codes = request.data.get("codes", [])
        filters = request.data.get("filters", {})
        if not codes:
            return api_error('codes is required')
        return Response(_funnel.screen_layer2(codes, filters))


class FunnelLayer3View(ServiceAPIView):
    """POST /api/funnel/layer3/ — Layer 3 technical scoring."""
    def post(self, request):
        codes = request.data.get("codes", [])
        if not codes:
            return api_error('codes is required')
        if len(codes) > 100:
            return api_error('Maximum 100 codes allowed')
        return Response(_funnel.screen_layer3(codes))


class TagOptionsView(ServiceAPIView):
    """GET /api/tags/options/ — available tag values for each select."""
    def get(self, request):
        return Response(_tags.get_options())


class TagFilterView(ServiceAPIView):
    """POST /api/tags/filter/ — return stocks matching the selected tags.

    Body shape (every key optional; each value is a list of allowed tags):
      {
        "industry":  ["半導體業", "電子零組件業"],
        "liquidity": ["高流動性"],
        "momentum":  ["強勢"],
        "valuation": ["便宜", "合理"],
        "dividend":  ["高殖利率"],
        "flags":     ["爆量"],
        "exchange":  ["TSE", "OTC"],
        "offset":    0,
        "limit":     100
      }

    `limit` is clamped to [1, 500]. Full result size is still returned in `count`.
    """
    PAGE_MAX = 500
    PAGE_DEFAULT = 100

    def post(self, request):
        selectors = {
            k: request.data.get(k) or []
            for k in ("industry", "liquidity", "momentum", "trend",
                      "valuation", "dividend", "flags", "exchange")
        }
        try:
            offset = max(int(request.data.get("offset") or 0), 0)
            limit_raw = int(request.data.get("limit") or self.PAGE_DEFAULT)
        except (TypeError, ValueError):
            return api_error("offset / limit must be integers")
        limit = max(1, min(limit_raw, self.PAGE_MAX))

        rows = _tags.filter(selectors)
        total = len(rows)
        return Response({
            "count": total,
            "offset": offset,
            "limit": limit,
            "results": rows[offset:offset + limit],
        })


class GlossaryListView(ServiceAPIView):
    """GET /api/glossary/ — 回傳全部術語（flat list）"""
    def get(self, request):
        qs = GlossaryTerm.objects.all()
        return Response([
            {'key': t.key, 'term': t.term, 'description': t.description, 'category': t.category, 'example': t.example}
            for t in qs
        ])


class GlossarySearchView(ServiceAPIView):
    """GET /api/glossary/search/?q=xxx — 術語模糊搜尋（最多回傳 8 筆）"""
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])
        qs = GlossaryTerm.objects.filter(
            Q(term__icontains=q) | Q(description__icontains=q)
        )[:8]
        return Response([
            {'key': t.key, 'term': t.term, 'description': t.description, 'category': t.category, 'example': t.example}
            for t in qs
        ])
