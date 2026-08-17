import api from './api'

export const calendarService = {
  // Récupérer mes messes (avec filtre de date optionnel)
  async getMesMesses(dateStr) {
    const { data } = await api.get('/calendrier/messes/mes_messes/', {
      params: dateStr ? { date: dateStr } : {},
    })
    return data
  },

  // Récupérer le programme de la semaine (avec filtre de date optionnel)
  async getProgrammeSemaine(dateStr) {
    const { data } = await api.get('/calendrier/messes/cette_semaine/', {
      params: dateStr ? { date: dateStr } : {},
    })
    return data
  },

  async getOrdresDuJour() {
    const { data } = await api.get('/calendrier/ordre-du-jour/')
    return data.results ?? data
  },

  async getAnnonces() {
    const { data } = await api.get('/annonces/')
    return data.results ?? data
  },

  /** Réservé à l'Admin : voit toutes les annonces, y compris celles ciblées vers d'autres. */
  async getToutesAnnonces() {
    const { data } = await api.get('/annonces/toutes/')
    return data.results ?? data
  },

  async creerAnnonce(payload) {
    const { data } = await api.post('/annonces/', payload)
    return data
  },

  async creerMesse(payload) {
    const { data } = await api.post('/calendrier/messes/', payload)
    return data
  },

  async creerOrdreDuJour(payload) {
    const { data } = await api.post('/calendrier/ordre-du-jour/', payload)
    return data
  },
  /** Réservé à l'Organisateur/Admin : modifier un ordre du jour existant (réversible) */
  async modifierOrdreDuJour(id, payload) {
    const { data } = await api.patch(`/calendrier/ordre-du-jour/${id}/`, payload)
    return data
  },
  async getResumePresences() {
    const { data } = await api.get('/calendrier/presences/resume/')
    return data
  },
}