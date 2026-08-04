from django.urls import path
from .views import ActiviteRecenteView

urlpatterns = [
    path('recente/', ActiviteRecenteView.as_view(), name='activite-recente'),
]