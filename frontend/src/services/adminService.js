import api from './api'

export const adminService = {
  async getMembres() {
    const { data } = await api.get('/users/')
    return data.results ?? data
  },

  async creerMembre(payload) {
    const { data } = await api.post('/users/', payload)
    return data
  },

  async changerRole(userId, roleId) {
    const { data } = await api.patch(`/users/${userId}/`, { role: roleId })
    return data
  },

  async toggleActif(userId, isActive) {
    const { data } = await api.patch(`/users/${userId}/`, { is_active: isActive })
    return data
  },

  async getActiviteRecente(page = 1, pageSize = 30) {
    const { data } = await api.get('/activite/recente/', { params: { page, page_size: pageSize } })
    return data
  },

  async getRoles() {
    const { data } = await api.get('/roles/')
    return data.results ?? data
  },
}