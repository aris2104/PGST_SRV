import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

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
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/annonces/',
      data: payload,
      label: `Annonce — ${payload?.titre || ''}`,
    })
  },

  async creerMesse(payload) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/calendrier/messes/',
      data: payload,
      label: 'Nouvelle messe',
    })
  },

  async creerOrdreDuJour(payload) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/calendrier/ordre-du-jour/',
      data: payload,
      label: `Ordre du jour — ${payload?.titre || payload?.date || ''}`,
    })
  },
  /** Réservé à l'Organisateur/Admin : modifier un ordre du jour existant (réversible) */
  async modifierOrdreDuJour(id, payload) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: `/calendrier/ordre-du-jour/${id}/`,
      data: payload,
      label: `Modification ordre du jour #${id}`,
    })
  },
  async getResumePresences() {
    const { data } = await api.get('/calendrier/presences/resume/')
    return data
  },
}