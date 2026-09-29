"""Attach diagnostic IDs to API responses and record HTTP failures."""

import logging
import re
import time
import uuid


logger = logging.getLogger("api.request")


class RequestLoggingMiddleware:
    """Log API errors with a request ID that can be matched to frontend reports."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming_id = request.headers.get("X-Request-ID", "")
        request.request_id = incoming_id if re.fullmatch(r"[A-Za-z0-9-]{8,64}", incoming_id) else uuid.uuid4().hex[:12]
        request.started_at = time.perf_counter()
        is_api_request = request.path.startswith("/api/")
        if is_api_request:
            logger.info(
                "API request started method=%s path=%s request_id=%s",
                request.method,
                request.path,
                request.request_id,
            )

        response = self.get_response(request)
        response["X-Request-ID"] = request.request_id

        if is_api_request:
            duration_ms = round((time.perf_counter() - request.started_at) * 1000)
            status = response.status_code
            level = logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO
            logger.log(
                level,
                "API request completed status=%s duration_ms=%s method=%s path=%s request_id=%s",
                status,
                duration_ms,
                request.method,
                request.path,
                request.request_id,
            )
        return response

    def process_exception(self, request, exception):
        if request.path.startswith("/api/"):
            logger.exception(
                "Unhandled API exception method=%s path=%s request_id=%s",
                request.method,
                request.path,
                getattr(request, "request_id", "unknown"),
            )
        return None
