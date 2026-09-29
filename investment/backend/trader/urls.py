from django.urls import path

from trader.views import PositionsView, TraderExecuteView

urlpatterns = [
    path('trader/execute/', TraderExecuteView.as_view()),
    path('trader/positions/', PositionsView.as_view()),
]
