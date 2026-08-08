from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from utils.permissions import IsAdmin
from .models import Message
from .serializers import MessageSerializer, MessageReplySerializer


class MessageViewSet(viewsets.ModelViewSet):
    """
    GET   /api/support/messages/         -> mes messages (tous les messages si Admin)
    POST  /api/support/messages/         -> envoyer un message à l'admin
    PATCH /api/support/messages/<id>/    -> répondre à un message (réservé à l'Admin)
    """
    serializer_class = MessageSerializer

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return MessageReplySerializer
        return MessageSerializer

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.select_related('auteur')
        if user.is_staff or (user.role and user.role.code == 'ADMIN'):
            return qs
        return qs.filter(auteur=user)

    def perform_create(self, serializer):
        user = self.request.user
        # L'Admin n'a pas de sens à se contacter lui-même.
        if user.role and user.role.code == 'ADMIN':
            raise PermissionDenied("L'administrateur ne peut pas s'envoyer un message à lui-même.")
        serializer.save(auteur=user)

    def perform_update(self, serializer):
        serializer.save(reponse=serializer.validated_data.get('reponse', ''), traite=True, repondu_par=self.request.user)