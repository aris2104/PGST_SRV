// Service Worker PGST
// Injecté par vite-plugin-pwa (mode injectManifest).
// precacheAndRoute active le cache offline des assets (JS/CSS/images) —
// sans cet appel, self.__WB_MANIFEST est injecté mais ne sert à rien.
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

precacheAndRoute(self.__WB_MANIFEST)

// ----------------------------------------------------------------
// MISE À JOUR AUTOMATIQUE — indispensable pour les vrais utilisateurs
// ----------------------------------------------------------------
// Sans ça, une nouvelle version du Service Worker reste "en attente"
// indéfiniment tant que l'utilisateur n'a pas fermé TOUS ses onglets/l'app
// puis rouvert — quelque chose qu'on ne peut pas demander à un utilisateur
// normal (contrairement à nous en développement, via DevTools →
// "skipWaiting"). On force donc l'activation immédiate de chaque nouvelle
// version dès qu'elle est prête, et elle prend le contrôle de toutes les
// pages ouvertes tout de suite (voir aussi main.jsx qui recharge la page
// une fois quand ça arrive, pour que l'utilisateur ait bien le nouveau
// code, pas juste le nouveau Service Worker en coulisses).
self.addEventListener('install', () => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ----------------------------------------------------------------
// MODE HORS-LIGNE — ouvrir/recharger n'importe quelle page de l'app
// ----------------------------------------------------------------
// C'est une SPA (une seule vraie page HTML, React Router gère le reste
// côté navigateur). Sans cette règle, recharger l'app (F5) ou ouvrir un
// lien direct vers une page précise (ex: /chapelet) alors qu'on est
// hors-ligne échoue purement et simplement — même si cette page-là n'a
// besoin d'aucune donnée du serveur (le Chapelet, par exemple, est 100%
// local). On sert donc toujours la coquille HTML mise en cache pour toute
// navigation, et React Router prend le relais normalement une fois
// l'app chargée.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    // On ne veut jamais que ce repli "avale" un appel API par erreur ;
    // en pratique NavigationRoute ne cible déjà que les vraies
    // navigations de page (pas les appels fetch/XHR), mais on l'exclut
    // explicitement par sécurité.
    denylist: [/^\/api\//],
  })
)

// ----------------------------------------------------------------
// MODE HORS-LIGNE — cache des données consultées
// ----------------------------------------------------------------
// Stratégie "réseau d'abord, secours sur le cache" : quand la connexion
// fonctionne, on récupère toujours la donnée la plus fraîche (et on la
// met à jour en cache au passage). Quand la connexion est coupée, on
// retombe automatiquement sur la dernière version connue en cache, au
// lieu d'un écran vide ou d'une erreur.
//
// On exclut volontairement /api/auth/ : rejouer une ancienne réponse de
// connexion/rafraîchissement de jeton depuis le cache serait dangereux
// (jeton périmé), ces appels doivent toujours passer par le réseau.
//
// maxEntries relevé à 400 (au lieu de 150) : avec le préchargement
// automatique multi-rôles (voir offlinePrefetch.js) et des paramètres de
// date qui varient (semaine, mois...), on veut de la marge pour que rien
// ne soit expulsé du cache avant les 7 jours prévus.
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    url.pathname.includes('/api/') &&
    !url.pathname.includes('/auth/'),
  new NetworkFirst({
    cacheName: 'pgst-api-cache',
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
)

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