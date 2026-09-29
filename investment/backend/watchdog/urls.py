from django.urls import path

from watchdog.views import ExitSignalsView, WatchdogCheckView

urlpatterns = [
    path('watchdog/check/', WatchdogCheckView.as_view()),
    path('watchdog/exit-signals/', ExitSignalsView.as_view()),
]
