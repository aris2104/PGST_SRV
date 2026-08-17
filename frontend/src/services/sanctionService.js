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

  /** Réservé à l'Admin : corriger une sanction déjà créée (irréversible pour le Disciplinaire) */
  async modifier(id, payload) {
    const { data } = await api.patch(`/sanctions/${id}/`, payload)
    return data
  },

  /** Réservé à l'Admin : annuler/supprimer une sanction */
  async supprimer(id) {
    await api.delete(`/sanctions/${id}/`)
  },
}