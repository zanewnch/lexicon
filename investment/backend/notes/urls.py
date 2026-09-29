from django.urls import path
from notes.views import NoteDetailView, NoteListView

urlpatterns = [
    path('notes/', NoteListView.as_view()),
    path('notes/<str:pk>/', NoteDetailView.as_view()),
]
