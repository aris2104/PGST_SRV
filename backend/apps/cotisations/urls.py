from rest_framework.routers import DefaultRouter
from .views import CotisationViewSet

router = DefaultRouter()
router.register('', CotisationViewSet, basename='cotisation')

urlpatterns = router.urls
