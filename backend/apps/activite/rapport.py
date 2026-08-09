"""
Endpoint de rapport : renvoie les données complètes en JSON, filtrables.
Le frontend les reçoit et génère le PDF via window.print() (zero dépendance
Python supplémentaire).

RapportNotifierView permet d'envoyer une notification push "RAPPORT_PDF" :
au clic, le service worker ouvre directement /rapport?auto=1, qui déclenche
l'export PDF automatiquement dès que les données sont chargées — ça marche
même si l'app était complètement fermée, sans avoir besoin de générer un
fichier PDF côté serveur.
"""
from datetime import date, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from utils.permissions import _has_role
from utils.notifications import envoyer_notification_push
from apps.sanctions.models import Sanction
from apps.cotisations.models import Cotisation
from apps.calendrier.models import Presence
from apps.caisse.models import MouvementCaisse

ROLES_AUTORISES_RAPPORT = ('PRESIDENT', 'SECRETAIRE', 'TRESORIER', 'ADMIN')
TOUTES_LES_SECTIONS = {'cotisations', 'sanctions', 'presences', 'mouvements'}


class CanVoirRapport(permissions.BasePermission):
    """Président, Secrétaire, Trésorier, Admin — cohérent avec la route frontend /rapport."""
    def has_permission(self, request, view):
        return _has_role(request.user, *ROLES_AUTORISES_RAPPORT)


def _parse_date(valeur, defaut):
    if not valeur:
        return defaut
    try:
        return date.fromisoformat(valeur)
    except ValueError:
        return defaut


class RapportCompletView(APIView):
    """
    GET /api/activite/rapport/
    Paramètres de filtre (tous optionnels) :
      - date_debut, date_fin (YYYY-MM-DD) : par défaut, le mois en cours
      - servant : ID d'un servant précis, pour un rapport individuel
      - sections : liste séparée par des virgules parmi
        cotisations,sanctions,presences,mouvements (par défaut : toutes)
      - sanctions_statut : ACTIVE (défaut) ou TOUS
    """
    permission_classes = [permissions.IsAuthenticated, CanVoirRapport]

    def get(self, request):
        aujourd_hui = date.today()
        premier_du_mois = aujourd_hui.replace(day=1)

        date_debut = _parse_date(request.query_params.get('date_debut'), premier_du_mois)
        date_fin = _parse_date(request.query_params.get('date_fin'), aujourd_hui)

        servant_id = request.query_params.get('servant') or None

        sections_param = request.query_params.get('sections')
        sections = (
            {s.strip() for s in sections_param.split(',') if s.strip()}
            if sections_param else TOUTES_LES_SECTIONS
        )
        sections &= TOUTES_LES_SECTIONS  # ignore toute valeur inconnue

        sanctions_statut = request.query_params.get('sanctions_statut', 'ACTIVE')

        data = {
            'genere_le': aujourd_hui.isoformat(),
            'filtres': {
                'date_debut': date_debut.isoformat(),
                'date_fin': date_fin.isoformat(),
                'servant': servant_id,
                'sections': sorted(sections),
            },
        }

        if 'cotisations' in sections:
            qs = (
                Cotisation.objects
                .filter(date_debut_semaine__gte=date_debut, date_debut_semaine__lte=date_fin)
                .select_related('servant')
            )
            if servant_id:
                qs = qs.filter(servant_id=servant_id)
            data['cotisations'] = list(
                qs.values('servant__nom', 'servant__prenom', 'numero_semaine', 'statut', 'montant')
            )
        else:
            data['cotisations'] = []

        if 'sanctions' in sections:
            qs = Sanction.objects.filter(date_decision__gte=date_debut, date_decision__lte=date_fin)
            if sanctions_statut != 'TOUS':
                qs = qs.filter(statut=sanctions_statut)
            if servant_id:
                qs = qs.filter(servant_id=servant_id)
            data['sanctions_actives'] = list(
                qs.select_related('servant', 'decidee_par')
                .values('servant__nom', 'servant__prenom', 'type_sanction', 'motif', 'date_decision')
            )
        else:
            data['sanctions_actives'] = []

        if 'presences' in sections:
            qs = (
                Presence.objects
                .filter(ordre_du_jour__date__gte=date_debut, ordre_du_jour__date__lte=date_fin)
                .select_related('servant', 'ordre_du_jour')
            )
            if servant_id:
                qs = qs.filter(servant_id=servant_id)
            data['presences'] = list(
                qs.values('servant__nom', 'servant__prenom', 'ordre_du_jour__date', 'statut')
            )
        else:
            data['presences'] = []

        if 'mouvements' in sections:
            qs = MouvementCaisse.objects.filter(date__gte=date_debut, date__lte=date_fin)
            if servant_id:
                qs = qs.filter(initiee_par_id=servant_id)
            data['mouvements'] = list(
                qs.select_related('initiee_par')
                .values('type_mouvement', 'montant', 'motif', 'date', 'initiee_par__nom', 'initiee_par__prenom')
            )
        else:
            data['mouvements'] = []

        return Response(data)


class RapportNotifierView(APIView):
    """
    POST /api/activite/rapport/notifier/
    Envoie une notification push "Rapport prêt" à l'utilisateur connecté,
    sur tous ses appareils abonnés. Au clic (même app fermée), ça ouvre
    directement /rapport?auto=1 qui déclenche le téléchargement du PDF.
    """
    permission_classes = [permissions.IsAuthenticated, CanVoirRapport]

    def post(self, request):
        envoyer_notification_push(
            servant=request.user,
            title='Rapport PGST prêt',
            body='Touche pour télécharger ton rapport complet.',
            url='/rapport?auto=1',
            type_notification='RAPPORT_PDF',
        )
        return Response({'statut': 'envoyé'})