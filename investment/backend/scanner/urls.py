from django.urls import path

from scanner.views import (DiscardCancelledSimulationCandidatesView,
                           ScannerCandidatesView, ScannerRunView)

urlpatterns = [
    path('scanner/run/', ScannerRunView.as_view()),
    path('scanner/candidates/', ScannerCandidatesView.as_view()),
    path('scanner/candidates/discard-cancelled/', DiscardCancelledSimulationCandidatesView.as_view()),
]
