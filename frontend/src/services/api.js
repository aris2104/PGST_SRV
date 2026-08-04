import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attache le token d'accès à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pgst_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Rafraîchit automatiquement le token en cas de 401, puis rejoue la requête
let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthRoute = originalRequest.url?.includes('/auth/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = localStorage.getItem('pgst_refresh_token')

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        localStorage.setItem('pgst_access_token', data.access)
        processQueue(null, data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Le refresh token n'est vraiment invalide que si le serveur a répondu
        // (400/401). Si refreshError.response est absent, c'est une coupure
        // réseau (tunnel expiré, timeout...) -> on garde la session, l'utilisateur
        // pourra réessayer quand la connexion reviendra.
        if (refreshError.response) {
          localStorage.removeItem('pgst_access_token')
          localStorage.removeItem('pgst_refresh_token')
          localStorage.removeItem('pgst_user')
          window.location.href = '/connexion'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api