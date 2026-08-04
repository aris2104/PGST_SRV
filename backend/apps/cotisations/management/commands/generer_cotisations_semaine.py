from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.cotisations.models import Cotisation


class Command(BaseCommand):
    help = (
        "Crée la ligne de cotisation (statut IMPAYE) de la semaine en cours pour "
        "chaque servant actif, si elle n'existe pas déjà. À lancer une fois par "
        "semaine (ex: chaque lundi via une tâche planifiée / cron)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--montant', type=float, default=500,
            help="Montant attendu par semaine (défaut: 500).",
        )

    def handle(self, *args, **options):
        from apps.users.models import User

        today = date.today()
        lundi = today - timedelta(days=today.weekday())
        numero_semaine = ((lundi.day - 1) // 7) + 1
        montant = options['montant']

        crees = 0
        for servant in User.objects.filter(is_active=True):
            _, created = Cotisation.objects.get_or_create(
                servant=servant,
                annee=lundi.year,
                mois=lundi.month,
                numero_semaine=numero_semaine,
                defaults={
                    'date_debut_semaine': lundi,
                    'montant': montant,
                    'statut': Cotisation.Statut.IMPAYE,
                },
            )
            if created:
                crees += 1

        self.stdout.write(self.style.SUCCESS(
            f"{crees} ligne(s) de cotisation créée(s) pour la semaine {numero_semaine} "
            f"de {lundi.month}/{lundi.year}."
        ))