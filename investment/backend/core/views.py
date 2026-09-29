"""
Core base views — shared exception handling and system mode switching.
"""
import logging

from rest_framework.response import Response
from rest_framework.views import APIView

from core.cache import ServiceUnavailable
from core.shioaji import ShioajiConnection

logger = logging.getLogger(__name__)


class ServiceAPIView(APIView):
    """Base view：統一攔截 ServiceUnavailable → 503。"""

    def handle_exception(self, exc):
        if isinstance(exc, ServiceUnavailable):
            request_id = getattr(self.request, "request_id", "unknown")
            self.request.error_logged = True
            logger.exception(
                "Service unavailable method=%s path=%s request_id=%s detail=%s",
                self.request.method,
                self.request.path,
                request_id,
                str(exc),
            )
            return Response({
                "error": str(exc),
                "code": "SERVICE_UNAVAILABLE",
                "requestId": request_id,
            }, status=503)
        return super().handle_exception(exc)


class SystemModeView(ServiceAPIView):
    """
    GET  /api/system/mode/ — 查詢目前模式（simulation / connected）
    POST /api/system/mode/ — 切換模式（body: {"simulation": true|false}）
    切換時會重新登入 Shioaji API，成功後回傳新狀態。
    """
    def get(self, request):
        conn = ShioajiConnection.get_instance()
        return Response(conn.get_current_mode())

    def post(self, request):
        simulation = request.data.get("simulation")
        if type(simulation) is not bool:
            return Response({"error": "'simulation' must be a JSON boolean"}, status=400)
        conn = ShioajiConnection.get_instance()
        return Response(conn.switch_mode(simulation))
