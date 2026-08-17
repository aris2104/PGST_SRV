from datetime import date

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
from .models import JournalConnexion

# Limite de sécurité par source, pour éviter une charge mémoire excessive si
# l'historique devient énorme un jour — bien au-delà d'un usage réaliste
# pour un seul groupe de servants, donc ça ne tronque rien "à l'oeil nu".
LIMITE_PAR_SOURCE = 500

PAGE_SIZE_DEFAUT = 30

TOUS_LES_TYPES = {
    'sanction', 'cotisation', 'annonce', 'ordre_du_jour',
    'membre', 'message', 'connexion',
}


def _parse_date(valeur):
    if not valeur:
        return None
    try:
        return date.fromisoformat(valeur)
    except ValueError:
        return None


class ActiviteRecenteView(APIView):
    """
    GET /api/activite/recente/?page=1&page_size=30&date_debut=...&date_fin=...&types=sanction,connexion

    Journal d'activité complet, filtrable et paginé : sanctions, paiements de
    cotisations, annonces publiées, ordres du jour publiés, nouveaux membres,
    messages de support traités, ET connexions à l'app (réussies/échouées) —
    fusionnés et triés du plus récent au plus ancien.

    NB architecture : c'est une agrégation de plusieurs tables métier, pas un
    modèle de log dédié (sauf pour les connexions, qui ont leur propre table
    JournalConnexion). Toute nouvelle fonctionnalité doit être ajoutée ici à
    la main. Une vraie table `ActivityLog` alimentée par des signaux Django
    serait la version qui s'entretient toute seule si le projet grossit beaucoup.
    """
    permission_classes = [permissions.IsAuthenticated, IsPresiOrSecretary]

    def get(self, request):
        date_debut = _parse_date(request.query_params.get('date_debut'))
        date_fin = _parse_date(request.query_params.get('date_fin'))

        types_param = request.query_params.get('types')
        types_demandes = (
            {t.strip() for t in types_param.split(',') if t.strip()}
            if types_param else TOUS_LES_TYPES
        )
        types_demandes &= TOUS_LES_TYPES

        events = []

        if 'sanction' in types_demandes:
            qs = Sanction.objects.select_related('servant', 'decidee_par')
            if date_debut:
                qs = qs.filter(created_at__date__gte=date_debut)
            if date_fin:
                qs = qs.filter(created_at__date__lte=date_fin)
            for s in qs.order_by('-created_at')[:LIMITE_PAR_SOURCE]:
                events.append({
                    'type': 'sanction',
                    'date': s.created_at,
                    'titre': f"Sanction : {s.get_type_sanction_display()}",
                    'description': f"{s.servant.nom_complet} — {s.motif[:80]}",
                    'auteur': s.decidee_par.nom_complet if s.decidee_par else None,
                })

        if 'cotisation' in types_demandes:
            qs = Cotisation.objects.filter(statut=Cotisation.Statut.PAYE, date_paiement__isnull=False)
            if date_debut:
                qs = qs.filter(date_paiement__gte=date_debut)
            if date_fin:
                qs = qs.filter(date_paiement__lte=date_fin)
            qs = qs.select_related('servant', 'enregistree_par')
            for c in qs.order_by('-date_paiement')[:LIMITE_PAR_SOURCE]:
                events.append({
                    'type': 'cotisation',
                    'date': c.date_paiement,
                    'titre': f"Cotisation semaine {c.numero_semaine} payée",
                    'description': f"{c.servant.nom_complet} — {c.mois}/{c.annee}",
                    'auteur': c.enregistree_par.nom_complet if c.enregistree_par else None,
                })

        if 'annonce' in types_demandes:
            qs = Annonce.objects.select_related('publiee_par')
            if date_debut:
                qs = qs.filter(date_publication__date__gte=date_debut)
            if date_fin:
                qs = qs.filter(date_publication__date__lte=date_fin)
            for a in qs.order_by('-date_publication')[:LIMITE_PAR_SOURCE]:
                events.append({
                    'type': 'annonce',
                    'date': a.date_publication,
                    'titre': a.titre or 'Annonce publiée',
                    'description': a.contenu[:80],
                    'auteur': a.publiee_par.nom_complet if a.publiee_par else None,
                })

        if 'ordre_du_jour' in types_demandes:
            qs = OrdreDuJour.objects.select_related('cree_par').exclude(created_at__isnull=True)
            if date_debut:
                qs = qs.filter(created_at__date__gte=date_debut)
            if date_fin:
                qs = qs.filter(created_at__date__lte=date_fin)
            for o in qs.order_by('-created_at')[:LIMITE_PAR_SOURCE]:
                events.append({
                    'type': 'ordre_du_jour',
                    'date': o.created_at,
                    'titre': f"Ordre du jour publié : {o.titre}",
                    'description': f"Réunion du {o.date}",
                    'auteur': o.cree_par.nom_complet if o.cree_par else None,
                })

        if 'membre' in types_demandes:
            qs = User.objects.select_related('role')
            if date_debut:
                qs = qs.filter(date_joined__date__gte=date_debut)
            if date_fin:
                qs = qs.filter(date_joined__date__lte=date_fin)
            for u in qs.order_by('-date_joined')[:LIMITE_PAR_SOURCE]:
                events.append({
                    'type': 'membre',
                    'date': u.date_joined,
                    'titre': 'Nouveau membre',
                    'description': f"{u.nom_complet} ({u.role.libelle if u.role else 'aucun rôle'})",
                    'auteur': None,
                })

        if 'message' in types_demandes:
            qs = Message.objects.filter(traite=True).select_related('auteur', 'repondu_par')
            if date_debut:
                qs = qs.filter(updated_at__date__gte=date_debut)
            if date_fin:
                qs = qs.filter(updated_at__date__lte=date_fin)
            for m in qs.order_by('-updated_at')[:LIMITE_PAR_SOURCE]:
                events.append({
                    'type': 'message',
                    'date': m.updated_at,
                    'titre': f"Réponse envoyée : {m.sujet}",
                    'description': f"À {m.auteur.nom_complet}",
                    'auteur': m.repondu_par.nom_complet if m.repondu_par else None,
                })

        if 'connexion' in types_demandes:
            qs = JournalConnexion.objects.select_related('utilisateur')
            if date_debut:
                qs = qs.filter(date_connexion__date__gte=date_debut)
            if date_fin:
                qs = qs.filter(date_connexion__date__lte=date_fin)
            for cx in qs.order_by('-date_connexion')[:LIMITE_PAR_SOURCE]:
                qui = cx.utilisateur.nom_complet if cx.utilisateur else (cx.matricule_saisi or 'Inconnu')
                events.append({
                    'type': 'connexion',
                    'date': cx.date_connexion,
                    'titre': 'Connexion réussie' if cx.reussie else 'Tentative de connexion échouée',
                    'description': f"{qui}" + (f" — IP {cx.adresse_ip}" if cx.adresse_ip else ''),
                    'auteur': None,
                })

        events.sort(key=lambda e: str(e['date']), reverse=True)

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
            'filtres': {
                'date_debut': date_debut.isoformat() if date_debut else None,
                'date_fin': date_fin.isoformat() if date_fin else None,
                'types': sorted(types_demandes),
            },
            'results': events[debut:fin],
        })