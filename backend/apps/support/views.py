from rest_framework import viewsets, permissions
from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    """
    GET  /api/support/messages/       -> mes messages (tous les messages si Admin)
    POST /api/support/messages/       -> envoyer un message à l'admin
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.select_related('auteur')
        if user.is_staff or (user.role and user.role.code == 'ADMIN'):
            return qs
        return qs.filter(auteur=user)

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)