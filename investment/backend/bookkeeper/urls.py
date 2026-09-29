from django.urls import path

from bookkeeper.views import BookkeeperReportView, BookkeeperTradesView

urlpatterns = [
    path('bookkeeper/report/', BookkeeperReportView.as_view()),
    path('bookkeeper/trades/', BookkeeperTradesView.as_view()),
]
