from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    ordering = ('nom', 'prenom')
    list_display = ('matricule', 'nom_complet', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('matricule', 'nom', 'prenom')

    fieldsets = (
        (None, {'fields': ('matricule', 'password')}),
        ('Informations personnelles', {'fields': ('nom', 'prenom', 'telephone', 'photo', 'membre_depuis')}),
        ('Rôle & permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('matricule', 'nom', 'prenom', 'membre_depuis', 'role', 'password1', 'password2'),
        }),
    )
