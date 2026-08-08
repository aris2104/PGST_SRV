from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.users.models import User
from utils.permissions import IsAdmin, IsPresiOrSecretary
from .models import MouvementCaisse, ConfirmationMouvement
from .serializers import MouvementCaisseSerializer, ConfirmationSerializer

# Rôles "bureau" qui reçoivent une demande de confirmation pour chaque sortie.
ROLES_BUREAU = {'PRESIDENT', 'SECRETAIRE', 'DISCIPLINAIRE', 'ORGANISATEUR', 'ADMIN'}


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
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsPresiOrSecretary()]
        return [permissions.IsAuthenticated(), IsPresiOrSecretary()]

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
        confirmation.date_decision = datetime.now()
        confirmation.save()

        return Response(MouvementCaisseSerializer(mouvement).data)