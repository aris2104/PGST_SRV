from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='role',
            name='code',
            field=models.CharField(
                choices=[
                    ('PRESIDENT', 'Président'),
                    ('SECRETAIRE', 'Secrétaire'),
                    ('TRESORIER', 'Trésorier'),
                    ('DISCIPLINAIRE', 'Responsable disciplinaire'),
                    ('ORGANISATEUR', 'Organisateur'),
                    ('CEREMONIAIRE', 'Cérémoniaire'),
                    ('CONSEILLER', 'Conseiller'),
                    ('ADMIN', 'Administrateur'),
                    ('SERVANT', 'Servant'),
                ],
                max_length=20,
                unique=True,
            ),
        ),
    ]