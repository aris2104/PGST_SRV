from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Sanction
from .serializers import SanctionSerializer, SanctionCreateSerializer


class IsDisciplinaireOrReadOnlyOwn(permissions.BasePermission):
    """
    - Un servant peut uniquement lire ses propres sanctions.
    - Un responsable disciplinaire / admin peut tout lire et créer/modifier.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user and user.is_authenticated and
            (user.is_staff or (user.role and user.role.code in ('DISCIPLINAIRE', 'ADMIN')))
        )


class SanctionViewSet(viewsets.ModelViewSet):
    """
    GET /api/sanctions/                -> historique (filtré par servant si non-staff)
    GET /api/sanctions/?servant=<id>   -> historique d'un servant précis (staff/disciplinaire)
    GET /api/sanctions/actives/        -> résumé pour l'écran 'Suivis'
    POST /api/sanctions/               -> infliger une sanction (Disciplinaire/Admin)
    """
    serializer_class = SanctionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDisciplinaireOrReadOnlyOwn]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['servant', 'statut', 'type_sanction']

    def get_queryset(self):
        user = self.request.user
        qs = Sanction.objects.select_related('servant', 'decidee_par')
        is_privileged = user.is_staff or (user.role and user.role.code in ('DISCIPLINAIRE', 'ADMIN'))
        if not is_privileged:
            qs = qs.filter(servant=user)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return SanctionCreateSerializer
        return SanctionSerializer

    @action(detail=False, methods=['get'])
    def actives(self, request):
        """Résumé rapide pour la carte 'Sanctions' de l'écran Suivis."""
        qs = self.get_queryset().filter(servant=request.user, statut=Sanction.Statut.ACTIVE)
        return Response({
            'a_une_sanction_active': qs.exists(),
            'nombre': qs.count(),
            'sanctions': SanctionSerializer(qs, many=True).data,
        })
