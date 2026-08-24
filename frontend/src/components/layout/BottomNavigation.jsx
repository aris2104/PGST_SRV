import { NavLink } from 'react-router-dom'
import { Home, Calendar, User, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getRoleConfig } from '../../utils/roleConfig'

// Précharge silencieuse des 4 onglets principaux dès le premier touch/survol.
// Comme ils sont en lazy dans AppRoutes, React les télécharge à la demande —
// mais avec ce prefetch, le bundle est déjà en cache avant le clic, donc la
// navigation est instantanée même sur connexion lente.
const PREFETCH = {
  '/accueil': () => import('../../pages/home/HomePage'),
  '/calendrier': () => import('../../pages/calendar/CalendarPage'),
  '/suivis': () => import('../../pages/suivis/SuivisDashboard'),
  '/parametres': () => import('../../pages/settings/SettingsPage'),
}

export default function BottomNavigation() {
  const { user } = useAuth()
  // Le libellé du 3e onglet dépend du rôle (ROLE_CONFIG) au lieu d'être
  // codé en dur sur "Suivis" pour tout le monde.
  const { suiviLabel, suiviRoute } = getRoleConfig(user?.role?.code)

  const ITEMS = [
    { to: '/accueil', icon: Home, label: 'Accueil' },
    { to: '/calendrier', icon: Calendar, label: 'Calendrier' },
    { to: suiviRoute, icon: User, label: suiviLabel },
    { to: '/parametres', icon: Settings, label: 'Paramètres' },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 min-h-16 bg-white dark:bg-slate-800 border-t border-neutral-200 dark:border-slate-700 flex items-center justify-around max-w-md mx-auto z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onMouseEnter={() => PREFETCH[to]?.()}
          onTouchStart={() => PREFETCH[to]?.()}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 ${
              isActive ? 'text-navy dark:text-white' : 'text-neutral-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive && Icon === User ? 'currentColor' : 'none'}
                className={isActive && Icon === User ? 'text-info' : ''}
              />
              <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}