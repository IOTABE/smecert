# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomUserViewSet, EventViewSet, AttendanceViewSet, CertificateViewSet
)

router = DefaultRouter()
router.register(r'users', CustomUserViewSet)
router.register(r'events', EventViewSet)
router.register(r'attendances', AttendanceViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Specific actions if not handled by router or need custom URL
    path('certificates/validate/', CertificateViewSet.as_view({"post": "validate_certificate"}), name='certificate-validate'),
    path('attendances/check-in/', AttendanceViewSet.as_view({"post": "check_in"}), name='attendance-check-in'),
    # Assuming check-out uses the detail route with pk: POST /attendances/{pk}/check_out/
    path('attendances/<int:pk>/check-out/', AttendanceViewSet.as_view({"post": "check_out"}), name='attendance-check-out'),
    # You might want a dedicated endpoint for certificate generation if not using the ViewSet's default create
    path('certificates/generate/', CertificateViewSet.as_view({"post": "generate_certificate"}), name='certificate-generate'),
    # Endpoint for user profile
    path('users/me/', CustomUserViewSet.as_view({"get": "me"}), name='user-me'),
]

