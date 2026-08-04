from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.roles.serializers import RoleSerializer
from .models import User, NotificationPreference


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    nom_complet = serializers.ReadOnlyField()
    initiales = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'nom_complet', 'initiales',
            'telephone', 'photo', 'role', 'membre_depuis', 'is_staff',
        ]
        read_only_fields = ['id', 'matricule']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Utilisé pour 'Modifier mes infos' (écran Paramètres)."""

    class Meta:
        model = User
        fields = ['nom', 'prenom', 'telephone', 'photo']


class AdminUserListSerializer(serializers.ModelSerializer):
    """Ligne de la liste des membres, écran 'Administrer le groupe'."""
    role = RoleSerializer(read_only=True)
    nom_complet = serializers.ReadOnlyField()
    initiales = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'matricule', 'nom_complet', 'initiales', 'role',
            'membre_depuis', 'is_active',
        ]


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Création d'un nouveau membre par un administrateur du groupe."""
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = ['matricule', 'nom', 'prenom', 'telephone', 'membre_depuis', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Changer le rôle ou activer/désactiver un membre."""

    class Meta:
        model = User
        fields = ['role', 'is_active']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['annonces', 'cotisations', 'sanctions', 'programme']


class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True, min_length=4)

    def validate_ancien_mot_de_passe(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['nouveau_mot_de_passe'])
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Login par matricule + mot de passe. Renvoie les tokens JWT
    ainsi que le profil complet pour éviter un second appel après connexion.
    """
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data