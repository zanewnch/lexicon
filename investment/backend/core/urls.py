from django.urls import path
from . import views

urlpatterns = [
    path("system/mode/", views.SystemModeView.as_view(), name="system-mode"),
]
