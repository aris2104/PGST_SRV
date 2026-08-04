import api from './api'

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

  /** Enregistrer l'appel en lot par le bureau */
  async enregistrerAppel(ordreDuJourId, presencesDict) {
    const { data } = await api.post('/calendrier/presences/enregistrer_appel/', {
      ordre_du_jour: ordreDuJourId,
      presences: presencesDict,
    })
    return data
  },
}