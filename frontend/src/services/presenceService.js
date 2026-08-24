import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const presenceService = {
  /** Résumé pour la carte de l'écran Suivis */
  async getResume() {
    const { data } = await api.get('/calendrier/presences/resume/')
    return data
  },

  /** Présences enregistrées */
  async getPresences(params = {}) {
    const { data } = await api.get('/calendrier/presences/', { params })
    return data.results ?? data
  },

  /** Récupérer la liste des servants */
  async getServants() {
    const { data } = await api.get('/calendrier/presences/servants/')
    return Array.isArray(data) ? data : (data.results ?? [])
  },

  /**
   * Enregistrer l'appel en lot par le bureau.
   * Fonctionne aussi hors-ligne : si la connexion est coupée, l'appel est
   * mis de côté et envoyé automatiquement dès son retour (voir
   * offlineQueue.js). Le résultat indique { queued: true } dans ce cas,
   * pour que l'écran affiche un message adapté plutôt qu'une erreur.
   */
  async enregistrerAppel(ordreDuJourId, presencesDict, label = '') {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/calendrier/presences/enregistrer_appel/',
      data: {
        ordre_du_jour: ordreDuJourId,
        presences: presencesDict,
      },
      label: label || `Appel — ordre du jour #${ordreDuJourId}`,
    })
  },
}