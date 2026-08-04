from django.contrib import admin
from .models import Sanction


@admin.register(Sanction)
class SanctionAdmin(admin.ModelAdmin):
    list_display = ('servant', 'type_sanction', 'statut', 'date_decision', 'decidee_par')
    list_filter = ('type_sanction', 'statut', 'date_decision')
    search_fields = ('servant__nom', 'servant__prenom', 'servant__matricule', 'motif')
    date_hierarchy = 'date_decision'
