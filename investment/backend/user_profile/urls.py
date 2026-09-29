from django.urls import path
from .views import AvatarView, ProfileView

urlpatterns = [
    path('profile/', ProfileView.as_view()),
    path('profile/avatar/', AvatarView.as_view()),
]
