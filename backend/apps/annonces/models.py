from django.db import models
from django.conf import settings


class Annonce(models.Model):
    """
    Annonce publiée par le Président/Secrétaire.
    Correspond à l'écran d'accueil : badge 'pour toi' (ciblée) ou 'Générale'.
    """

    class Portee(models.TextChoices):
        GENERALE = 'GENERALE', 'Générale'
        CIBLEE = 'CIBLEE', 'Pour toi'

    titre = models.CharField(max_length=150, blank=True)
    contenu = models.TextField()
    portee = models.CharField(max_length=10, choices=Portee.choices, default=Portee.GENERALE)
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
        related_name='annonces_recues',
        help_text="Renseigné uniquement si portee = CIBLEE",
    )
    publiee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='annonces_publiees',
    )
    date_publication = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Annonce'
        verbose_name_plural = 'Annonces'
        ordering = ['-date_publication']

    def __str__(self):
        return self.titre or self.contenu[:40]
