from django.db import models


class Role(models.Model):
    """
    Rôle occupé par un servant au sein du groupe.
    Correspond aux boutons vus dans la maquette 'Administrer le groupe' :
    Presi & secre / Tresor / Disciplinaire / Organisateur / Admin.
    """

    class Code(models.TextChoices):
        PRESIDENT = 'PRESIDENT', 'Président'
        SECRETAIRE = 'SECRETAIRE', 'Secrétaire'
        TRESORIER = 'TRESORIER', 'Trésorier'
        DISCIPLINAIRE = 'DISCIPLINAIRE', 'Responsable disciplinaire'
        ORGANISATEUR = 'ORGANISATEUR', 'Organisateur'
        ADMIN = 'ADMIN', 'Administrateur'
        SERVANT = 'SERVANT', 'Servant'

    code = models.CharField(max_length=20, choices=Code.choices, unique=True)
    libelle = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Rôle'
        verbose_name_plural = 'Rôles'
        ordering = ['libelle']

    def __str__(self):
        return self.libelle
