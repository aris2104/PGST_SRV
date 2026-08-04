import api from './api'

export const authService = {
  /**
   * Connexion par matricule (ex: SRV-AriskPes) + mot de passe.
   * Correspond à l'écran de connexion de la maquette.
   */
  async login(matricule, password) {
    const { data } = await api.post('/auth/login/', { matricule, password })
    localStorage.setItem('pgst_access_token', data.access)
    localStorage.setItem('pgst_refresh_token', data.refresh)
    localStorage.setItem('pgst_user', JSON.stringify(data.user))
    return data.user
  },

  logout() {
    localStorage.removeItem('pgst_access_token')
    localStorage.removeItem('pgst_refresh_token')
    localStorage.removeItem('pgst_user')
  },

  getStoredUser() {
    const raw = localStorage.getItem('pgst_user')
    return raw ? JSON.parse(raw) : null
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('pgst_access_token'))
  },
}
