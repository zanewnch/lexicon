"""
ASGI config for backend project.
Supports both HTTP (Django) and WebSocket (Channels) routing.
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.security.websocket import OriginValidator
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Must call get_asgi_application() before importing channel routes
django_asgi_app = get_asgi_application()

from market.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": OriginValidator(
        AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
        [f"http://127.0.0.1:{os.environ['LEXICON_INVESTMENT_PORT']}"]
        if os.environ.get('LEXICON_INVESTMENT_PORT') else ['http://localhost:5173', 'http://127.0.0.1:5173'],
    ),
})
