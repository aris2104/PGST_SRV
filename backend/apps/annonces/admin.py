from django.contrib import admin
from .models import Annonce


@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'portee', 'publiee_par', 'date_publication')
    list_filter = ('portee', 'date_publication')
    search_fields = ('titre', 'contenu')
    filter_horizontal = ('destinataires',)