import api from './api'

export const sanctionService = {
  /** Bloc 'Sanctions' de l'écran Suivis : "Aucune sanction active" ou nombre actif */
  async getActives() {
    const { data } = await api.get('/sanctions/actives/')
    return data
  },

  /** Écran Historique des sanctions : liste complète, la plus récente en premier */
  async getHistorique(servantId = null) {
    const params = servantId ? { servant: servantId } : {}
    const { data } = await api.get('/sanctions/', { params })
    return data.results ?? data
  },

  /** Réservé au rôle Disciplinaire : infliger une sanction */
  async creer(payload) {
    const { data } = await api.post('/sanctions/', payload)
    return data
  },
}
