from rest_framework import serializers
from .models import Annonce


class AnnonceSerializer(serializers.ModelSerializer):
    portee_display = serializers.CharField(source='get_portee_display', read_only=True)

    class Meta:
        model = Annonce
        fields = [
            'id', 'titre', 'contenu', 'portee', 'portee_display',
            'destinataires', 'publiee_par', 'date_publication',
        ]
        read_only_fields = ['id', 'publiee_par', 'date_publication']
        extra_kwargs = {'destinataires': {'required': False}}