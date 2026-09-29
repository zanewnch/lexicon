from django.urls import path
from . import views

urlpatterns = [
    path("account/portfolio/", views.PortfolioSummaryView.as_view(), name="portfolio-summary"),
    path("account/holdings/", views.HoldingsListView.as_view(), name="holdings-list"),
    path("account/trades/", views.RecentTradesView.as_view(), name="recent-trades"),
    path("account/order/", views.PlaceOrderView.as_view(), name="place-order"),
    path("account/order/cancel/", views.CancelOrderView.as_view(), name="cancel-order"),
    path("account/settlements/", views.SettlementsListView.as_view(), name="settlements-list"),
]
