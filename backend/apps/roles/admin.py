from django.contrib import admin
from .models import Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('libelle', 'code')
    search_fields = ('libelle', 'code')
