from django.db.models import Q
from rest_framework import viewsets, permissions
from utils.permissions import IsPresiOrSecretary
from .models import Annonce
from .serializers import AnnonceSerializer


class AnnonceViewSet(viewsets.ModelViewSet):
    """
    GET /api/annonces/  -> fil d'accueil : annonces générales + celles ciblant l'utilisateur
    POST /api/annonces/ -> publier une annonce (Président/Secrétaire/Admin)
    """
    serializer_class = AnnonceSerializer

    def get_queryset(self):
        user = self.request.user
        base = Annonce.objects.select_related('publiee_par', 'destinataire')
        is_privileged = user.is_staff or (
            user.role and user.role.code in ('PRESIDENT', 'SECRETAIRE', 'ADMIN')
        )
        if is_privileged:
            return base
        return base.filter(Q(portee=Annonce.Portee.GENERALE) | Q(destinataire=user))

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsPresiOrSecretary()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(publiee_par=self.request.user)