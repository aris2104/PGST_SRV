import api from './api'

export const supportService = {
  async getMesMessages() {
    const { data } = await api.get('/support/messages/')
    return data.results ?? data
  },

  async envoyerMessage(sujet, contenu) {
    const { data } = await api.post('/support/messages/', { sujet, contenu })
    return data
  },

  /** Réservé à l'Admin */
  async repondreMessage(id, reponse) {
    const { data } = await api.patch(`/support/messages/${id}/`, { reponse })
    return data
  },
}