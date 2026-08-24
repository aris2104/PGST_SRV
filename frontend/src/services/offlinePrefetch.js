import api from './api'

/**
 * Liste des lectures (GET) à précharger pour couvrir l'ensemble des écrans
 * de l'app, tous rôles confondus. Le serveur filtre déjà ce que chaque
 * utilisateur a le droit de voir (un Servant simple recevra une liste vide
 * ou un 403 sur les endpoints réservés au bureau, par exemple) — on ignore
 * silencieusement les échecs un par un pour ne jamais bloquer les autres.
 *
 * Objectif : qu'un rôle qui n'a encore JAMAIS cliqué sur "Sanctions" ou
 * "Membres" trouve quand même ces pages utilisables hors-ligne, parce que
 * la donnée a déjà été récupérée une fois en tâche de fond pendant qu'il
 * était connecté — pas besoin d'avoir visité chaque écran soi-même avant
 * de perdre le réseau.
 */
function listeEndpointsAPrecharger() {
  const maintenant = new Date()
  const annee = maintenant.getFullYear()
  const mois = maintenant.getMonth() + 1
  const dateJour = maintenant.toISOString().slice(0, 10)

  return [
    '/users/me/',
    '/users/',
    '/roles/',
    '/annonces/',
    '/calendrier/ordre-du-jour/',
    `/calendrier/messes/cette_semaine/?date=${dateJour}`,
    `/calendrier/messes/mes_messes/?date=${dateJour}`,
    '/calendrier/presences/',
    '/calendrier/presences/resume/',
    '/calendrier/presences/servants/',
    '/support/messages/',
    '/sanctions/',
    '/sanctions/actives/',
    '/caisse/mouvements/',
    '/caisse/mouvements/mes_confirmations/',
    '/caisse/mouvements/solde/',
    `/cotisations/?annee=${annee}&mois=${mois}`,
    '/cotisations/resume/',
    '/activite/recente/',
  ]
}

let enCours = false

/**
 * Lance le préchargement de tout ce qui précède, en tâche de fond, sans
 * jamais faire planter l'appelant (chaque requête est indépendante).
 * Protégé contre les appels concurrents (un seul passage à la fois).
 */
export async function prechargerDonneesHorsLigne() {
  if (enCours) return
  enCours = true
  try {
    await Promise.allSettled(
      listeEndpointsAPrecharger().map((url) => api.get(url))
    )
  } finally {
    enCours = false
  }
}