from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Servant de la plateforme PGST.
    Connexion par matricule (ex: SRV-AriskPes), cf. maquette de connexion.
    """
    matricule = models.CharField(max_length=30, unique=True, help_text="Ex: SRV-AriskPes")
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='photos_profil/', blank=True, null=True)

    role = models.ForeignKey(
        'roles.Role', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='membres',
    )

    membre_depuis = models.DateField(help_text="Date d'entrée dans le groupe (ex: 2019)")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'matricule'
    REQUIRED_FIELDS = ['nom', 'prenom']

    class Meta:
        verbose_name = 'Servant'
        verbose_name_plural = 'Servants'
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

    @property
    def initiales(self):
        return f"{self.prenom[:1]}{self.nom[:1]}".upper()


class NotificationPreference(models.Model):
    """
    Préférences de notification d'un servant (écran Paramètres > Notifications).
    Une ligne par utilisateur, créée automatiquement au premier accès.
    """
    servant = models.OneToOneField(
        'users.User', on_delete=models.CASCADE, related_name='notification_preference',
    )
    annonces = models.BooleanField(default=True)
    cotisations = models.BooleanField(default=True)
    sanctions = models.BooleanField(default=True)
    programme = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Préférence de notification'
        verbose_name_plural = 'Préférences de notification'

    def __str__(self):
        return f"Préférences de {self.servant.nom_complet}"