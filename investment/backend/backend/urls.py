"""
全局 URL 路由註冊表。

所有 App 均挂載於 ``/api/`` 內短區。
WebSocket 路由另和在 ``market/routing.py`` 由 ASGI 組態。
"""
from django.conf import settings
import os
from django.contrib import admin
from django.urls import include, path
from django.urls import re_path
from django.http import JsonResponse
from .web import serve_frontend, serve_media
from core.english import rpc as english_rpc, events as english_events

urlpatterns = [
    path('api/english/rpc/', english_rpc),
    path('api/english/events/', english_events),
    path('api/lexicon/health/', lambda request: JsonResponse({'ok': True, 'nonce': os.environ.get('LEXICON_INVESTMENT_HEALTH_NONCE', '')})),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/', include('market.urls')),
    path('api/', include('account.urls')),
    path('api/', include('screener.urls')),
    path('api/', include('strategy.urls')),
    path('api/', include('learning.urls')),
    path('api/', include('news.urls')),
    path('api/', include('notes.urls')),
    path('api/', include('analysis.urls')),
    path('api/', include('scanner.urls')),
    path('api/', include('trader.urls')),
    path('api/', include('watchdog.urls')),
    path('api/', include('exiter.urls')),
    path('api/', include('bookkeeper.urls')),
    path('api/', include('risk_guard.urls')),
    path('api/', include('pipeline.urls')),
    path('api/', include('user_profile.urls')),
]

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve_media),
    re_path(r'^(?P<path>.*)$', serve_frontend),
]
