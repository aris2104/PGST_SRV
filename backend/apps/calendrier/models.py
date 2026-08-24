from django.db import models
from django.conf import settings


class Messe(models.Model):
    """
    Une messe/office planifié, avec le(s) servant(s) affecté(s).
    Alimente l'écran 'Calendrier' : 'Mes messes cette semaine' et
    'Programme de cette semaine'.
    """

    class TypeMesse(models.TextChoices):
        MATINALE = 'MATINALE', 'Messe matinale'
        SOIR = 'SOIR', 'Messe du soir'
        ADORATION = 'ADORATION', "Messe d'adoration"
        AUTRE = 'AUTRE', 'Autre'

    date = models.DateField()
    heure = models.TimeField()
    type_messe = models.CharField(max_length=20, choices=TypeMesse.choices)
    # Utilisé quand type_messe = AUTRE : nom exact de la messe qui n'est pas
    # dans la liste fermée ci-dessus (ex: "Messe des malades", "Neuvaine...").
    nom_personnalise = models.CharField(max_length=150, blank=True)
    servants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='messes', blank=True,
    )
    lieu = models.CharField(max_length=150, blank=True)

    class Meta:
        verbose_name = 'Messe'
        verbose_name_plural = 'Messes'
        ordering = ['date', 'heure']

    def __str__(self):
        libelle = self.nom_personnalise if self.type_messe == self.TypeMesse.AUTRE and self.nom_personnalise else self.get_type_messe_display()
        return f"{libelle} - {self.date} {self.heure}"


class OrdreDuJour(models.Model):
    """Ordre du jour d'une réunion (ex: 'Samedi prochain : Football'), géré par l'Organisateur."""
    date = models.DateField()
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name = 'Ordre du jour'
        verbose_name_plural = 'Ordres du jour'
        ordering = ['date']

    def __str__(self):
        return f"{self.date} - {self.titre}"


class Presence(models.Model):
    """
    Présence d'un servant à une réunion (OrdreDuJour).
    Alimente le bloc 'Présence aux réunions' de l'écran Suivis.
    """
    class StatutPresence(models.TextChoices):
        PRESENT = 'PRESENT', 'Présent'
        RETARD = 'RETARD', 'En retard'
        PERMISSION = 'PERMISSION', 'Permissionné'
        ABSENT = 'ABSENT', 'Absent'

    ordre_du_jour = models.ForeignKey(
        OrdreDuJour, on_delete=models.CASCADE, related_name='presences',
    )
    servant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='presences',
    )
    statut = models.CharField(
        max_length=20,
        choices=StatutPresence.choices,
        default=StatutPresence.PRESENT,
    )
    # Champ conservé pour la rétrocompatibilité (True pour PRESENT et RETARD)
    present = models.BooleanField(default=True)
    
    enregistree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='presences_enregistrees',
    )

    class Meta:
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
        unique_together = ('ordre_du_jour', 'servant')
        ordering = ['-ordre_du_jour__date']

    def save(self, *args, **kwargs):
        # Synchronisation automatique du champ booléen
        self.present = self.statut in [
            self.StatutPresence.PRESENT, 
            self.StatutPresence.RETARD
        ]
        super().save(*args, **kwargs)

    def __str__(self):
        nom = getattr(self.servant, 'nom_complet', str(self.servant))
        return f"{nom} - {self.ordre_du_jour.date} ({self.get_statut_display()})"