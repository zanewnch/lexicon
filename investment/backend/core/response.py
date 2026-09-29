"""Standardized API response helpers."""

from rest_framework.response import Response


def api_success(data, total=None, status=200):
    """Wrap successful response in a consistent envelope."""
    body = {"data": data}
    if total is not None:
        body["total"] = total
    return Response(body, status=status)


def api_error(message, status=400):
    """Return a standardized error response."""
    return Response({"error": message}, status=status)
