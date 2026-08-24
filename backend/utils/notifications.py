import json
import logging
from django.conf import settings
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


def envoyer_notification_push(
    servant, title, body, url="/", type_notification=None
):
    """Envoie une notification push à tous les abonnements actifs d'un servant.

    Supprime automatiquement les abonnements expirés/invalides (404/410), pour
    ne pas réessayer indéfiniment sur un appareil qui a désinstallé l'app.

    Toute erreur est journalisée mais jamais relancée : un souci de
    notification (clé VAPID absente, réseau, etc.) ne doit jamais faire
    échouer l'action métier qui a déclenché l'envoi (publier une annonce,
    valider une sanction, etc.).
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning(
            "Notification push ignorée pour %s : VAPID_PRIVATE_KEY/"
            "VAPID_PUBLIC_KEY absentes de la configuration (.env backend).",
            servant,
        )
        return

    payload = {"title": title, "body": body, "url": url}
    if type_notification:
        payload["type"] = type_notification

    for sub in servant.push_subscriptions.all():
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_ADMIN_EMAIL},
            )
        except WebPushException as e:
            status_code = getattr(e.response, "status_code", None)
            if status_code in (404, 410):
                sub.delete()
            elif status_code in (401, 403):
                # Clé VAPID différente de celle utilisée lors de
                # l'abonnement (ex: rotation des clés) : cet abonnement est
                # définitivement mort, on le supprime pour ne pas réessayer
                # indéfiniment. Le frontend se réabonnera de lui-même au
                # prochain appel de subscribeUserToPush().
                logger.warning(
                    "Abonnement push invalide (clé VAPID obsolète) pour %s, "
                    "suppression.", servant,
                )
                sub.delete()
            else:
                logger.error("Échec d'envoi push à %s : %s", servant, e)
        except Exception:
            # Filet de sécurité : ne jamais laisser une erreur inattendue
            # (réseau, etc.) remonter jusqu'à l'action métier appelante.
            logger.exception("Erreur inattendue lors de l'envoi push à %s", servant)