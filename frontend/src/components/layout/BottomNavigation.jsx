import { NavLink } from 'react-router-dom'
import { Home, Calendar, User, Settings } from 'lucide-react'

const ITEMS = [
  { to: '/accueil', icon: Home, label: 'Accueil' },
  { to: '/calendrier', icon: Calendar, label: 'Calendrier' },
  { to: '/suivis', icon: User, label: 'Suivis' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
]

export default function BottomNavigation() {
  return (
    <nav
  className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 flex justify-around pt-2 max-w-md mx-auto z-50"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
>
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 ${
              isActive ? 'text-navy' : 'text-neutral-400'
            }`
          }
        >
          {({ isActive }) => (
            <Icon
              size={24}
              strokeWidth={isActive ? 2.5 : 2}
              fill={isActive && Icon === User ? 'currentColor' : 'none'}
              className={isActive && Icon === User ? 'text-info' : ''}
            />
          )}
        </NavLink>
      ))}
    </nav>
  )
}
