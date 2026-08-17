from datetime import date, datetime, timedelta
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from utils.permissions import (
    IsAdmin,
    IsOrganisateur,
    IsPresiOrCeremoniaire,
    IsPresiOrSecretary,
    dans_la_fenetre_de_modification,
    is_admin_user,
    _has_role,
)

from .models import Messe, OrdreDuJour, Presence
from .serializers import (
    MesseSerializer,
    OrdreDuJourSerializer,
    PresenceSerializer,
)

User = get_user_model()

MESSAGE_HORS_FENETRE = (
    "Cette réunion date de plus de 7 jours : il n'est plus possible d'y "
    "toucher. Seul un administrateur peut encore corriger."
)


class MesseViewSet(viewsets.ModelViewSet):
    """
    GET /api/calendrier/messes/?semaine=courante -> écran Calendrier
    Écriture réservée au Président/Cérémoniaire/Admin : c'est le
    Cérémoniaire (ou le Président) qui choisit quel servant officie à
    quelle messe.

    Fenêtre de modification : comme pour l'appel, une messe reste
    modifiable pendant 7 jours après sa date, puis se verrouille pour tout
    le monde sauf l'Admin (voir dans_la_fenetre_de_modification).
    """

    queryset = Messe.objects.prefetch_related('servants').all()
    serializer_class = MesseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['date', 'type_messe']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsPresiOrCeremoniaire()]
        return [permissions.IsAuthenticated()]

    def _verifier_fenetre(self, messe_date):
        if not dans_la_fenetre_de_modification(messe_date, self.request.user):
            raise PermissionDenied(MESSAGE_HORS_FENETRE)

    def perform_create(self, serializer):
        self._verifier_fenetre(serializer.validated_data.get('date'))
        serializer.save()

    def perform_update(self, serializer):
        self._verifier_fenetre(self.get_object().date)
        serializer.save()

    def perform_destroy(self, instance):
        self._verifier_fenetre(instance.date)
        instance.delete()

    def _get_week_bounds(self, request):
        """Calcule les dates de début (lundi) et de fin (dimanche) de la semaine.

        Prend en compte le paramètre d'URL `?date=YYYY-MM-DD` si fourni.
        """
        date_param = request.query_params.get('date')
        if date_param:
            try:
                ref_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                ref_date = date.today()
        else:
            ref_date = date.today()

        debut = ref_date - timedelta(days=ref_date.weekday())
        fin = debut + timedelta(days=6)
        return debut, fin

    @action(detail=False, methods=['get'])
    def cette_semaine(self, request):
        """Bloc 'Programme de cette semaine' (ou de la semaine sélectionnée) de l'écran Calendrier."""
        debut, fin = self._get_week_bounds(request)
        qs = self.get_queryset().filter(date__range=[debut, fin])
        return Response(MesseSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def mes_messes(self, request):
        """Bloc 'Mes messes cette semaine' (ou de la semaine sélectionnée) de l'écran Calendrier."""
        debut, fin = self._get_week_bounds(request)
        qs = self.get_queryset().filter(
            date__range=[debut, fin], servants=request.user
        )
        return Response(MesseSerializer(qs, many=True).data)


class OrdreDuJourViewSet(viewsets.ModelViewSet):
    """Écriture réservée à l'Organisateur/Admin : c'est son seul rôle exclusif."""

    queryset = OrdreDuJour.objects.all()
    serializer_class = OrdreDuJourSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsOrganisateur()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


class PresenceViewSet(viewsets.ModelViewSet):
    """GET /api/calendrier/presences/resume/  -> pour l'écran Suivis

    Écriture (faire l'appel, corriger) réservée au Président/Secrétaire,
    dans une fenêtre de 7 jours après la date de la réunion (voir
    dans_la_fenetre_de_modification). Au-delà, seul l'Admin peut agir.
    """

    queryset = Presence.objects.select_related('servant', 'ordre_du_jour')
    serializer_class = PresenceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['servant', 'ordre_du_jour', 'present', 'statut']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'enregistrer_appel'):
            return [permissions.IsAuthenticated(), IsPresiOrSecretary()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # FAILLE CORRIGÉE : sans ce filtre, n'importe quel Servant
        # authentifié pouvait lister les présences de TOUS les membres
        # (GET /api/calendrier/presences/ sans restriction). Un simple
        # Servant ne doit voir que ses propres présences ; les rôles
        # "bureau" (qui gèrent déjà l'appel/le suivi) voient tout.
        qs = super().get_queryset()
        user = self.request.user
        if is_admin_user(user) or _has_role(
            user,
            'PRESIDENT', 'SECRETAIRE', 'TRESORIER', 'DISCIPLINAIRE',
            'ORGANISATEUR', 'CEREMONIAIRE', 'CONSEILLER',
        ):
            return qs
        return qs.filter(servant=user)

    def _verifier_fenetre(self, odj_date):
        if not dans_la_fenetre_de_modification(odj_date, self.request.user):
            raise PermissionDenied(MESSAGE_HORS_FENETRE)

    def perform_create(self, serializer):
        odj = serializer.validated_data.get('ordre_du_jour')
        self._verifier_fenetre(getattr(odj, 'date', None))
        serializer.save(
            enregistree_par=self.request.user if self.request.user.is_authenticated else None
        )

    def perform_update(self, serializer):
        self._verifier_fenetre(self.get_object().ordre_du_jour.date)
        serializer.save()

    def perform_destroy(self, instance):
        self._verifier_fenetre(instance.ordre_du_jour.date)
        instance.delete()

    @action(detail=False, methods=['get'])
    def servants(self, request):
        """Retourne la liste de tous les servants/membres actifs de manière sécurisée."""
        users = User.objects.filter(is_active=True)
        data = []
        for u in users:
            nom = getattr(u, 'nom', '') or getattr(u, 'last_name', '')
            prenom = getattr(u, 'prenom', '') or getattr(u, 'first_name', '')
            username = getattr(u, 'username', '')

            full_name = f'{prenom} {nom}'.strip() or username or str(u)

            data.append({
                'id': u.id,
                'nom_complet': full_name,
                'username': username,
            })

        data.sort(key=lambda x: x['nom_complet'].lower())
        return Response(data)

    @action(detail=False, methods=['get'])
    def resume(self, request):
        """Bloc 'Présence aux réunions' de l'écran Suivis."""
        user = request.user
        today = date.today()

        dernieres_reunions = OrdreDuJour.objects.filter(
            date__lte=today
        ).order_by('-date')[:5]
        presences_recentes = Presence.objects.filter(
            servant=user,
            ordre_du_jour__in=dernieres_reunions,
            present=True,
        ).count()

        reunions_annee = OrdreDuJour.objects.filter(
            date__year=today.year, date__lte=today
        )
        presences_annee = Presence.objects.filter(
            servant=user,
            ordre_du_jour__in=reunions_annee,
            present=True,
        ).count()

        return Response({
            'dernieres_reunions': {
                'presentes': presences_recentes,
                'total': dernieres_reunions.count(),
            },
            'cumul_annuel': {
                'presentes': presences_annee,
                'total': reunions_annee.count(),
            },
        })

    @action(detail=False, methods=['post'])
    def enregistrer_appel(self, request):
        """Enregistrement de l'appel complet par le Président ou Secrétaire.

        Payload attendu:
        {
            "ordre_du_jour": ID,
            "presences": { "servant_id": "PRESENT" | "RETARD" | "PERMISSION" | "ABSENT" }
        }
        """
        odj_id = request.data.get('ordre_du_jour')
        presences_dict = request.data.get('presences') or request.data.get('presenceMap') or {}

        if not odj_id:
            return Response(
                {'error': "L'ordre du jour est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            odj = OrdreDuJour.objects.get(id=odj_id)
        except OrdreDuJour.DoesNotExist:
            return Response(
                {'error': 'Ordre du jour introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Fenêtre de modification : l'appel reste modifiable/refaisable
        # pendant 7 jours après la date de la réunion, puis se verrouille —
        # sauf pour l'Admin, qui garde toujours la main pour corriger.
        if not dans_la_fenetre_de_modification(odj.date, request.user):
            return Response(
                {'error': MESSAGE_HORS_FENETRE},
                status=status.HTTP_403_FORBIDDEN,
            )

        records = []
        for servant_id, val in presences_dict.items():
            # Convertit ou nettoie la valeur de statut
            if isinstance(val, bool):
                statut_val = (
                    Presence.StatutPresence.PRESENT
                    if val
                    else Presence.StatutPresence.ABSENT
                )
            elif isinstance(val, str):
                statut_val = val.upper().strip()
                if statut_val not in Presence.StatutPresence.values:
                    statut_val = Presence.StatutPresence.PRESENT
            else:
                statut_val = Presence.StatutPresence.PRESENT

            presence_obj, _ = Presence.objects.update_or_create(
                ordre_du_jour=odj,
                servant_id=servant_id,
                defaults={
                    'statut': statut_val,
                    'enregistree_par': request.user if request.user.is_authenticated else None,
                },
            )
            records.append(presence_obj.id)

        return Response({
            'message': 'Présences enregistrées avec succès',
            'count': len(records),
        })