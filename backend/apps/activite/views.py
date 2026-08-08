from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.sanctions.models import Sanction
from apps.cotisations.models import Cotisation
from apps.annonces.models import Annonce
from apps.calendrier.models import OrdreDuJour
from apps.support.models import Message
from apps.users.models import User
from utils.permissions import IsPresiOrSecretary

# Limite de sécurité par source, pour éviter une charge mémoire excessive si
# l'historique devient énorme un jour — bien au-delà d'un usage réaliste
# pour un seul groupe de servants, donc ça ne tronque rien "à l'oeil nu".
LIMITE_PAR_SOURCE = 500

PAGE_SIZE_DEFAUT = 30


class ActiviteRecenteView(APIView):
    """
    GET /api/activite/recente/?page=1&page_size=30
    Journal d'activité complet et paginé : sanctions, paiements de cotisations,
    annonces publiées, ordres du jour publiés, nouveaux membres, messages de
    support traités — fusionnés et triés du plus récent au plus ancien.

    NB architecture : c'est une agrégation de plusieurs tables métier, pas un
    modèle de log dédié. Ça reste correct et complet à l'échelle d'un seul
    groupe, mais toute nouvelle fonctionnalité doit être ajoutée ici à la main.
    Une vraie table `ActivityLog` alimentée par des signaux Django serait la
    version qui s'entretient toute seule si le projet grossit beaucoup.
    """
    permission_classes = [permissions.IsAuthenticated, IsPresiOrSecretary]

    def get(self, request):
        events = []

        sanctions = Sanction.objects.select_related('servant', 'decidee_par').order_by('-created_at')[:LIMITE_PAR_SOURCE]
        for s in sanctions:
            events.append({
                'type': 'sanction',
                'date': s.created_at,
                'titre': f"Sanction : {s.get_type_sanction_display()}",
                'description': f"{s.servant.nom_complet} — {s.motif[:80]}",
                'auteur': s.decidee_par.nom_complet if s.decidee_par else None,
            })

        paiements = (
            Cotisation.objects.filter(statut=Cotisation.Statut.PAYE, date_paiement__isnull=False)
            .select_related('servant', 'enregistree_par')
            .order_by('-date_paiement')[:LIMITE_PAR_SOURCE]
        )
        for c in paiements:
            events.append({
                'type': 'cotisation',
                'date': c.date_paiement,
                'titre': f"Cotisation semaine {c.numero_semaine} payée",
                'description': f"{c.servant.nom_complet} — {c.mois}/{c.annee}",
                'auteur': c.enregistree_par.nom_complet if c.enregistree_par else None,
            })

        annonces = Annonce.objects.select_related('publiee_par').order_by('-date_publication')[:LIMITE_PAR_SOURCE]
        for a in annonces:
            events.append({
                'type': 'annonce',
                'date': a.date_publication,
                'titre': a.titre or 'Annonce publiée',
                'description': a.contenu[:80],
                'auteur': a.publiee_par.nom_complet if a.publiee_par else None,
            })

        ordres_du_jour = OrdreDuJour.objects.select_related('cree_par').exclude(created_at__isnull=True).order_by('-created_at')[:LIMITE_PAR_SOURCE]
        for o in ordres_du_jour:
            events.append({
                'type': 'ordre_du_jour',
                'date': o.created_at,
                'titre': f"Ordre du jour publié : {o.titre}",
                'description': f"Réunion du {o.date}",
                'auteur': o.cree_par.nom_complet if o.cree_par else None,
            })

        nouveaux_membres = User.objects.select_related('role').order_by('-date_joined')[:LIMITE_PAR_SOURCE]
        for u in nouveaux_membres:
            events.append({
                'type': 'membre',
                'date': u.date_joined,
                'titre': 'Nouveau membre',
                'description': f"{u.nom_complet} ({u.role.libelle if u.role else 'aucun rôle'})",
                'auteur': None,
            })

        messages_traites = (
            Message.objects.filter(traite=True)
            .select_related('auteur', 'repondu_par')
            .order_by('-updated_at')[:LIMITE_PAR_SOURCE]
        )
        for m in messages_traites:
            events.append({
                'type': 'message',
                'date': m.updated_at,
                'titre': f"Réponse envoyée : {m.sujet}",
                'description': f"À {m.auteur.nom_complet}",
                'auteur': m.repondu_par.nom_complet if m.repondu_par else None,
            })

        events.sort(key=lambda e: str(e['date']), reverse=True)

        # Pagination simple sur la liste fusionnée (les sources sont hétérogènes,
        # donc pas de pagination SQL directe possible ici).
        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except ValueError:
            page = 1
        try:
            page_size = min(100, max(1, int(request.query_params.get('page_size', PAGE_SIZE_DEFAUT))))
        except ValueError:
            page_size = PAGE_SIZE_DEFAUT

        debut = (page - 1) * page_size
        fin = debut + page_size

        return Response({
            'count': len(events),
            'page': page,
            'page_size': page_size,
            'has_next': fin < len(events),
            'results': events[debut:fin],
        })