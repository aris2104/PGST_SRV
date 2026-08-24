import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { prechargerDonneesHorsLigne } from '../services/offlinePrefetch'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Rafraîchit le profil au chargement si un token est déjà présent
    async function bootstrap() {
      if (authService.isAuthenticated()) {
        try {
          const freshUser = await userService.getMe()
          setUser(freshUser)
          // On profite d'être en ligne (cet appel a réussi) pour précharger
          // en tâche de fond tout ce qu'il faut pour le mode hors-ligne.
          prechargerDonneesHorsLigne()
        } catch (err) {
          // Ne déconnecte que si le serveur a explicitement rejeté le token (401).
          // Une erreur réseau (tunnel expiré, timeout, CORS...) ne doit PAS
          // effacer la session : on garde l'utilisateur en cache local.
          if (err.response?.status === 401) {
            authService.logout()
            setUser(null)
          }
        }
      }
      setLoading(false)
    }
    bootstrap()
  }, [])

  const login = useCallback(async (matricule, password) => {
    const loggedInUser = await authService.login(matricule, password)
    setUser(loggedInUser)
    // Idem : dès la connexion réussie, on précharge tout pour le hors-ligne.
    prechargerDonneesHorsLigne()
    return loggedInUser
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}