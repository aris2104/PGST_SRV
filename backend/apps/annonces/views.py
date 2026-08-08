from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, viewsets
from utils.notifications import envoyer_notification_push
from utils.permissions import IsPresiOrSecretary
from .models import Annonce
from .serializers import AnnonceSerializer

User = get_user_model()


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
        annonce = serializer.save(publiee_par=self.request.user)

        # Troncature propre du message
        body_text = annonce.contenu[:100] + '...' if len(annonce.contenu) > 100 else annonce.contenu
        title_text = getattr(annonce, 'titre', 'Nouvelle annonce')

        # 1. Cas d'une annonce ciblée (un seul destinataire)
        if annonce.destinataire:
            envoyer_notification_push(
                servant=annonce.destinataire,
                title=title_text,
                body=body_text,
                url="/accueil",
            )
        # 2. Cas d'une annonce générale (diffusion à tous les utilisateurs actifs sauf l'auteur)
        else:
            destinataires = User.objects.filter(is_active=True).exclude(id=self.request.user.id)
            for destinataire in destinataires:
                envoyer_notification_push(
                    servant=destinataire,
                    title=title_text,
                    body=body_text,
                    url="/accueil",
                )