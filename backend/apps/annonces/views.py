from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from utils.notifications import envoyer_notification_push
from utils.permissions import IsPresiOrSecretary, _has_role
from .models import Annonce
from .serializers import AnnonceSerializer

User = get_user_model()


class AnnonceViewSet(viewsets.ModelViewSet):
    """
    GET /api/annonces/         -> fil PERSONNEL : annonces générales + celles ME ciblant moi,
                                   pour TOUT LE MONDE y compris le bureau (une annonce "pour
                                   toi" reste privée entre l'auteur et le destinataire).
    GET /api/annonces/toutes/  -> vue de supervision (Admin) : absolument toutes les annonces,
                                   y compris celles ciblées vers d'autres — utilisée par
                                   l'écran "Programme & Annonces", pas par le fil personnel.
    POST /api/annonces/        -> publier une annonce (Président/Secrétaire/Admin)
    """
    serializer_class = AnnonceSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            Annonce.objects
            .select_related('publiee_par')
            .prefetch_related('destinataires')
            .filter(Q(portee=Annonce.Portee.GENERALE) | Q(destinataires=user))
            .distinct()
        )

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsPresiOrSecretary()]
        if self.action == 'toutes':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='toutes')
    def toutes(self, request):
        if not _has_role(request.user, 'ADMIN'):
            return Response(
                {'detail': "Réservé à l'administrateur."},
                status=403,
            )
        qs = Annonce.objects.select_related('publiee_par').prefetch_related('destinataires')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        annonce = serializer.save(publiee_par=self.request.user)

        # Troncature propre du message
        body_text = annonce.contenu[:100] + '...' if len(annonce.contenu) > 100 else annonce.contenu
        title_text = getattr(annonce, 'titre', 'Nouvelle annonce')

        # 1. Cas d'une annonce ciblée (un ou plusieurs destinataires)
        if annonce.destinataires.exists():
            for destinataire in annonce.destinataires.all():
                envoyer_notification_push(
                    servant=destinataire,
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