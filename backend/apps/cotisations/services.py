from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Cotisation


User = get_user_model()


def _premier_jour_semaine(date_reference):
    """
    Retourne le lundi de la semaine contenant date_reference.
    """
    return date_reference - timedelta(days=date_reference.weekday())


def _semaines_du_mois(annee, mois):
    """
    Retourne les semaines dont le lundi appartient au mois demandé.

    On génère au maximum 5 semaines par mois, conformément au modèle
    numero_semaine = 1..5.
    """
    premier_jour = date(annee, mois, 1)

    if mois == 12:
        premier_jour_mois_suivant = date(annee + 1, 1, 1)
    else:
        premier_jour_mois_suivant = date(annee, mois + 1, 1)

    lundi = _premier_jour_semaine(premier_jour)

    semaines = []

    while lundi < premier_jour_mois_suivant and len(semaines) < 5:
        if lundi.month == mois:
            semaines.append(lundi)
        lundi += timedelta(days=7)

    return semaines


@transaction.atomic
def assurer_cotisations_dues(user):
    """
    Crée les cotisations IMPAYE manquantes pour l'utilisateur
    jusqu'à la semaine courante.

    Les cotisations déjà existantes ne sont jamais modifiées.
    """

    if not user or not user.is_active:
        return

    aujourd_hui = date.today()

    # L'utilisateur ne peut pas avoir de cotisation avant son arrivée.
    date_reference = max(user.membre_depuis, aujourd_hui)

    # On génère uniquement le mois courant.
    annee = aujourd_hui.year
    mois = aujourd_hui.month

    semaines = _semaines_du_mois(annee, mois)

    for numero_semaine, lundi in enumerate(semaines, start=1):

        # Ne pas créer une cotisation pour une semaine future.
        if lundi > aujourd_hui:
            continue

        # Ne pas créer une cotisation avant l'entrée du servant.
        if lundi < user.membre_depuis:
            continue

        Cotisation.objects.get_or_create(
            servant=user,
            annee=annee,
            mois=mois,
            numero_semaine=numero_semaine,
            defaults={
                'date_debut_semaine': lundi,
                'montant': 0,
                'statut': Cotisation.Statut.IMPAYE,
            },
        )


def assurer_cotisations_dues_pour_tous():
    """
    Génère les cotisations dues pour tous les servants actifs.
    """

    users = User.objects.filter(is_active=True)

    for user in users:
        assurer_cotisations_dues(user)