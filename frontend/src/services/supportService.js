import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const supportService = {
  async getMesMessages() {
    const { data } = await api.get('/support/messages/')
    return data.results ?? data
  },

  async envoyerMessage(sujet, contenu) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/support/messages/',
      data: { sujet, contenu },
      label: `Message support — ${sujet}`,
    })
  },

  /** Réservé à l'Admin */
  async repondreMessage(id, reponse) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: `/support/messages/${id}/`,
      data: { reponse },
      label: `Réponse au message #${id}`,
    })
  },
}