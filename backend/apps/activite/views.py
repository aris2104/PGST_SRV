from itertools import chain
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.sanctions.models import Sanction
from apps.cotisations.models import Cotisation
from apps.annonces.models import Annonce
from utils.permissions import IsPresiOrSecretary


class ActiviteRecenteView(APIView):
    """
    GET /api/activite/recente/
    Fil d'activité agrégé pour la supervision Admin : dernières sanctions,
    derniers paiements enregistrés, dernières annonces publiées — fusionnés
    et triés par date, sans avoir besoin d'un modèle de log dédié.
    """
    permission_classes = [permissions.IsAuthenticated, IsPresiOrSecretary]

    def get(self, request):
        events = []

        sanctions = Sanction.objects.select_related('servant', 'decidee_par').order_by('-created_at')[:15]
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
            .order_by('-date_paiement')[:15]
        )
        for c in paiements:
            events.append({
                'type': 'cotisation',
                'date': c.date_paiement,
                'titre': f"Cotisation semaine {c.numero_semaine} payée",
                'description': f"{c.servant.nom_complet} — {c.mois}/{c.annee}",
                'auteur': c.enregistree_par.nom_complet if c.enregistree_par else None,
            })

        annonces = Annonce.objects.select_related('publiee_par').order_by('-date_publication')[:15]
        for a in annonces:
            events.append({
                'type': 'annonce',
                'date': a.date_publication,
                'titre': a.titre or 'Annonce publiée',
                'description': a.contenu[:80],
                'auteur': a.publiee_par.nom_complet if a.publiee_par else None,
            })

        events.sort(key=lambda e: str(e['date']), reverse=True)
        return Response(events[:25])