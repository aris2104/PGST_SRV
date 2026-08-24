from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Messe, OrdreDuJour, Presence


class MesseSerializer(serializers.ModelSerializer):
    type_messe_display = serializers.CharField(source='get_type_messe_display', read_only=True)
    servants_detail = UserSerializer(source='servants', many=True, read_only=True)
    # Libellé prêt à afficher : nom_personnalise si type_messe = AUTRE et
    # rempli, sinon le libellé standard (Messe matinale, etc.)
    libelle_affiche = serializers.SerializerMethodField()

    class Meta:
        model = Messe
        fields = [
            'id', 'date', 'heure', 'type_messe', 'type_messe_display',
            'nom_personnalise', 'libelle_affiche',
            'servants', 'servants_detail', 'lieu',
        ]

    def get_libelle_affiche(self, obj):
        if obj.type_messe == Messe.TypeMesse.AUTRE and obj.nom_personnalise:
            return obj.nom_personnalise
        return obj.get_type_messe_display()

    def validate(self, attrs):
        type_messe = attrs.get('type_messe', getattr(self.instance, 'type_messe', None))
        nom_personnalise = attrs.get('nom_personnalise', getattr(self.instance, 'nom_personnalise', ''))
        if type_messe == Messe.TypeMesse.AUTRE and not nom_personnalise:
            raise serializers.ValidationError({
                'nom_personnalise': "Merci de préciser le nom de la messe (elle n'est pas dans la liste)."
            })
        return attrs


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