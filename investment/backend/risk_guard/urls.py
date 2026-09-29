from django.urls import path

from risk_guard.views import RiskConfigView, RiskStatsView

urlpatterns = [
    path('risk/config/', RiskConfigView.as_view()),
    path('risk/stats/', RiskStatsView.as_view()),
]
