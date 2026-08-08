from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.nom_complet', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'auteur', 'auteur_nom', 'sujet', 'contenu', 'reponse', 'traite', 'created_at', 'updated_at']
        read_only_fields = ['id', 'auteur', 'reponse', 'traite', 'created_at', 'updated_at']


class MessageReplySerializer(serializers.ModelSerializer):
    """Réservé à l'admin : répondre à un message (marque aussi le message comme traité)."""

    class Meta:
        model = Message
        fields = ['id', 'reponse']
        read_only_fields = ['id']