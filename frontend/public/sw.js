// Service Worker PGST
// Injecté par vite-plugin-pwa (mode injectManifest).
// precacheAndRoute active le cache offline des assets (JS/CSS/images) —
// sans cet appel, self.__WB_MANIFEST est injecté mais ne sert à rien.
import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'PGST', body: event.data.text() }
  }

  const { title, body, url } = payload

  // Toute notification (normale ou type RAPPORT_PDF) ouvre simplement l'URL
  // fournie au clic. Pour un rapport, le backend envoie url="/rapport?auto=1" :
  // la page RapportPage détecte ce paramètre et lance l'export PDF
  // automatiquement dès que les données sont chargées — ça marche même si
  // l'app était complètement fermée, sans rien stocker en local.
  event.waitUntil(
    self.registration.showNotification(title ?? 'PGST', {
      body: body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.postMessage({ type: 'NAVIGATE', url })
      } else {
        clients.openWindow(url)
      }
    })
  )
})