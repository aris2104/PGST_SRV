from django.db import migrations


def seed_roles(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    Role.objects.get_or_create(
        code='CEREMONIAIRE',
        defaults={
            'libelle': 'Cérémoniaire',
            'description': "Choisit les servants pour chaque messe (le Président garde aussi cette main).",
        },
    )
    Role.objects.get_or_create(
        code='CONSEILLER',
        defaults={
            'libelle': 'Conseiller',
            'description': "Membre du bureau à titre honorifique, sans accès de gestion dans l'application.",
        },
    )


def unseed_roles(apps, schema_editor):
    Role = apps.get_model('roles', 'Role')
    Role.objects.filter(code__in=['CEREMONIAIRE', 'CONSEILLER']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0002_add_ceremoniaire_conseiller'),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]