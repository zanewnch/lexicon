from django.urls import path
from . import views

urlpatterns = [
    path("strategies/", views.StrategyListView.as_view(), name="strategy-list"),
    path("strategies/<str:pk>/", views.StrategyDetailView.as_view(), name="strategy-detail"),
    path("strategies/<str:pk>/toggle/", views.StrategyToggleView.as_view(), name="strategy-toggle"),
    path("strategies/<str:pk>/backtest/", views.StrategyBacktestView.as_view(), name="strategy-backtest"),
]
