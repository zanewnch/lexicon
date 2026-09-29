import base64
import json
import os
from datetime import datetime, timezone

from rest_framework.response import Response

from core.response import api_error
from core.views import ServiceAPIView
from .fetchers import fetch_all_indicators
from .policy_fetchers import fetch_policy_news
from .budget_fetchers import fetch_budget_data
from .fundamental_fetchers import fetch_fundamental
from .earnings_fetchers import fetch_earnings_news


class IndicatorsView(ServiceAPIView):
    """GET /api/analysis/indicators/ — 週期反轉指標"""
    def get(self, request):
        return Response(fetch_all_indicators())


class PolicyNewsView(ServiceAPIView):
    """GET /api/analysis/policy/ — 政策情報（鉅亨網關鍵字 + 行政院新聞稿）"""
    def get(self, request):
        return Response(fetch_policy_news())


class BudgetView(ServiceAPIView):
    """GET /api/analysis/budget/ — 政府預算歲出政事別年增率（主計總處）"""
    def get(self, request):
        return Response(fetch_budget_data())


def _decode_jwt_exp(token: str) -> int | None:
    """從 JWT token 的 payload 解析 exp（不驗簽，僅讀取）"""
    try:
        payload_b64 = token.split('.')[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload.get('exp')
    except Exception:
        return None


class FinMindTokenStatusView(ServiceAPIView):
    """GET /api/analysis/finmind-token-status/ — FinMind token 過期資訊"""
    def get(self, request):
        from django.conf import settings
        token = getattr(settings, 'FINMIND_TOKEN', '')
        saved_at = os.environ.get('FINMIND_TOKEN_SAVED_AT', '')

        if not token:
            return Response({
                'has_token': False,
                'message': '尚未設定 FinMind token',
            })

        exp_ts = _decode_jwt_exp(token)
        now_ts = int(datetime.now(timezone.utc).timestamp())

        result: dict = {
            'has_token': True,
            'saved_at': saved_at or None,
        }

        if exp_ts:
            remaining = exp_ts - now_ts
            result['expires_at'] = datetime.fromtimestamp(exp_ts, tz=timezone.utc).isoformat()
            result['remaining_seconds'] = remaining
            result['expired'] = remaining <= 0
            if remaining <= 0:
                result['message'] = 'Token 已過期，請重新申請'
            elif remaining < 86400:
                hours = remaining // 3600
                result['message'] = f'Token 即將過期（剩餘 {hours} 小時）'
            else:
                days = remaining // 86400
                hours = (remaining % 86400) // 3600
                result['message'] = f'Token 有效（剩餘 {days} 天 {hours} 小時）'
        else:
            result['message'] = '無法解析 token 過期時間'

        return Response(result)


class EarningsNewsView(ServiceAPIView):
    """GET /api/analysis/earnings-news/ — 台積電法說會相關新聞（鉅亨網）"""
    def get(self, request):
        return Response(fetch_earnings_news())


class FundamentalView(ServiceAPIView):
    """
    GET /api/analysis/fundamental/?stock_id=2330&source=finmind
    財務基本面：月營收、ROE、毛利率、營益率、法人買賣超
    """
    def get(self, request):
        stock_id = request.query_params.get('stock_id', '').strip()
        if not stock_id:
            return api_error('請提供 stock_id 參數')
        source = request.query_params.get('source', 'finmind').strip()
        token = request.query_params.get('token', '').strip()
        return Response(fetch_fundamental(stock_id, source=source, token=token))
