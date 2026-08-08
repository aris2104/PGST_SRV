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
        """Pour une SORTIE : EN_ATTENTE / CONFIRME (unanimité) / DECLINE (au moins un refus).
        Une ENTREE n'a pas de workflow de validation, donc pas de statut."""
        if obj.type_mouvement == MouvementCaisse.Type.ENTREE:
            return None
        decisions = [c.decision for c in obj.confirmations.all()]
        if not decisions:
            return 'CONFIRME'  # aucun autre membre du bureau à consulter
        if 'DECLINE' in decisions:
            return 'DECLINE'
        if all(d == 'CONFIRME' for d in decisions):
            return 'CONFIRME'
        return 'EN_ATTENTE'