@receiver(post_save, sender=Message)
def notify_new_message(sender, instance, created, **kwargs):
    if created:
        send_user_push(
            user=instance.recipient,
            title="Nouveau message",
            message=instance.content[:50],
            url=f"/support/chat/{instance.conversation_id}"
        )