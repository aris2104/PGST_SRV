from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from utils.permissions import IsPresiOrSecretary, CanBrowseMembers
from .models import User, NotificationPreference
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer, UserUpdateSerializer,
    AdminUserListSerializer, AdminUserCreateSerializer, AdminUserUpdateSerializer,
    NotificationPreferenceSerializer, ChangePasswordSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/  {matricule, password} -> access, refresh, user"""
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/users/me/  -> profil du servant connecté
    PATCH /api/users/me/ -> 'Modifier mes infos' (écran Paramètres)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return UserUpdateSerializer
        return UserSerializer


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/users/notifications-preferences/  -> préférences (créées si absentes)
    PATCH /api/users/notifications-preferences/  -> mise à jour d'une ou plusieurs préférences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prefs, _ = NotificationPreference.objects.get_or_create(servant=self.request.user)
        return prefs


class ChangePasswordView(APIView):
    """POST /api/users/changer-mot-de-passe/  {ancien_mot_de_passe, nouveau_mot_de_passe}"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Mot de passe mis à jour.'}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """
    Écran Admin 'Administrer le groupe'.
    GET    /api/users/           -> liste des membres (Admin/Président/Secrétaire)
    POST   /api/users/           -> créer un membre
    PATCH  /api/users/<id>/      -> changer son rôle ou l'activer/désactiver
    """
    queryset = User.objects.select_related('role').all()

    def get_permissions(self):
        # Lecture (liste/détail) : tout rôle responsable en a besoin pour choisir
        # un servant dans ses formulaires (paiement, sanction...), mais pas un
        # simple Servant. Écriture (créer/modifier/désactiver) : réservée à la
        # gestion du groupe (Président/Secrétaire/Admin).
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated(), CanBrowseMembers()]
        return [permissions.IsAuthenticated(), IsPresiOrSecretary()]

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return AdminUserUpdateSerializer
        return AdminUserListSerializer