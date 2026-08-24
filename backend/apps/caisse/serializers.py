from rest_framework import serializers
from .models import MouvementCaisse, ConfirmationMouvement


class ConfirmationSerializer(serializers.ModelSerializer):
    membre_nom = serializers.CharField(source='membre.nom_complet', read_only=True)

    class Meta:
        model = ConfirmationMouvement
        fields = ['id', 'membre', 'membre_nom', 'decision', 'date_decision']
        read_only_fields = ['id', 'membre', 'membre_nom', 'date_decision']


class MouvementCaisseSerializer(serializers.ModelSerializer):
    initiee_par_nom = serializers.CharField(source='initiee_par.nom_complet', read_only=True)
    confirmations = ConfirmationSerializer(many=True, read_only=True)
    statut_global = serializers.SerializerMethodField()

    class Meta:
        model = MouvementCaisse
        fields = [
            'id', 'type_mouvement', 'montant', 'motif', 'description', 'date',
            'initiee_par', 'initiee_par_nom', 'created_at', 'confirmations', 'statut_global',
        ]
        read_only_fields = ['id', 'initiee_par', 'created_at']

    def get_statut_global(self, obj):
        return obj.statut_global