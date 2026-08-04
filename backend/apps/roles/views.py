from rest_framework import viewsets, permissions
from .models import Role
from .serializers import RoleSerializer


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des rôles disponibles (lecture seule, gérés via l'admin Django)."""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
