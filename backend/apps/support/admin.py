from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sujet', 'auteur', 'traite', 'created_at')
    list_filter = ('traite', 'created_at')
    search_fields = ('sujet', 'contenu', 'auteur__nom', 'auteur__prenom')