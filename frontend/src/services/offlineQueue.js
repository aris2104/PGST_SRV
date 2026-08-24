import api from './api'

const STORAGE_KEY = 'pgst-offline-queue'

function lireFile() {
  try {
    const brut = localStorage.getItem(STORAGE_KEY)
    return brut ? JSON.parse(brut) : []
  } catch {
    return []
  }
}

function ecrireFile(file) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
}

/** Nombre d'actions en attente d'envoi (pour affichage dans l'interface). */
export function nombreActionsEnAttente() {
  return lireFile().length
}

/**
 * Tente d'envoyer une action d'écriture (POST/PATCH/...) tout de suite.
 * Si ça échoue à cause d'une coupure réseau (voir api.js : error.isOffline),
 * l'action est mise de côté localement au lieu de faire planter l'écran,
 * et sera rejouée automatiquement dès que la connexion revient.
 *
 * @param {object} action
 * @param {'post'|'patch'|'put'|'delete'} action.method
 * @param {string} action.url
 * @param {object} [action.data]
 * @param {string} action.label - texte lisible pour l'utilisateur (ex: "Appel du 18/08 — 3e ODJ")
 * @returns {Promise<{queued: boolean, data?: any}>}
 */
export async function envoyerOuMettreEnAttente({ method, url, data, label }) {
  try {
    const response = await api[method](url, data)
    return { queued: false, data: response.data }
  } catch (error) {
    if (!error.isOffline) {
      // Vraie erreur (droits, données invalides, etc.) : on ne la masque
      // surtout pas derrière la file d'attente, elle doit remonter telle quelle.
      throw error
    }
    const file = lireFile()
    file.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      method,
      url,
      data,
      label,
      createdAt: new Date().toISOString(),
    })
    ecrireFile(file)
    return { queued: true }
  }
}

/**
 * Rejoue dans l'ordre toutes les actions en attente. Appelée automatiquement
 * dès que la connexion revient (voir NetworkContext.jsx). S'arrête au
 * premier échec réseau (probablement encore hors-ligne par intermittence)
 * pour ne pas perdre l'ordre ; une vraie erreur métier sur un élément
 * précis le retire quand même de la file pour ne pas bloquer les suivants
 * indéfiniment.
 */
export async function viderFileAttente() {
  let file = lireFile()
  if (file.length === 0) return { envoyes: 0, restants: 0 }

  let envoyes = 0
  while (file.length > 0) {
    const action = file[0]
    try {
      await api[action.method](action.url, action.data)
      file = file.slice(1)
      ecrireFile(file)
      envoyes += 1
    } catch (error) {
      if (error.isOffline) {
        // Toujours hors-ligne (ou reconnexion instable) : on s'arrête là,
        // on réessaiera au prochain événement "online".
        break
      }
      // Erreur métier définitive (ex: réunion désormais trop ancienne) :
      // on retire l'action pour ne pas bloquer indéfiniment les suivantes.
      file = file.slice(1)
      ecrireFile(file)
    }
  }
  return { envoyes, restants: file.length }
}
