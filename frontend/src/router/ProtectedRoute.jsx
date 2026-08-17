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

  const roleCode = user?.role?.code
  // Le Super Admin a au moins tous les droits de l'Admin (et plus, géré
  // au cas par cas côté backend) : toute route ouverte à ADMIN doit
  // aussi l'être pour SUPER_ADMIN, sans avoir à le lister partout.
  const rolesEffectifs = allowedRoles?.includes('ADMIN')
    ? [...allowedRoles, 'SUPER_ADMIN']
    : allowedRoles

  if (rolesEffectifs && !rolesEffectifs.includes(roleCode)) {
    return <Navigate to="/accueil" replace />
  }

  return children
}