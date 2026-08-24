from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
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
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['matricule', 'nom', 'prenom', 'telephone', 'membre_depuis', 'role', 'password']

    def validate_password(self, value):
        validate_password(value)
        return value

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
    nouveau_mot_de_passe = serializers.CharField(write_only=True)

    def validate_ancien_mot_de_passe(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_nouveau_mot_de_passe(self, value):
        user = self.context['request'].user
        validate_password(value, user=user)
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
    matricule = serializers.CharField(required=False, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.username_field in self.fields:
            self.fields[self.username_field].required = False

    def validate(self, attrs):
        identifier = attrs.get('matricule') or attrs.get(self.username_field)
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError("Le matricule et le mot de passe sont requis.")

        user = authenticate(
            request=self.context.get('request'),
            username=identifier,
            password=password
        ) or authenticate(
            request=self.context.get('request'),
            matricule=identifier,
            password=password
        )

        if not user:
            raise AuthenticationFailed("Matricule ou mot de passe incorrect.")

        if not user.is_active:
            raise AuthenticationFailed("Ce compte est désactivé.")

        self.user = user

        refresh = self.get_token(self.user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(self.user).data
        }