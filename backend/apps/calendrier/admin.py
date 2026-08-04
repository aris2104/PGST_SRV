from django.contrib import admin
from .models import Messe, OrdreDuJour, Presence


@admin.register(Messe)
class MesseAdmin(admin.ModelAdmin):
    list_display = ('type_messe', 'date', 'heure', 'lieu')
    list_filter = ('type_messe', 'date')
    filter_horizontal = ('servants',)


@admin.register(OrdreDuJour)
class OrdreDuJourAdmin(admin.ModelAdmin):
    list_display = ('titre', 'date', 'cree_par')
    list_filter = ('date',)


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ('servant', 'ordre_du_jour', 'present')
    list_filter = ('present',)
    search_fields = ('servant__nom', 'servant__prenom')