from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Cotisation
from utils.notifications import envoyer_notification_push


@receiver(post_save, sender=Cotisation)
def notify_payment(sender, instance, created, **kwargs):
    """
    Envoie une notification lorsque la cotisation passe à PAYE.

    On ne notifie pas lors de la création initiale d'une cotisation IMPAYE.
    """

    if created:
        return

    if not created and instance.statut == Cotisation.Statut.PAYE:
        envoyer_notification_push(
    servant=instance.servant,
    title="Cotisation confirmée",
    body="Votre cotisation a bien été validée !",
    url="/cotisations"
)