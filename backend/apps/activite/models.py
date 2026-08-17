
from django.conf import settings
from django.db import models


class JournalConnexion(models.Model):
    """
    Journal spécialisé des tentatives de connexion.

    Permet de savoir :
    - quel matricule a été saisi ;
    - si la connexion a réussi ;
    - quel utilisateur était concerné ;
    - depuis quelle IP ;
    - à quel moment.
    """

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='connexions',
    )

    matricule_saisi = models.CharField(
        max_length=50,
        blank=True,
        help_text=(
            "Matricule saisi lors de la tentative de connexion."
        ),
    )

    reussie = models.BooleanField(
        default=True,
    )

    adresse_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    date_connexion = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'Connexion'
        verbose_name_plural = 'Journal des connexions'
        ordering = ['-date_connexion']

    def __str__(self):
        qui = (
            self.utilisateur.nom_complet
            if self.utilisateur
            else self.matricule_saisi
        )

        statut = 'réussie' if self.reussie else 'échouée'

        return (
            f"{qui} — {statut} — "
            f"{self.date_connexion:%d/%m/%Y %H:%M}"
        )


class JournalActivite(models.Model):
    """
    Journal général des actions importantes effectuées dans PGST.

    Ce journal permet à l'administrateur de savoir :
    - qui a effectué une action ;
    - quelle action a été effectuée ;
    - dans quelle catégorie ;
    - avec quel résultat ;
    - sur quelle ressource ;
    - depuis quelle adresse IP ;
    - avec quel navigateur/appareil ;
    - et à quel moment.
    """

    CATEGORIES = [
        ('AUTHENTICATION', 'Authentification'),
        ('ACCOUNT', 'Compte'),
        ('MEMBERS', 'Membres'),
        ('FINANCE', 'Trésorerie'),
        ('DISCIPLINE', 'Discipline'),
        ('CALENDAR', 'Calendrier'),
        ('ANNOUNCEMENT', 'Annonces'),
        ('SYSTEM', 'Système'),
    ]

    RESULTATS = [
        ('SUCCESS', 'Succès'),
        ('FAILURE', 'Échec'),
        ('WARNING', 'Avertissement'),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activites',
    )

    action = models.CharField(
        max_length=100,
        help_text=(
            "Code technique de l'action. "
            "Exemple : PROFILE_UPDATED."
        ),
    )

    categorie = models.CharField(
        max_length=30,
        choices=CATEGORIES,
        default='SYSTEM',
    )

    description = models.TextField(
        help_text="Description lisible de l'action.",
    )

    resultat = models.CharField(
        max_length=20,
        choices=RESULTATS,
        default='SUCCESS',
    )

    cible_type = models.CharField(
        max_length=50,
        blank=True,
        help_text=(
            "Type de ressource concernée. "
            "Exemple : USER, COTISATION."
        ),
    )

    cible_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Identifiant de la ressource concernée.",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Informations supplémentaires liées à l'action.",
    )

    adresse_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
        help_text="Navigateur ou appareil utilisé.",
    )

    date_creation = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'Activité'
        verbose_name_plural = 'Journal des activités'
        ordering = ['-date_creation']

    def __str__(self):
        qui = (
            self.utilisateur.nom_complet
            if self.utilisateur
            else 'Utilisateur inconnu'
        )

        return (
            f"{qui} — {self.description} — "
            f"{self.date_creation:%d/%m/%Y %H:%M}"
        )

