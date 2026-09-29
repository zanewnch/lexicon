from django.conf import settings
from rest_framework.response import Response

from core.views import ServiceAPIView
from .models import UserProfile


def _get_or_create_profile():
    profile, _ = UserProfile.objects.get_or_create(pk=1)
    return profile


def _avatar_url(request, profile):
    if not profile.avatar:
        return None
    return request.build_absolute_uri(settings.MEDIA_URL + str(profile.avatar))


class ProfileView(ServiceAPIView):
    """
    GET  /api/profile/ — 取得個人資料
    PUT  /api/profile/ — 更新顯示名稱
    """

    def get(self, request):
        profile = _get_or_create_profile()
        return Response({
            'display_name': profile.display_name,
            'avatar_url': _avatar_url(request, profile),
        })

    def put(self, request):
        profile = _get_or_create_profile()
        profile.display_name = request.data.get('display_name', profile.display_name)
        profile.save(update_fields=['display_name'])
        return Response({
            'display_name': profile.display_name,
            'avatar_url': _avatar_url(request, profile),
        })


class AvatarView(ServiceAPIView):
    """
    POST   /api/profile/avatar/ — 上傳頭貼（multipart/form-data, field: avatar）
    DELETE /api/profile/avatar/ — 刪除頭貼
    """

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'error': 'No file provided'}, status=400)

        profile = _get_or_create_profile()
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = file
        profile.save(update_fields=['avatar'])
        return Response({'avatar_url': _avatar_url(request, profile)})

    def delete(self, request):
        profile = _get_or_create_profile()
        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save(update_fields=['avatar'])
        return Response(status=204)
