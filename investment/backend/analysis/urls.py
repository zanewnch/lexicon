from django.urls import path
from . import views

urlpatterns = [
    path('analysis/indicators/', views.IndicatorsView.as_view()),
    path('analysis/policy/', views.PolicyNewsView.as_view()),
    path('analysis/budget/', views.BudgetView.as_view()),
    path('analysis/fundamental/', views.FundamentalView.as_view()),
    path('analysis/finmind-token-status/', views.FinMindTokenStatusView.as_view()),
    path('analysis/earnings-news/', views.EarningsNewsView.as_view()),
]
