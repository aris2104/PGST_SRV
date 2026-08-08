import json
from pywebpush import webpush, WebPushException
from django.conf import settings


def envoyer_notification_push(servant, title, body, url='/', type_notification=None):
    """
    Envoie une notification push à tous les abonnements actifs d'un servant.
    Supprime automatiquement les abonnements expirés/invalides (404/410),
    pour ne pas réessayer indéfiniment sur un appareil qui a désinstallé l'app.
    """
    payload = {'title': title, 'body': body, 'url': url}
    if type_notification:
        payload['type'] = type_notification

    for sub in servant.push_subscriptions.all():
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': settings.VAPID_ADMIN_EMAIL},
            )
        except WebPushException as e:
            status_code = getattr(e.response, 'status_code', None)
            if status_code in (404, 410):
                sub.delete()