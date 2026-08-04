import api from './api'

export const userService = {
  async getMe() {
    const { data } = await api.get('/users/me/')
    return data
  },

  async updateMe(payload) {
    const { data } = await api.patch('/users/me/', payload)
    return data
  },

  async getNotificationPreferences() {
    const { data } = await api.get('/users/notifications-preferences/')
    return data
  },

  async updateNotificationPreferences(payload) {
    const { data } = await api.patch('/users/notifications-preferences/', payload)
    return data
  },

  async changerMotDePasse(ancienMotDePasse, nouveauMotDePasse) {
    const { data } = await api.post('/users/changer-mot-de-passe/', {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    })
    return data
  },
}