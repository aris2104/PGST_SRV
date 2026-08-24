from django.conf import settings
from django.db import models


class MouvementCaisse(models.Model):
    """
    Mouvement de fonds hors cotisations hebdomadaires : entrée diverse (don,
    subvention...) ou sortie (dépense). Une entrée est enregistrée directement
    par le Trésorier. Une sortie doit être confirmée par le reste du bureau
    (voir ConfirmationMouvement) pour garder une trace vérifiable en fin de
    mandat : qui a validé quelle dépense, et quand.
    """

    class Type(models.TextChoices):
        ENTREE = 'ENTREE', 'Entrée'
        SORTIE = 'SORTIE', 'Sortie'

    type_mouvement = models.CharField(max_length=10, choices=Type.choices)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    motif = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()

    initiee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='mouvements_caisse_inities',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Mouvement de caisse'
        verbose_name_plural = 'Mouvements de caisse'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.get_type_mouvement_display()} — {self.montant} — {self.motif}"

    @property
    def statut_global(self):
        """Pour une SORTIE : EN_ATTENTE / CONFIRME (unanimité) / DECLINE (au
        moins un refus). Une ENTREE n'a pas de workflow de validation, donc
        pas de statut. Logique centralisée ici (plutôt que dans le
        serializer) pour être réutilisable côté calculs (ex: solde)."""
        if self.type_mouvement == self.Type.ENTREE:
            return None
        decisions = [c.decision for c in self.confirmations.all()]
        if not decisions:
            return 'CONFIRME'  # aucun autre membre du bureau à consulter
        if 'DECLINE' in decisions:
            return 'DECLINE'
        if all(d == 'CONFIRME' for d in decisions):
            return 'CONFIRME'
        return 'EN_ATTENTE'


class ConfirmationMouvement(models.Model):
    """
    Une ligne par membre du bureau devant se prononcer sur une SORTIE.
    Créées automatiquement (en attente) à la création du mouvement, pour
    savoir exactement qui doit encore répondre.
    """

    class Decision(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        CONFIRME = 'CONFIRME', 'Confirmé'
        DECLINE = 'DECLINE', 'Décliné'

    mouvement = models.ForeignKey(
        MouvementCaisse, on_delete=models.CASCADE, related_name='confirmations',
    )
    membre = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    decision = models.CharField(
        max_length=10, choices=Decision.choices, default=Decision.EN_ATTENTE,
    )
    date_decision = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Confirmation de mouvement'
        verbose_name_plural = 'Confirmations de mouvement'
        unique_together = ('mouvement', 'membre')

    def __str__(self):
        nom = getattr(self.membre, 'nom_complet', str(self.membre))
        return f"{nom} — {self.get_decision_display()}"