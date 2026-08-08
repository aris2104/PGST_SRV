"""
Endpoint de rapport : renvoie les données complètes en JSON.
Le frontend les reçoit et génère le PDF via window.print() (zero dépendance
Python supplémentaire).

RapportNotifierView permet d'envoyer une notification push "RAPPORT_PDF" :
au clic, le service worker ouvre directement /rapport?auto=1, qui déclenche
l'export PDF automatiquement dès que les données sont chargées — ça marche
même si l'app était complètement fermée, sans avoir besoin de générer un
fichier PDF côté serveur.
"""
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


class CanVoirRapport(permissions.BasePermission):
    """Président, Secrétaire, Trésorier, Admin — cohérent avec la route frontend /rapport."""
    def has_permission(self, request, view):
        return _has_role(request.user, *ROLES_AUTORISES_RAPPORT)


class RapportCompletView(APIView):
    """
    GET /api/activite/rapport/
    Renvoie les données brutes pour les 4 sections PDF :
    cotisations du mois, sanctions actives, présences, mouvements de caisse.
    """
    permission_classes = [permissions.IsAuthenticated, CanVoirRapport]

    def get(self, request):
        from datetime import date
        aujourd_hui = date.today()

        cotisations = (
            Cotisation.objects
            .filter(annee=aujourd_hui.year, mois=aujourd_hui.month)
            .select_related('servant')
            .values('servant__nom', 'servant__prenom', 'numero_semaine', 'statut', 'montant')
        )

        sanctions = (
            Sanction.objects
            .filter(statut='ACTIVE')
            .select_related('servant', 'decidee_par')
            .values('servant__nom', 'servant__prenom', 'type_sanction', 'motif', 'date_decision')
        )

        presences = (
            Presence.objects
            .select_related('servant', 'ordre_du_jour')
            .filter(ordre_du_jour__date__year=aujourd_hui.year)
            .values('servant__nom', 'servant__prenom', 'ordre_du_jour__date', 'statut')
        )

        mouvements = (
            MouvementCaisse.objects
            .select_related('initiee_par')
            .values('type_mouvement', 'montant', 'motif', 'date', 'initiee_par__nom', 'initiee_par__prenom')
        )

        return Response({
            'genere_le': aujourd_hui.isoformat(),
            'cotisations': list(cotisations),
            'sanctions_actives': list(sanctions),
            'presences': list(presences),
            'mouvements': list(mouvements),
        })


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