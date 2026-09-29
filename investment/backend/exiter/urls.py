from django.urls import path

from exiter.views import ExiterExecuteView

urlpatterns = [
    path('exiter/execute/', ExiterExecuteView.as_view()),
]
