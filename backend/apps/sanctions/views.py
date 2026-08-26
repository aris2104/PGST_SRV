from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Sanction
from .serializers import SanctionSerializer, SanctionCreateSerializer
from utils.permissions import is_admin_user


# Rôles habilités à infliger une sanction. Le Cérémoniaire gère aussi la
# discipline (il s'occupe du "côté messe"), et ce droit a été décentralisé
# au Président et au Secrétaire plutôt que réservé à un seul responsable.
# Le Conseiller a le même droit que ces trois rôles.
ROLES_SANCTIONNAIRES = ('DISCIPLINAIRE', 'CEREMONIAIRE', 'PRESIDENT', 'SECRETAIRE', 'CONSEILLER')


class IsDisciplinaireOrCeremoniaireOrAdminOrSuperAdminReadOnlyOwn(permissions.BasePermission):
    """
    - Un servant peut uniquement lire ses propres sanctions.
    - Président, Secrétaire, Cérémoniaire ou Disciplinaire peuvent lire et
      créer (infliger une sanction), mais pas modifier/supprimer : une fois
      créée, une sanction est définitive de leur côté (irréversible par
      principe).
    - L'Admin, lui, garde la main sur tout (y compris corriger/annuler une
      sanction), voir has_object_permission.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        is_admin = is_admin_user(user)
        is_super_admin = bool(user.role and user.role.code == 'SUPER_ADMIN')
        is_sanctionnaire = bool(user.role and user.role.code in ROLES_SANCTIONNAIRES)
        if request.method == 'POST':
            return is_admin or is_super_admin or is_sanctionnaire
        # PUT/PATCH/DELETE : seul l'Admin peut y accéder à ce stade ; les
        # autres rôles habilités sont filtrés ici, avant même d'atteindre un objet.
        return is_admin

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        is_admin = is_admin_user(user)
        # Redondant avec has_permission mais explicite : seul l'Admin peut
        # modifier/supprimer une sanction déjà créée.
        return is_admin


class SanctionViewSet(viewsets.ModelViewSet):
    """
    GET /api/sanctions/                -> historique (filtré par servant si non-staff)
    GET /api/sanctions/?servant=<id>   -> historique d'un servant précis (staff/disciplinaire)
    GET /api/sanctions/actives/        -> résumé pour l'écran 'Suivis'
    POST /api/sanctions/               -> infliger une sanction (Disciplinaire/Admin)
    PUT/PATCH/DELETE                   -> réservé à l'Admin (correction/annulation)

    Irréversible pour le Disciplinaire dès la création : seul l'Admin, qui
    coordonne l'ensemble de la plateforme, peut encore corriger ou annuler
    une sanction après coup.
    """
    serializer_class = SanctionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDisciplinaireOrCeremoniaireOrAdminOrSuperAdminReadOnlyOwn]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['servant', 'statut', 'type_sanction']

    def get_queryset(self):
        user = self.request.user
        qs = Sanction.objects.select_related('servant', 'decidee_par')
        # Le Trésorier a un accès lecture seule pour repérer les amendes à
        # encaisser (voir marquer_amende_payee) — il ne peut ni créer ni
        # modifier une sanction, juste consulter.
        is_privileged = user.is_staff or (
            user.role and user.role.code in ROLES_SANCTIONNAIRES + ('ADMIN', 'SUPER_ADMIN', 'TRESORIER')
        )
        if not is_privileged:
            qs = qs.filter(servant=user)
        elif not is_admin_user(user):
            # MODE FURTIF : les rôles privilégiés non-Admin (Disciplinaire,
            # Cérémoniaire, Président, Secrétaire, Conseiller, Trésorier)
            # voient toutes les sanctions SAUF celles des comptes
            # Admin/Super Admin. L'Admin, lui, voit tout.
            qs = qs.exclude(servant__role__code__in=['ADMIN', 'SUPER_ADMIN'])
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

    @action(detail=True, methods=['post'], url_path='marquer-amende-payee' , permission_classes = [permissions.IsAuthenticated])
    def marquer_amende_payee(self, request, pk=None):
        """
        POST /api/sanctions/<id>/marquer-amende-payee/

        Réservé au Trésorier/Admin : encaisser une amende. Crée une entrée
        de caisse (MouvementCaisse) pour que le montant compte réellement
        dans le solde — avant ça, une amende infligée n'avait aucun effet
        sur les calculs de caisse, même une fois payée.
        """
        from utils.permissions import _has_role
        from apps.caisse.models import MouvementCaisse

        if not _has_role(request.user, 'TRESORIER', 'ADMIN'):
            return Response(
                {'error': "Seul le Trésorier (ou l'Admin) peut encaisser une amende."},
                status=403,
            )

        sanction = self.get_object()
        if sanction.type_sanction != Sanction.TypeSanction.AMENDE or not sanction.montant:
            return Response(
                {'error': "Cette sanction n'est pas une amende avec un montant défini."},
                status=400,
            )
        if sanction.amende_payee:
            return Response(SanctionSerializer(sanction).data)  # déjà fait, idempotent

        sanction.amende_payee = True
        sanction.save(update_fields=['amende_payee'])

        MouvementCaisse.objects.create(
            type_mouvement=MouvementCaisse.Type.ENTREE,
            montant=sanction.montant,
            motif=f"Amende — {sanction.servant.nom_complet}",
            description=sanction.motif,
            date=sanction.date_decision,
            initiee_par=request.user,
        )

        return Response(SanctionSerializer(sanction).data)