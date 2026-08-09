import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protège une route : redirige vers /connexion si non authentifié.
 * `allowedRoles` (optionnel) : restreint l'accès à certains codes de rôle.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#24365A' }}>
        <div className="w-10 h-10 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role?.code)) {
    return <Navigate to="/accueil" replace />
  }

  return children
}