"""Constrain browser writes to the local Unus investment origin."""

import os

from django.conf import settings
from django.http import HttpResponseForbidden


class LoopbackOriginMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.LEXICON_DATA_DIR and request.method not in ('GET', 'HEAD', 'OPTIONS'):
            origin = request.headers.get('Origin')
            if origin:
                try:
                    valid = origin in {os.environ.get('UNUS_FRONTEND_ORIGIN'), f"http://127.0.0.1:{os.environ.get('LEXICON_INVESTMENT_PORT', '')}"}
                except (ValueError, KeyError):
                    valid = False
                if not valid:
                    return HttpResponseForbidden('Invalid local origin')
            if request.headers.get('Sec-Fetch-Site') == 'cross-site':
                return HttpResponseForbidden('Cross-site request blocked')
        return self.get_response(request)
