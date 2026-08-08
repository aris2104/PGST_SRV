@receiver(post_save, sender=Cotisation)
def notify_sanction(sender, instance, created, **kwargs):
    if not created and instance.est_paye:
        send_user_push(
            user=instance.user,
            title="Abonnement confirmé",
            message="Votre cotisations a bien été validée !",
            url="/cotisations"
        )