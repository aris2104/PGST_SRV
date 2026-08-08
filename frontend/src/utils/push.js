// Fonction utilitaire pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fonction principale pour s'abonner aux notifications push
export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Les notifications push ne sont pas supportées par ce navigateur.");
    return false;
  }

  try {
    // 1. Attendre que le Service Worker soit prêt
    const registration = await navigator.serviceWorker.ready;

    // 2. Demander la permission d'afficher des notifications
    const permissionResult = await window.Notification.requestPermission();
    if (permissionResult !== 'granted') {
      throw new Error("Permission de notification refusée par l'utilisateur.");
    }

    // 3. Récupérer la clé publique VAPID depuis les variables d'environnement Vite
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      throw new Error("La clé VAPID publique est absente du fichier .env du frontend.");
    }

    // 4. S'abonner auprès du Push Manager du navigateur
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // 5. Extraire les clés de chiffrement nécessaires pour le backend
    const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))));
    const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))));

    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: p256dh,
      auth: auth
    };

    // 6. Envoyer l'abonnement à notre API Django via notre service axios sécurisé
    // (Assure-toi d'importer ton instance api depuis ton service)
    const { default: api } = await import('../services/api');
    await api.post('/users/push-subscriptions/', subscriptionData);

    console.log("Abonnement aux notifications push réussi !");
    return true;

  } catch (error) {
    console.error("Erreur lors de l'abonnement aux notifications push :", error);
    return false;
  }
}
