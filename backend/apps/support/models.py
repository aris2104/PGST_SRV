from django.conf import settings
from django.db import models


class Message(models.Model):
    """Message envoyé par un servant à l'administration (écran 'Contacter l'admin')."""

    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages_support',
    )
    sujet = models.CharField(max_length=150)
    contenu = models.TextField()

    # Réponses de l'administration
    reponse = models.TextField(blank=True)
    repondu_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reponses_support',
        verbose_name='Répondu par',
    )

    traite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(
        auto_now=True
    )  # 👈 Pratique pour savoir quand le statut/réponse a changé

    class Meta:
        verbose_name = 'Message de support'
        verbose_name_plural = 'Messages de support'
        ordering = ['-created_at']

    def __str__(self):
        # Sécurité si nom_complet n'est pas encore renseigné
        nom_auteur = getattr(self.auteur, 'nom_complet', str(self.auteur))
        return f'{self.sujet} — {nom_auteur}'