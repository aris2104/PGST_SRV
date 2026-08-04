from rest_framework.routers import DefaultRouter
from .views import MesseViewSet, OrdreDuJourViewSet, PresenceViewSet

router = DefaultRouter()
router.register('messes', MesseViewSet, basename='messe')
router.register('ordre-du-jour', OrdreDuJourViewSet, basename='ordredujour')
router.register('presences', PresenceViewSet, basename='presence')

urlpatterns = router.urls