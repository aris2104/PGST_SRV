from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sanctions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sanction',
            name='amende_payee',
            field=models.BooleanField(
                default=False,
                help_text="Passe à True quand le Trésorier encaisse l'amende — génère alors une entrée de caisse.",
            ),
        ),
    ]