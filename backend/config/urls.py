from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/activite/', include('apps.activite.urls')),
    path('api/support/', include('apps.support.urls')),

    # Authentification JWT
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Apps métier
    path('api/users/', include('apps.users.urls')),
    path('api/roles/', include('apps.roles.urls')),
    path('api/sanctions/', include('apps.sanctions.urls')),
    path('api/cotisations/', include('apps.cotisations.urls')),
    path('api/calendrier/', include('apps.calendrier.urls')),
    path('api/annonces/', include('apps.annonces.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    path('api/activite/', include('apps.activite.urls')),
