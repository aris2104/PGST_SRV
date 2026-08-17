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
// 2. Gestion automatique du refresh token en cas de 401
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
  // Requête réussie
  // ----------------------------------------------------------
  (response) => response,

  // ----------------------------------------------------------
  // Erreur
  // ----------------------------------------------------------
  async (error) => {
    const originalRequest = error.config

    // Sécurité : pas de config disponible
    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isAuthRoute = originalRequest.url?.includes('/auth/')

    // ========================================================
    // Si 401 et que ce n'est pas déjà une tentative de retry
    // et que ce n'est pas une route d'authentification
    // ========================================================
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      // ------------------------------------------------------
      // Un refresh est déjà en cours
      // ------------------------------------------------------
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve,
            reject,
          })
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${token}`

          return api(originalRequest)
        })
      }

      // ------------------------------------------------------
      // Premier refresh
      // ------------------------------------------------------
      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('pgst_refresh_token')

      // Aucun refresh token disponible
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
        // ----------------------------------------------------
        // Demande d'un nouveau access token
        // ----------------------------------------------------
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {
            refresh: refreshToken,
          }
        )

        // ----------------------------------------------------
        // Sauvegarde du nouveau access token
        // ----------------------------------------------------
        localStorage.setItem(
          'pgst_access_token',
          data.access
        )

        // ----------------------------------------------------
        // Libère les requêtes qui attendaient le refresh
        // ----------------------------------------------------
        processQueue(null, data.access)

        // ----------------------------------------------------
        // Rejoue la requête originale avec le nouveau token
        // ----------------------------------------------------
        originalRequest.headers = originalRequest.headers || {}

        originalRequest.headers.Authorization = `Bearer ${data.access}`

        return api(originalRequest)
      } catch (refreshError) {
        // ----------------------------------------------------
        // Le refresh a échoué
        // ----------------------------------------------------
        processQueue(refreshError, null)

        // ----------------------------------------------------
        // Si le serveur a répondu, le refresh token est
        // probablement réellement invalide/expiré.
        //
        // Si aucune réponse n'existe, cela peut être une
        // coupure réseau / timeout / tunnel expiré.
        // ----------------------------------------------------
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
    // Toute autre erreur
    // ========================================================
    return Promise.reject(error)
  }
)

export default api