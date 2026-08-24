import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const adminService = {
  async getMembres() {
    const { data } = await api.get('/users/')
    return data.results ?? data
  },

  async creerMembre(payload) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/users/',
      data: payload,
      label: `Nouveau membre — ${payload?.nom_complet || payload?.matricule || ''}`,
    })
  },

  async changerRole(userId, roleId) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: `/users/${userId}/`,
      data: { role: roleId },
      label: `Changement de rôle — membre #${userId}`,
    })
  },

  async toggleActif(userId, isActive) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: `/users/${userId}/`,
      data: { is_active: isActive },
      label: `${isActive ? 'Réactivation' : 'Désactivation'} — membre #${userId}`,
    })
  },

  async getActiviteRecente(page = 1, pageSize = 30, filtres = {}) {
    const { data } = await api.get('/activite/recente/', {
      params: { page, page_size: pageSize, ...filtres },
    })
    return data
  },

  async getRoles() {
    const { data } = await api.get('/roles/')
    return data.results ?? data
  },
}