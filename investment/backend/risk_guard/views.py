"""RiskGuard API views.

Route prefix: /api/risk/
"""
from rest_framework.response import Response

from core.views import ServiceAPIView
from risk_guard.models import RiskConfig
from risk_guard.service import RiskGuardService
from trading_core.enums import ExecutionVenue
from core.response import api_error
from account.service import AccountService


def _serialize(cfg: RiskConfig) -> dict:
    return {
        'maxPositions': cfg.max_positions,
        'maxPositionPct': cfg.max_position_pct,
        'maxDailyLoss': cfg.max_daily_loss,
        'blacklist': list(cfg.blacklist or []),
        'enabled': cfg.enabled,
        'updatedAt': cfg.updated_at.isoformat() if cfg.updated_at else None,
    }


class RiskConfigView(ServiceAPIView):
    """GET  /api/risk/config/ — current risk limits
    PUT  /api/risk/config/ — update limits (any subset of fields)
    """

    def get(self, request):
        return Response(_serialize(RiskConfig.load()))

    def put(self, request):
        pin = request.data.get('tradePin', '')
        if not isinstance(pin, str) or not AccountService()._verify_trade_pin(pin):
            return api_error('交易密碼未設定或錯誤', status=403)
        cfg = RiskConfig.load()
        mapping = {
            'maxPositions': 'max_positions',
            'maxPositionPct': 'max_position_pct',
            'maxDailyLoss': 'max_daily_loss',
            'blacklist': 'blacklist',
            'enabled': 'enabled',
        }
        changed: list[str] = []
        for body_key, field in mapping.items():
            if body_key in request.data:
                value = request.data[body_key]
                if field == 'max_positions' and (type(value) is not int or not 1 <= value <= 100):
                    return api_error('maxPositions must be an integer between 1 and 100')
                if field == 'max_position_pct' and (type(value) not in (int, float) or not 0 < value <= 100):
                    return api_error('maxPositionPct must be between 0 and 100')
                if field == 'max_daily_loss' and (type(value) not in (int, float) or value >= 0):
                    return api_error('maxDailyLoss must be negative')
                if field == 'blacklist' and (not isinstance(value, list) or any(not isinstance(s, str) for s in value)):
                    return api_error('blacklist must be a list of stock codes')
                if field == 'enabled' and type(value) is not bool:
                    return api_error('enabled must be a JSON boolean')
                setattr(cfg, field, value)
                changed.append(field)
        if changed:
            cfg.save(update_fields=changed + ['updated_at'])
        return Response(_serialize(cfg))


class RiskStatsView(ServiceAPIView):
    """GET /api/risk/stats/ — today's realised PnL and open position count."""

    def get(self, request):
        venue = request.query_params.get('venue', ExecutionVenue.PAPER)
        if venue not in ExecutionVenue.values:
            return api_error('invalid trading venue')
        return Response(RiskGuardService().stats(venue))
