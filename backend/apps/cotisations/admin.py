from django.contrib import admin
from .models import Cotisation


@admin.register(Cotisation)
class CotisationAdmin(admin.ModelAdmin):
    list_display = ('servant', 'mois', 'annee', 'numero_semaine', 'statut', 'montant')
    list_filter = ('statut', 'annee', 'mois')
    search_fields = ('servant__nom', 'servant__prenom', 'servant__matricule')
