from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/market/(?P<code>\w+)/$", consumers.MarketDataConsumer.as_asgi()),
]
