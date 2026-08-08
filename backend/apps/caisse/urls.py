from rest_framework.routers import DefaultRouter
from .views import MouvementCaisseViewSet

router = DefaultRouter()
router.register(r'mouvements', MouvementCaisseViewSet, basename='mouvement-caisse')

urlpatterns = router.urls