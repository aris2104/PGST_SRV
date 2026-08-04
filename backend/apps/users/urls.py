from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import MeView, UserViewSet, NotificationPreferenceView, ChangePasswordView

router = DefaultRouter()
router.register('', UserViewSet, basename='user')

urlpatterns = [
    # IMPORTANT : ces chemins fixes doivent rester avant les urls du router,
    # sinon le router interprète 'me', 'notifications-preferences', etc.
    # comme des <pk> et intercepte la requête en premier.
    path('me/', MeView.as_view(), name='user-me'),
    path('notifications-preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
    path('changer-mot-de-passe/', ChangePasswordView.as_view(), name='change-password'),
] + router.urls