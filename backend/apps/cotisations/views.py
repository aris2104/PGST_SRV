from datetime import date
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cotisation
from .serializers import CotisationSerializer
from .services import assurer_cotisations_dues, assurer_cotisations_dues_pour_tous
from utils.permissions import is_admin_user


class IsTresorierOrReadOnlyOwn(permissions.BasePermission):
    """
    - Lecture : tout le monde authentifié (filtré à ses propres cotisations
      pour un non-privilégié, voir get_queryset).
    - Écriture (POST/PATCH) : Trésorier ou Admin.
    - MAIS une cotisation déjà marquée PAYE devient irréversible pour le
      Trésorier : seul l'Admin peut encore la corriger ou la supprimer
      (voir has_object_permission). "Marquer payé" (IMPAYE -> PAYE) reste
      l'action normale d'enregistrement et n'est donc pas bloquée.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        is_admin = is_admin_user(user)
        is_tresorier = bool(user.role and user.role.code == 'TRESORIER')
        return is_admin or is_tresorier

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        is_admin = is_admin_user(user)
        if is_admin:
            return True
        # Suppression : jamais pour le Trésorier, seulement pour l'Admin.
        if request.method == 'DELETE':
            return False
        # Modification : autorisée pour le Trésorier uniquement tant que la
        # cotisation n'est pas encore payée (c'est l'enregistrement normal).
        # Une fois PAYE, c'est définitif de son côté.
        return obj.statut != Cotisation.Statut.PAYE


class CotisationViewSet(viewsets.ModelViewSet):
    """
    GET /api/cotisations/?annee=2026&mois=8   -> détail 'Ma cotisation' (écran maquette 6)
    GET /api/cotisations/resume/              -> pour l'écran 'Suivis' (barre de progression)
    """
    serializer_class = CotisationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTresorierOrReadOnlyOwn]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['servant', 'annee', 'mois', 'statut']

    def get_queryset(self):
        user = self.request.user
        # Auto-génère (si besoin) les lignes IMPAYE des semaines dues, sans
        # dépendre d'une tâche planifiée externe. Voir services.py.
        is_privileged = user.is_staff or (
            user.role and user.role.code in ('TRESORIER', 'ADMIN', 'SUPER_ADMIN', 'CONSEILLER')
        )
        if is_privileged:
            assurer_cotisations_dues_pour_tous()
        else:
            assurer_cotisations_dues(user)

        qs = Cotisation.objects.select_related('servant')
        # Le Conseiller voit tout (sauf les logs, gérés ailleurs) sans pour
        # autant pouvoir enregistrer un paiement : c'est un droit de lecture.
        if not is_privileged:
            qs = qs.filter(servant=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(enregistree_par=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        devient_paye = (
            serializer.validated_data.get('statut') == Cotisation.Statut.PAYE
            and instance.statut != Cotisation.Statut.PAYE
        )
        extra = {'enregistree_par': self.request.user}
        if devient_paye and not instance.date_paiement:
            extra['date_paiement'] = date.today()
        serializer.save(**extra)

    @action(detail=False, methods=['get'])
    def resume(self, request):
        """Progression du mois en cours + cumul annuel (X/48 semaines payées)."""
        # Même logique d'auto-génération que get_queryset : cette action
        # personnalisée ne passe pas par get_queryset, donc on la répète ici.
        assurer_cotisations_dues(request.user)

        today = date.today()
        qs_mois = Cotisation.objects.filter(
            servant=request.user, annee=today.year, mois=today.month,
        )
        total_semaines_mois = qs_mois.count() or 1
        payees_mois = qs_mois.filter(statut=Cotisation.Statut.PAYE).count()

        qs_annee = Cotisation.objects.filter(servant=request.user, annee=today.year)
        payees_annee = qs_annee.filter(statut=Cotisation.Statut.PAYE).count()

        return Response({
            'mois_en_cours': {
                'payees': payees_mois,
                'total': total_semaines_mois,
                'pourcentage': round(payees_mois / total_semaines_mois * 100),
            },
            'cumul_annuel': {
                'payees': payees_annee,
                'total_attendu': 48,
            },
        })