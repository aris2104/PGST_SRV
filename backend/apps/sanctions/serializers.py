from rest_framework import serializers
from .models import Sanction


class SanctionSerializer(serializers.ModelSerializer):
    type_sanction_display = serializers.CharField(source='get_type_sanction_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    decidee_par_nom = serializers.CharField(source='decidee_par.nom_complet', read_only=True, default=None)
    servant_nom = serializers.CharField(source='servant.nom_complet', read_only=True)

    class Meta:
        model = Sanction
        fields = [
            'id', 'servant', 'servant_nom', 'type_sanction', 'type_sanction_display', 'motif',
            'date_decision', 'duree_jours', 'date_fin', 'montant', 'amende_payee',
            'statut', 'statut_display', 'decidee_par', 'decidee_par_nom', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SanctionCreateSerializer(serializers.ModelSerializer):
    """Utilisé par le rôle Disciplinaire pour infliger une sanction."""

    class Meta:
        model = Sanction
        fields = [
            'servant', 'type_sanction', 'motif', 'date_decision',
            'duree_jours', 'date_fin', 'montant', 'statut',
        ]

    def create(self, validated_data):
        validated_data['decidee_par'] = self.context['request'].user
        return super().create(validated_data)