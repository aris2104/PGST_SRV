from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from utils.permissions import (
    IsPresiOrSecretary,
    CanBrowseMembers,
    _has_role,
)

from utils.audit import enregistrer_activite

from apps.activite.models import JournalConnexion
from apps.roles.models import Role

from .models import (
    User,
    NotificationPreference,
    PushSubscription,
)

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserUpdateSerializer,
    AdminUserListSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    NotificationPreferenceSerializer,
    ChangePasswordSerializer,
)


# ============================================================
# UTILITAIRES
# ============================================================

def _adresse_ip(request):
    """
    Récupère l'adresse IP du client.
    """

    x_forwarded_for = request.META.get(
        'HTTP_X_FORWARDED_FOR'
    )

    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()

    return request.META.get('REMOTE_ADDR')


def _user_agent(request):
    """
    Récupère le navigateur / appareil utilisé.
    """

    return request.META.get(
        'HTTP_USER_AGENT',
        ''
    ) or ''


# ============================================================
# AUTHENTIFICATION
# ============================================================

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/

    Données attendues :

        {
            "matricule": "...",
            "password": "..."
        }

    Retourne les tokens JWT ainsi que les informations
    utilisateur selon le serializer configuré.

    Chaque tentative de connexion est enregistrée dans :

    - JournalConnexion
    - JournalActivite
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):

        matricule = (
            request.data.get('matricule', '')
            or ''
        ).strip()

        ip = _adresse_ip(request)
        user_agent = _user_agent(request)

        # ----------------------------------------------------
        # TENTATIVE D'AUTHENTIFICATION
        # ----------------------------------------------------

        try:
            response = super().post(
                request,
                *args,
                **kwargs,
            )

        except AuthenticationFailed:

            # On essaie de retrouver l'utilisateur correspondant
            # au matricule saisi.
            utilisateur = User.objects.filter(
                matricule=matricule
            ).first()

            # ------------------------------------------------
            # JOURNAL DE CONNEXION
            # ------------------------------------------------

            JournalConnexion.objects.create(
                utilisateur=utilisateur,
                matricule_saisi=matricule,
                reussie=False,
                adresse_ip=ip,
            )

            # ------------------------------------------------
            # JOURNAL GENERAL D'ACTIVITÉ
            # ------------------------------------------------

            enregistrer_activite(
                request=request,
                utilisateur=utilisateur,
                action='LOGIN_FAILED',
                categorie='AUTHENTICATION',
                description=(
                    "Tentative de connexion échouée "
                    f"avec le matricule « {matricule} »."
                ),
                resultat='FAILURE',
                cible_type='USER' if utilisateur else '',
                cible_id=(
                    utilisateur.pk
                    if utilisateur
                    else ''
                ),
                metadata={
                    'matricule_saisi': matricule,
                },
            )

            # On laisse DRF gérer la réponse HTTP d'erreur.
            raise

        # ----------------------------------------------------
        # CONNEXION RÉUSSIE
        # ----------------------------------------------------

        utilisateur = User.objects.filter(
            matricule=matricule
        ).first()

        # ----------------------------------------------------
        # JOURNAL DE CONNEXION
        # ----------------------------------------------------

        JournalConnexion.objects.create(
            utilisateur=utilisateur,
            matricule_saisi=matricule,
            reussie=True,
            adresse_ip=ip,
        )

        # ----------------------------------------------------
        # JOURNAL GÉNÉRAL
        # ----------------------------------------------------

        if utilisateur:
            nom = utilisateur.nom_complet
        else:
            nom = matricule

        enregistrer_activite(
            request=request,
            utilisateur=utilisateur,
            action='LOGIN_SUCCESS',
            categorie='AUTHENTICATION',
            description=(
                f"{nom} s'est connecté avec succès."
            ),
            resultat='SUCCESS',
            cible_type='USER' if utilisateur else '',
            cible_id=(
                utilisateur.pk
                if utilisateur
                else ''
            ),
            metadata={
                'matricule_saisi': matricule,
            },
        )

        return response


# ============================================================
# PROFIL PERSONNEL
# ============================================================

class MeView(generics.RetrieveUpdateAPIView):
    """
    GET /api/users/me/

        Récupérer son profil.

    PATCH /api/users/me/

        Modifier ses informations personnelles.
    """

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):

        if self.request.method in (
            'PATCH',
            'PUT',
        ):
            return UserUpdateSerializer

        return UserSerializer

    def perform_update(self, serializer):

        utilisateur = self.get_object()

        serializer.save()

        enregistrer_activite(
            request=self.request,
            utilisateur=utilisateur,
            action='PROFILE_UPDATED',
            categorie='ACCOUNT',
            description=(
                f"{utilisateur.nom_complet} a modifié "
                "ses informations personnelles."
            ),
            resultat='SUCCESS',
            cible_type='USER',
            cible_id=utilisateur.pk,
        )


# ============================================================
# PRÉFÉRENCES DE NOTIFICATIONS
# ============================================================

class NotificationPreferenceView(
    generics.RetrieveUpdateAPIView
):
    """
    GET /api/users/notifications-preferences/

        Récupérer les préférences.

    PATCH /api/users/notifications-preferences/

        Modifier une ou plusieurs préférences.
    """

    serializer_class = NotificationPreferenceSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_object(self):

        prefs, _ = (
            NotificationPreference.objects.get_or_create(
                servant=self.request.user
            )
        )

        return prefs

    def perform_update(self, serializer):

        serializer.save()

        enregistrer_activite(
            request=self.request,
            action='NOTIFICATION_PREFERENCES_UPDATED',
            categorie='ACCOUNT',
            description=(
                f"{self.request.user.nom_complet} a modifié "
                "ses préférences de notification."
            ),
            resultat='SUCCESS',
            cible_type='USER',
            cible_id=self.request.user.pk,
        )


# ============================================================
# CHANGEMENT DE MOT DE PASSE
# ============================================================

class ChangePasswordView(APIView):
    """
    POST /api/users/changer-mot-de-passe/

    Données :

        {
            "ancien_mot_de_passe": "...",
            "nouveau_mot_de_passe": "..."
        }
    """

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(self, request):

        serializer = ChangePasswordSerializer(
            data=request.data,
            context={
                'request': request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        enregistrer_activite(
            request=request,
            action='PASSWORD_CHANGED',
            categorie='ACCOUNT',
            description=(
                f"{request.user.nom_complet} a changé "
                "son mot de passe."
            ),
            resultat='SUCCESS',
            cible_type='USER',
            cible_id=request.user.pk,
        )

        return Response(
            {
                'detail': (
                    'Mot de passe mis à jour.'
                )
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# PUSH NOTIFICATIONS
# ============================================================

class PushSubscriptionView(APIView):
    """
    POST /api/users/push-subscription/

        Enregistrer ou mettre à jour un appareil Push.

    DELETE /api/users/push-subscription/

        Supprimer un abonnement Push.
    """

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(self, request):

        endpoint = request.data.get(
            'endpoint'
        )

        keys = request.data.get(
            'keys',
            {}
        )

        p256dh = (
            keys.get('p256dh')
            or request.data.get('p256dh')
        )

        auth = (
            keys.get('auth')
            or request.data.get('auth')
        )

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not endpoint or not p256dh or not auth:

            return Response(
                {
                    'detail': (
                        'Données d abonnement incomplètes '
                        '(endpoint, p256dh et auth requis).'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CRÉATION / MISE À JOUR
        # ----------------------------------------------------

        subscription, created = (
            PushSubscription.objects.update_or_create(
                servant=request.user,
                endpoint=endpoint,
                defaults={
                    'p256dh': p256dh,
                    'auth': auth,
                },
            )
        )

        # ----------------------------------------------------
        # AUDIT
        # ----------------------------------------------------

        if created:

            action = (
                'PUSH_SUBSCRIPTION_CREATED'
            )

            description = (
                f"{request.user.nom_complet} a activé "
                "les notifications Push."
            )

        else:

            action = (
                'PUSH_SUBSCRIPTION_UPDATED'
            )

            description = (
                f"{request.user.nom_complet} a mis à jour "
                "son abonnement Push."
            )

        enregistrer_activite(
            request=request,
            action=action,
            categorie='ACCOUNT',
            description=description,
            resultat='SUCCESS',
            cible_type='PUSH_SUBSCRIPTION',
            cible_id=subscription.pk,
        )

        msg = (
            'Souscription Push créée.'
            if created
            else
            'Souscription Push mise à jour.'
        )

        return Response(
            {
                'detail': msg
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )

    def delete(self, request):

        endpoint = request.data.get(
            'endpoint'
        )

        if endpoint:

            subscriptions = (
                PushSubscription.objects.filter(
                    servant=request.user,
                    endpoint=endpoint,
                )
            )

        else:

            subscriptions = (
                PushSubscription.objects.filter(
                    servant=request.user
                )
            )

        nombre_supprime = subscriptions.count()

        subscriptions.delete()

        if nombre_supprime > 0:

            enregistrer_activite(
                request=request,
                action='PUSH_SUBSCRIPTION_DELETED',
                categorie='ACCOUNT',
                description=(
                    f"{request.user.nom_complet} a supprimé "
                    "son abonnement aux notifications Push."
                ),
                resultat='SUCCESS',
                cible_type='PUSH_SUBSCRIPTION',
                metadata={
                    'nombre_supprime': nombre_supprime,
                },
            )

        return Response(
            {
                'detail': (
                    'Souscription(s) Push supprimée(s).'
                )
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMINISTRATION DES MEMBRES
# ============================================================

# Le Super Admin a plus de pouvoir que l'Admin : lui seul peut attribuer
# le rôle Admin/Super Admin à quelqu'un, et lui seul peut modifier,
# désactiver ou supprimer le compte d'un Admin/Super Admin existant.
# Un Admin \"classique\" garde tout le reste (gérer les Servants et tous
# les autres rôles du bureau), mais ne peut pas toucher à un pair Admin.
ROLES_NIVEAU_ADMIN = ('ADMIN', 'SUPER_ADMIN')


def _code_role(role):
    return getattr(role, 'code', None)


def _est_super_admin(user):
    return bool(user and user.is_authenticated and (user.is_superuser or _code_role(user.role) == 'SUPER_ADMIN'))


def _est_admin_ou_plus(user):
    return _has_role(user, *ROLES_NIVEAU_ADMIN)


class UserViewSet(viewsets.ModelViewSet):
    """
    Écran Admin :
        "Administrer le groupe"

    GET /api/users/
        -> liste des membres

    GET /api/users/<id>/
        -> détail d'un membre

    POST /api/users/
        -> créer un membre

    PATCH /api/users/<id>/
        -> modifier un membre

    DELETE /api/users/<id>/
        -> supprimer un membre
    """

    queryset = (
        User.objects
        .select_related('role')
        .all()
    )

    def get_queryset(self):
        qs = User.objects.select_related('role').all()
        # ------------------------------------------------------------
        # MODE FURTIF : un Admin/Super Admin est invisible dans les
        # listes consultées par tous les autres rôles (membres, sélecteur
        # de destinataires d'annonce, etc. — tout ce qui passe par ce
        # même endpoint). L'Admin/Super Admin, lui, voit toujours tout le
        # monde, y compris les autres comptes Admin.
        # ------------------------------------------------------------
        if self.action in ('list', 'retrieve') and not _est_admin_ou_plus(self.request.user):
            qs = qs.exclude(role__code__in=['ADMIN', 'SUPER_ADMIN'])
        return qs

    # --------------------------------------------------------
    # PERMISSIONS
    # --------------------------------------------------------

    def get_permissions(self):

        if self.action in (
            'list',
            'retrieve',
        ):

            return [
                permissions.IsAuthenticated(),
                CanBrowseMembers(),
            ]

        return [
            permissions.IsAuthenticated(),
            IsPresiOrSecretary(),
        ]

    # --------------------------------------------------------
    # SERIALIZERS
    # --------------------------------------------------------

    def get_serializer_class(self):

        if self.action == 'create':
            return AdminUserCreateSerializer

        if self.action in (
            'update',
            'partial_update',
        ):
            return AdminUserUpdateSerializer

        return AdminUserListSerializer

    # --------------------------------------------------------
    # CRÉATION D'UN MEMBRE
    # --------------------------------------------------------

    def perform_create(self, serializer):

        # ------------------------------------------------------------
        # SÉCURITÉ : seul un ADMIN (ou Super Admin) peut créer un membre
        # avec un rôle du bureau (Président/Secrétaire/.../Admin). Un
        # Président/Secrétaire qui crée un membre obtient TOUJOURS un
        # simple Servant, quoi qu'il ait envoyé dans la requête.
        #
        # Restriction supplémentaire : seul un SUPER ADMIN peut créer
        # directement un compte Admin ou Super Admin — un Admin classique
        # qui tente ça se voit rétrogradé en Servant côté serveur.
        # ------------------------------------------------------------
        role_demande = serializer.validated_data.get('role')
        role_demande_code = _code_role(role_demande)

        if not _est_admin_ou_plus(self.request.user):
            role_servant = Role.objects.filter(code='SERVANT').first()
            utilisateur = serializer.save(role=role_servant)
        elif role_demande_code in ROLES_NIVEAU_ADMIN and not _est_super_admin(self.request.user):
            raise PermissionDenied(
                "Seul un Super Admin peut créer un compte Admin ou Super Admin."
            )
        else:
            utilisateur = serializer.save()

        enregistrer_activite(
            request=self.request,
            action='USER_CREATED',
            categorie='MEMBERS',
            description=(
                f"{self.request.user.nom_complet} a créé "
                f"le membre {utilisateur.nom_complet}."
            ),
            resultat='SUCCESS',
            cible_type='USER',
            cible_id=utilisateur.pk,
            metadata={
                'matricule': utilisateur.matricule,
            },
        )

    # --------------------------------------------------------
    # MODIFICATION D'UN MEMBRE
    # --------------------------------------------------------

    def perform_update(self, serializer):

        utilisateur = self.get_object()

        # ------------------------------------------------------------
        # SÉCURITÉ : seul un ADMIN (ou Super Admin) peut changer le rôle
        # d'un membre. Président/Secrétaire peuvent gérer le reste
        # (activer/désactiver un membre par ex.) mais jamais le champ
        # 'role'.
        #
        # Le Super Admin a plus de pouvoir que l'Admin :
        # - lui seul peut attribuer le rôle Admin/Super Admin à quelqu'un ;
        # - lui seul peut modifier le compte d'un membre déjà Admin/Super
        #   Admin (un Admin classique ne peut pas toucher à un pair Admin,
        #   ça évite qu'un Admin désactive/rétrograde un autre Admin).
        # Vérifié ici côté serveur — pas seulement en cachant le contrôle
        # côté frontend, sinon un appel API direct contournerait la
        # restriction.
        # ------------------------------------------------------------
        cible_est_admin_ou_plus = _code_role(utilisateur.role) in ROLES_NIVEAU_ADMIN
        if cible_est_admin_ou_plus and not _est_super_admin(self.request.user):
            raise PermissionDenied(
                "Seul un Super Admin peut modifier le compte d'un Admin ou Super Admin."
            )

        role_dans_la_requete = 'role' in serializer.validated_data
        role_a_changé = (
            role_dans_la_requete
            and serializer.validated_data.get('role') != utilisateur.role
        )
        if role_a_changé and not _est_admin_ou_plus(self.request.user):
            raise PermissionDenied(
                "Seul un administrateur peut modifier le rôle d'un membre."
            )
        nouveau_role_code = _code_role(serializer.validated_data.get('role')) if role_dans_la_requete else None
        if role_a_changé and nouveau_role_code in ROLES_NIVEAU_ADMIN and not _est_super_admin(self.request.user):
            raise PermissionDenied(
                "Seul un Super Admin peut promouvoir quelqu'un Admin ou Super Admin."
            )

        # On mémorise l'ancien rôle avant modification.
        ancien_role = getattr(
            utilisateur,
            'role',
            None,
        )

        ancien_role_nom = (
            str(ancien_role)
            if ancien_role
            else None
        )

        # Sauvegarde.
        utilisateur = serializer.save()

        # Nouveau rôle.
        nouveau_role = getattr(
            utilisateur,
            'role',
            None,
        )

        nouveau_role_nom = (
            str(nouveau_role)
            if nouveau_role
            else None
        )

        # ----------------------------------------------------
        # DÉTERMINER L'ACTION
        # ----------------------------------------------------

        if ancien_role_nom != nouveau_role_nom:

            action = 'ROLE_CHANGED'

            description = (
                f"{self.request.user.nom_complet} a changé "
                f"le rôle de {utilisateur.nom_complet}."
            )

        else:

            action = 'USER_UPDATED'

            description = (
                f"{self.request.user.nom_complet} a modifié "
                f"le compte de {utilisateur.nom_complet}."
            )

        enregistrer_activite(
            request=self.request,
            action=action,
            categorie='MEMBERS',
            description=description,
            resultat='SUCCESS',
            cible_type='USER',
            cible_id=utilisateur.pk,
            metadata={
                'ancien_role': ancien_role_nom,
                'nouveau_role': nouveau_role_nom,
            },
        )

    # --------------------------------------------------------
    # SUPPRESSION D'UN MEMBRE
    # --------------------------------------------------------

    def perform_destroy(self, instance):

        # Seul un Super Admin peut supprimer le compte d'un Admin/Super Admin.
        if _code_role(instance.role) in ROLES_NIVEAU_ADMIN and not _est_super_admin(self.request.user):
            raise PermissionDenied(
                "Seul un Super Admin peut supprimer le compte d'un Admin ou Super Admin."
            )

        nom = instance.nom_complet
        matricule = instance.matricule
        utilisateur_id = instance.pk

        # On journalise AVANT la suppression.
        enregistrer_activite(
            request=self.request,
            action='USER_DELETED',
            categorie='MEMBERS',
            description=(
                f"{self.request.user.nom_complet} a supprimé "
                f"le membre {nom}."
            ),
            resultat='SUCCESS',
            cible_type='USER',
            cible_id=utilisateur_id,
            metadata={
                'nom': nom,
                'matricule': matricule,
            },
        )

        instance.delete()