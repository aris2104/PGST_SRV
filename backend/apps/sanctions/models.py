from django.db import models
from django.conf import settings


class Sanction(models.Model):
    """
    Sanction disciplinaire infligée à un servant.
    Alimente :
      - l'écran 'Suivis' (bloc Sanctions -> "Aucune sanction active")
      - l'écran 'Historique des sanctions' (liste complète, triée par date)
    """

    class TypeSanction(models.TextChoices):
        AVERTISSEMENT = 'AVERTISSEMENT', 'Avertissement'
        AMENDE = 'AMENDE', 'Amende'
        SUSPENSION = 'SUSPENSION', 'Suspension temporaire'
        MISE_A_PIED = 'MISE_A_PIED', 'Mise à pied'
        AUTRE = 'AUTRE', 'Autre'

    class Statut(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        LEVEE = 'LEVEE', 'Levée'
        PURGEE = 'PURGEE', 'Purgée'

    servant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sanctions',
    )
    type_sanction = models.CharField(max_length=20, choices=TypeSanction.choices)
    motif = models.TextField()
    date_decision = models.DateField()
    duree_jours = models.PositiveIntegerField(null=True, blank=True, help_text="Pour une suspension")
    date_fin = models.DateField(null=True, blank=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Pour une amende")
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.ACTIVE)
    decidee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sanctions_decidees',
        help_text="Le responsable disciplinaire à l'origine de la décision",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sanction'
        verbose_name_plural = 'Sanctions'
        ordering = ['-date_decision']

    def __str__(self):
        return f"{self.get_type_sanction_display()} - {self.servant.nom_complet} ({self.date_decision})"

    @property
    def est_active(self):
        return self.statut == self.Statut.ACTIVE
