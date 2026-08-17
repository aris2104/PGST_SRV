import { Outlet, useLocation } from 'react-router-dom'
import BottomNavigation from '../components/layout/BottomNavigation'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-surface flex justify-center">
      <div
        id="pgst-app-shell"
        className="w-full max-w-md bg-surface relative"
        style={{
          minHeight: '100dvh',
          paddingBottom: 'calc(4rem + 1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* key=pathname : rejoue le fade-in à chaque changement de page,
            un petit "vivant" pas cher à l'usage sur toute l'appli. */}
        <div key={location.pathname} className="animate-fade-in">
          <Outlet />
        </div>
        <BottomNavigation />
      </div>
    </div>
  )
}