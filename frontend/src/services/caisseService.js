import api from './api'

export const caisseService = {
  async getMouvements() {
    const { data } = await api.get('/caisse/mouvements/')
    return data.results ?? data
  },

  async creerMouvement(payload) {
    const { data } = await api.post('/caisse/mouvements/', payload)
    return data
  },

  async getMesConfirmations() {
    const { data } = await api.get('/caisse/mouvements/mes_confirmations/')
    return data
  },

  async statuer(mouvementId, decision) {
    const { data } = await api.post(`/caisse/mouvements/${mouvementId}/statuer/`, { decision })
    return data
  },
}