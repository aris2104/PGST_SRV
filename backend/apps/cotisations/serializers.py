from rest_framework import serializers
from .models import Cotisation

MOIS_FR = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]


class CotisationSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    mois_libelle = serializers.SerializerMethodField()

    class Meta:
        model = Cotisation
        fields = [
            'id', 'servant', 'annee', 'mois', 'mois_libelle', 'numero_semaine',
            'date_debut_semaine', 'montant', 'statut', 'statut_display',
            'date_paiement', 'enregistree_par',
        ]
        read_only_fields = ['id']

    def get_mois_libelle(self, obj):
        return MOIS_FR[obj.mois]
