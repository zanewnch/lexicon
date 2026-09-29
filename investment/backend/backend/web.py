"""Serve the bundled investment SPA from the same loopback origin as the API."""

import mimetypes
import os
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseNotAllowed


def _serve_file(request, root: Path, name: str, *, spa_fallback: bool = False):
    if request.method not in ('GET', 'HEAD'):
        return HttpResponseNotAllowed(['GET', 'HEAD'])
    root = root.resolve()
    target = (root / name).resolve()
    if not target.is_relative_to(root):
        raise Http404()
    if not target.is_file():
        if spa_fallback and '.' not in Path(name).name:
            target = root / 'index.html'
        else:
            raise Http404()
    if not target.is_file():
        raise Http404()
    content_type = mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
    return FileResponse(target.open('rb'), content_type=content_type)


def serve_frontend(request, path=''):
    if path.startswith(('api/', 'ws/', 'media/')):
        raise Http404()
    root = os.environ.get('LEXICON_INVESTMENT_FRONTEND_DIST')
    if not root:
        raise Http404('Investment frontend has not been built')
    return _serve_file(request, Path(root), path or 'index.html', spa_fallback=True)


def serve_media(request, path=''):
    return _serve_file(request, Path(settings.MEDIA_ROOT), path)
