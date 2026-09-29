from django.urls import path

from .views import CurriculumView, LearningProgressDetailView, LearningProgressListView


urlpatterns = [
    path('learning/plan/', CurriculumView.as_view(), name='learning-plan'),
    path('learning/progress/', LearningProgressListView.as_view(), name='learning-progress'),
    path('learning/progress/<str:node_id>/', LearningProgressDetailView.as_view(), name='learning-progress-detail'),
]
