import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================
// 1. Ajout automatique du token JWT à chaque requête
// ============================================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pgst_access_token')

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ============================================================
// 2. Gestion du refresh token + Cache Offline
// ============================================================

let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })

  queue = []
}

api.interceptors.response.use(
  // ----------------------------------------------------------
  // Requête réussie : sauvegarde automatique en cache local
  // ----------------------------------------------------------
  (response) => {
    if (response.config && response.config.method === 'get') {
      const cacheKey = `pgst_cache_${response.config.url}`
      try {
        localStorage.setItem(cacheKey, JSON.stringify(response.data))
      } catch (e) {
        console.warn('Erreur d\'écriture dans le localStorage :', e)
      }
    }
    return response
  },

  // ----------------------------------------------------------
  // Erreur : gestion du 401 refresh et du secours hors-ligne
  // ----------------------------------------------------------
  async (error) => {
    const originalRequest = error.config

    // Sécurité : pas de config disponible
    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isAuthRoute = originalRequest.url?.includes('/auth/')

    // ========================================================
    // Si 401 : Tentative de rafraîchissement du token
    // ========================================================
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('pgst_refresh_token')

      if (!refreshToken) {
        isRefreshing = false
        const refreshError = new Error('Refresh token absent')
        processQueue(refreshError, null)

        localStorage.removeItem('pgst_access_token')
        localStorage.removeItem('pgst_refresh_token')
        localStorage.removeItem('pgst_user')

        window.location.href = '/connexion'
        return Promise.reject(refreshError)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })

        localStorage.setItem('pgst_access_token', data.access)
        if (data.refresh) {
          localStorage.setItem('pgst_refresh_token', data.refresh)
        }

        processQueue(null, data.access)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${data.access}`

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

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

    // ========================================================
    // Secours Hors-ligne : Récupération depuis le localStorage
    // ========================================================
    const isGetRequest = originalRequest.method === 'get'
    const isNetworkOrServerError = !error.response || error.response.status >= 500

    if (isGetRequest && isNetworkOrServerError) {
      const cacheKey = `pgst_cache_${originalRequest.url}`
      const cachedData = localStorage.getItem(cacheKey)

      if (cachedData) {
        try {
          // Renvoie une fausse réponse HTTP 200 contenant les données en cache
          return Promise.resolve({
            data: JSON.parse(cachedData),
            status: 200,
            statusText: 'OK (Cache Local)',
            headers: {},
            config: originalRequest,
            isOfflineData: true,
          })
        } catch (e) {
          console.warn('Erreur lors de la lecture du cache local :', e)
        }
      }
    }

    // ========================================================
    // Signalement d'absence de réseau si aucun cache n'existe
    // ========================================================
    if (!error.response) {
      error.isOffline = true
      error.friendlyMessage = "Pas de connexion. Vérifie ton réseau et réessaie."
    }

    return Promise.reject(error)
  }
)

export default api