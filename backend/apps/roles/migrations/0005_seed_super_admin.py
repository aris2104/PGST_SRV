from django.db import migrations


def seed_super_admin(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    Role.objects.get_or_create(
        code='SUPER_ADMIN',
        defaults={
            'libelle': 'Super Admin',
            'description': (
                "Plus de pouvoir que l'Admin : seul lui peut créer, "
                "modifier ou supprimer le compte d'un Admin (ou d'un "
                "autre Super Admin). Garde par ailleurs tous les droits "
                "de l'Admin."
            ),
        },
    )


def unseed_super_admin(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    Role.objects.filter(code='SUPER_ADMIN').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0004_alter_role_code'),
    ]

    operations = [
        migrations.RunPython(seed_super_admin, unseed_super_admin),
    ]