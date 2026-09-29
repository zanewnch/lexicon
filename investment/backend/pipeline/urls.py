from django.urls import path
from . import views

urlpatterns = [
    path('pipeline/match/', views.PipelineMatchView.as_view(), name='pipeline-match'),
    path('pipeline/commit/', views.PipelineCommitView.as_view(), name='pipeline-commit'),
    path('pipeline/pending/', views.PipelinePendingView.as_view(), name='pipeline-pending'),
]
