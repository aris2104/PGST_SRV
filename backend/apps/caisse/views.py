from django.utils import timezone
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.users.models import User
from utils.permissions import IsAdmin, IsPresiOrSecretary, _has_role
from .models import MouvementCaisse, ConfirmationMouvement
from .serializers import MouvementCaisseSerializer, ConfirmationSerializer

# Rôles "bureau" qui reçoivent une demande de confirmation pour chaque sortie.
ROLES_BUREAU = {'PRESIDENT', 'SECRETAIRE', 'DISCIPLINAIRE', 'ORGANISATEUR', 'CEREMONIAIRE', 'ADMIN', 'SUPER_ADMIN'}


class CanGererCaisse(permissions.BasePermission):
    """Trésorier ou Admin : créer/modifier un mouvement de caisse."""
    def has_permission(self, request, view):
        return _has_role(request.user, 'TRESORIER', 'ADMIN')


class IsBureau(permissions.BasePermission):
    """
    Tout rôle responsable (pas un simple Servant) : consulter les mouvements.
    Le Conseiller voit tout comme les autres (sauf les logs, gérés à part).
    """
    def has_permission(self, request, view):
        return _has_role(
            request.user,
            'PRESIDENT', 'SECRETAIRE', 'TRESORIER', 'DISCIPLINAIRE',
            'ORGANISATEUR', 'CEREMONIAIRE', 'CONSEILLER', 'ADMIN',
        )


def _creer_confirmations(mouvement, initiateur):
    """
    Pour une sortie de fonds, crée une ligne ConfirmationMouvement EN_ATTENTE
    pour chaque membre du bureau actif, SAUF l'initiateur lui-même
    (il n'a pas à se confirmer lui-même).
    """
    membres_bureau = User.objects.filter(
        is_active=True,
        role__code__in=ROLES_BUREAU,
    ).exclude(pk=initiateur.pk)

    ConfirmationMouvement.objects.bulk_create([
        ConfirmationMouvement(mouvement=mouvement, membre=m)
        for m in membres_bureau
    ])


class MouvementCaisseViewSet(viewsets.ModelViewSet):
    """
    GET    /api/caisse/mouvements/           -> liste tous les mouvements (bureau)
    POST   /api/caisse/mouvements/           -> créer un mouvement (Trésorier/Admin)
    GET    /api/caisse/mouvements/<id>/      -> détail
    POST   /api/caisse/mouvements/<id>/statuer/  -> Confirmer ou Décliner une sortie
    GET    /api/caisse/mouvements/mes_confirmations/  -> mes sorties en attente de décision
    """
    serializer_class = MouvementCaisseSerializer

    def get_permissions(self):
        # Créer/modifier un mouvement : Trésorier (c'est son rôle premier) ou Admin.
        # Bug corrigé : IsPresiOrSecretary ne couvrait pas TRESORIER, ce qui bloquait
        # la création de mouvement pour la personne censée l'utiliser le plus.
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), CanGererCaisse()]
        # Lecture (liste/détail/mes_confirmations) : tout le bureau, pour voir la trace.
        return [permissions.IsAuthenticated(), IsBureau()]

    def get_queryset(self):
        return (
            MouvementCaisse.objects
            .select_related('initiee_par')
            .prefetch_related('confirmations__membre')
            .all()
        )

    def perform_create(self, serializer):
        mouvement = serializer.save(initiee_par=self.request.user)
        # Les entrées diverses sont enregistrées directement, sans workflow.
        # Pour les sorties, on notifie le reste du bureau.
        if mouvement.type_mouvement == MouvementCaisse.Type.SORTIE:
            _creer_confirmations(mouvement, self.request.user)

    @action(detail=False, methods=['get'], url_path='mes_confirmations')
    def mes_confirmations(self, request):
        """
        Retourne les sorties de fonds où le membre connecté n'a pas encore statué.
        C'est la liste qui alimente la cloche de notifications.
        """
        confs = (
            ConfirmationMouvement.objects
            .filter(membre=request.user, decision='EN_ATTENTE')
            .select_related('mouvement__initiee_par')
            .prefetch_related('mouvement__confirmations__membre')
        )
        data = []
        for c in confs:
            mouvement_data = MouvementCaisseSerializer(c.mouvement).data
            mouvement_data['ma_confirmation_id'] = c.id
            data.append(mouvement_data)
        return Response(data)

    @action(detail=True, methods=['post'], url_path='statuer')
    def statuer(self, request, pk=None):
        """
        POST /api/caisse/mouvements/<id>/statuer/
        Body : { "decision": "CONFIRME" | "DECLINE" }
        Le membre connecté statue sur la sortie. Il ne peut statuer qu'une seule
        fois, et uniquement s'il fait partie des destinataires.
        """
        mouvement = self.get_object()

        if mouvement.type_mouvement != MouvementCaisse.Type.SORTIE:
            raise ValidationError("On ne statue que sur les sorties de fonds.")

        decision = request.data.get('decision')
        if decision not in ('CONFIRME', 'DECLINE'):
            raise ValidationError("La décision doit être 'CONFIRME' ou 'DECLINE'.")

        try:
            confirmation = ConfirmationMouvement.objects.get(
                mouvement=mouvement, membre=request.user
            )
        except ConfirmationMouvement.DoesNotExist:
            raise PermissionDenied("Tu n'es pas désigné pour statuer sur ce mouvement.")

        if confirmation.decision != 'EN_ATTENTE':
            raise ValidationError("Tu as déjà statué sur ce mouvement.")

        confirmation.decision = decision
        confirmation.date_decision = timezone.now()
        confirmation.save()

        # Important : mouvement vient de get_object() avec prefetch_related sur
        # 'confirmations', mis en cache AVANT la sauvegarde ci-dessus. Sans ce
        # refetch, la réponse renverrait encore l'ancien statut (EN_ATTENTE).
        mouvement.refresh_from_db()
        mouvement = (
            MouvementCaisse.objects
            .select_related('initiee_par')
            .prefetch_related('confirmations__membre')
            .get(pk=mouvement.pk)
        )

        return Response(MouvementCaisseSerializer(mouvement).data)

    @action(detail=False, methods=['get'], url_path='solde')
    def solde(self, request):
        """
        GET /api/caisse/mouvements/solde/

        Source de vérité UNIQUE pour le solde de la caisse — pour ne plus
        avoir 3 écrans (dashboard Trésorier, Mouvements, Caisse Admin) qui
        recalculent chacun le même total à leur façon, avec le risque que
        l'un d'eux oublie une source d'argent.

        Le solde inclut TOUT ce qui entre réellement dans la caisse :
          - les mouvements ENTREE (dons, subventions...)
          - les cotisations hebdomadaires marquées PAYE
          - les amendes marquées payées (Sanction.amende_payee) — leur
            montant est dupliqué dans un MouvementCaisse ENTREE au moment
            où le Trésorier les encaisse (voir sanctions/views.py), donc
            elles sont déjà comptées via les mouvements ci-dessus : pas de
            double-comptage ici.
          - moins les sorties CONFIRME (une sortie en attente ou déclinée
            ne doit pas réduire le solde affiché).
        """
        from apps.cotisations.models import Cotisation

        total_entrees_mouvements = MouvementCaisse.objects.filter(
            type_mouvement=MouvementCaisse.Type.ENTREE
        ).aggregate(total=models.Sum('montant'))['total'] or 0

        # Seules les sorties confirmées par le bureau sortent réellement de
        # la caisse — 'statut_global' est une propriété calculée en Python
        # (pas un champ stocké), donc on ne peut pas la filtrer en SQL.
        sorties_qs = MouvementCaisse.objects.filter(
            type_mouvement=MouvementCaisse.Type.SORTIE
        ).prefetch_related('confirmations')
        total_sorties = sum(
            float(m.montant) for m in sorties_qs if m.statut_global == 'CONFIRME'
        )

        total_cotisations = Cotisation.objects.filter(
            statut=Cotisation.Statut.PAYE
        ).aggregate(total=models.Sum('montant'))['total'] or 0

        total_entrees = float(total_entrees_mouvements) + float(total_cotisations)
        solde = total_entrees - total_sorties

        return Response({
            'total_entrees': total_entrees,
            'total_entrees_mouvements': float(total_entrees_mouvements),
            'total_cotisations': float(total_cotisations),
            'total_sorties': total_sorties,
            'solde': solde,
        })