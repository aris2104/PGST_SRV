from django.db import models
from django.conf import settings


class Cotisation(models.Model):
    """
    Cotisation hebdomadaire d'un servant.
    Alimente :
      - l'écran 'Suivis' (barre de progression 'ce mois-ci', cumul annuel X/48 semaines)
      - l'écran 'Ma cotisation' (détail semaine par semaine d'un mois donné)
    """

    class Statut(models.TextChoices):
        PAYE = 'PAYE', 'Payé'
        IMPAYE = 'IMPAYE', 'Impayé'

    servant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cotisations',
    )
    annee = models.PositiveIntegerField()
    mois = models.PositiveSmallIntegerField(help_text="1 à 12")
    numero_semaine = models.PositiveSmallIntegerField(help_text="1 à 5")
    date_debut_semaine = models.DateField()
    montant = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.IMPAYE)
    date_paiement = models.DateField(null=True, blank=True)
    enregistree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cotisations_enregistrees',
        help_text="Le trésorier ayant enregistré le paiement",
    )

    class Meta:
        verbose_name = 'Cotisation'
        verbose_name_plural = 'Cotisations'
        ordering = ['-annee', '-mois', 'numero_semaine']
        unique_together = ('servant', 'annee', 'mois', 'numero_semaine')

    def __str__(self):
        return f"{self.servant.nom_complet} - {self.mois}/{self.annee} S{self.numero_semaine} ({self.statut})"
