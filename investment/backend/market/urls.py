from django.urls import path
from . import views

urlpatterns = [
    path("indices/", views.IndicesView.as_view(), name="indices"),
    path("stocks/", views.StockListView.as_view(), name="stock-list"),
    path("stocks/treemap/", views.StockTreemapView.as_view(), name="stock-treemap"),
    path("stocks/rankings/", views.StockRankingsView.as_view(), name="stock-rankings"),
    path("stocks/<str:code>/", views.StockDetailView.as_view(), name="stock-detail"),
    path("stocks/<str:code>/kline/", views.StockKlineView.as_view(), name="stock-kline"),
    path("stocks/<str:code>/institutional/", views.StockInstitutionalView.as_view(), name="stock-institutional"),
    path("stocks/<str:code>/technicals/", views.StockTechnicalsView.as_view(), name="stock-technicals"),
    path("stocks/<str:code>/bidask/", views.BidAskView.as_view(), name="stock-bidask"),
    path("stocks/<str:code>/limits/", views.LimitPricesView.as_view(), name="stock-limits"),
    path("sectors/", views.SectorListView.as_view(), name="sector-list"),
    path("sectors/<str:name>/", views.SectorDetailView.as_view(), name="sector-detail"),
    path("watchlist/", views.WatchlistView.as_view(), name="watchlist-quotes"),
]
