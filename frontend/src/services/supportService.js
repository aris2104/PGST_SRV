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
}