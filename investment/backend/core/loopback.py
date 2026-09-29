"""Constrain browser writes to the local Lexicon investment origin."""

from urllib.parse import urlsplit
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
                    parsed = urlsplit(origin)
                    valid = parsed.scheme == 'http' and parsed.hostname == '127.0.0.1' and parsed.port == int(os.environ['LEXICON_INVESTMENT_PORT'])
                except (ValueError, KeyError):
                    valid = False
                if not valid:
                    return HttpResponseForbidden('Invalid local origin')
            if request.headers.get('Sec-Fetch-Site') == 'cross-site':
                return HttpResponseForbidden('Cross-site request blocked')
        return self.get_response(request)
