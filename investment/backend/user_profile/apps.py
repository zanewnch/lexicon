from django.apps import AppConfig


class ProfileConfig(AppConfig):
    name = 'user_profile'
    label = 'profile'  # Keep the existing migration identity and data tables.
