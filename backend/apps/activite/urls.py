from django.urls import path
from .views import ActiviteRecenteView
from .rapport import RapportCompletView, RapportNotifierView

urlpatterns = [
    path('recente/', ActiviteRecenteView.as_view(), name='activite-recente'),
    path('rapport/', RapportCompletView.as_view(), name='rapport-complet'),
    path('rapport/notifier/', RapportNotifierView.as_view(), name='rapport-notifier'),
]