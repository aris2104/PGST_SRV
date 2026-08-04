from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Messe, OrdreDuJour, Presence


class MesseSerializer(serializers.ModelSerializer):
    type_messe_display = serializers.CharField(source='get_type_messe_display', read_only=True)
    servants_detail = UserSerializer(source='servants', many=True, read_only=True)

    class Meta:
        model = Messe
        fields = [
            'id', 'date', 'heure', 'type_messe', 'type_messe_display',
            'servants', 'servants_detail', 'lieu',
        ]


class OrdreDuJourSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdreDuJour
        fields = ['id', 'date', 'titre', 'description', 'cree_par']
        read_only_fields = ['cree_par']


class PresenceSerializer(serializers.ModelSerializer):
    servant_nom = serializers.CharField(source='servant.nom_complet', read_only=True)
    reunion_titre = serializers.CharField(source='ordre_du_jour.titre', read_only=True)
    reunion_date = serializers.DateField(source='ordre_du_jour.date', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Presence
        fields = [
            'id', 
            'ordre_du_jour', 
            'reunion_titre', 
            'reunion_date',
            'servant', 
            'servant_nom', 
            'statut',           # 🟢 Ajout du code statut (PRESENT, RETARD, PERMISSION, ABSENT)
            'statut_display',   # 🟢 Ajout du libellé affichable ("En retard", etc.)
            'present',          # Champ booléen conservé
            'enregistree_par',
        ]
        read_only_fields = ['id', 'enregistree_par']