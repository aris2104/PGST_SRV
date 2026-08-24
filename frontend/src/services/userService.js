import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const userService = {
  async getMe() {
    const { data } = await api.get('/users/me/')
    return data
  },

  async updateMe(payload) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: '/users/me/',
      data: payload,
      label: 'Modification de mon profil',
    })
  },

  async getNotificationPreferences() {
    const { data } = await api.get('/users/notifications-preferences/')
    return data
  },

  async updateNotificationPreferences(payload) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: '/users/notifications-preferences/',
      data: payload,
      label: 'Préférences de notifications',
    })
  },

  // changerMotDePasse reste volontairement EN DEHORS de la file d'attente
  // hors-ligne : une action de sécurité comme celle-ci doit toujours
  // réussir ou échouer immédiatement, jamais rester silencieusement "en
  // attente" (risque de confusion si le mot de passe change entretemps).
  async changerMotDePasse(ancienMotDePasse, nouveauMotDePasse) {
    const { data } = await api.post('/users/changer-mot-de-passe/', {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    })
    return data
  },
}