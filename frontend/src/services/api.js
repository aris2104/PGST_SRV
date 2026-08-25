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
// 2. Gestion du refresh token
// ============================================================
// Note : le cache hors-ligne des données (GET) est géré exclusivement par
// le Service Worker (voir src/sw.js, stratégie NetworkFirst + Cache
// Storage). On a RETIRÉ ici un cache parallèle qui stockait chaque
// réponse dans localStorage : ce stockage est petit (5-10 Mo selon les
// navigateurs) et partagé avec les jetons de connexion. En le remplissant
// avec des données volumineuses (listes de membres, cotisations...), on
// augmentait le risque que le navigateur "fasse le ménage" dans ce
// stockage sous pression (notamment après un swipe de l'app) — ce qui
// emportait aussi les jetons de connexion avec lui, forçant une
// reconnexion. Le Service Worker utilise un espace de stockage séparé et
// bien plus grand (Cache Storage), sans ce risque.

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
  (response) => response,

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
    // Signalement d'absence de réseau (le Service Worker a déjà tenté
    // de servir une réponse en cache avant que ça n'arrive jusqu'ici ;
    // si on arrive quand même là, c'est qu'aucune donnée en cache
    // n'existait pour cette requête précise).
    // ========================================================
    if (!error.response) {
      error.isOffline = true
      error.friendlyMessage = "Pas de connexion. Vérifie ton réseau et réessaie."
    }

    return Promise.reject(error)
  }
)

export default api