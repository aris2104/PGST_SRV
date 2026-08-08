import { Outlet } from 'react-router-dom'
import BottomNavigation from '../components/layout/BottomNavigation'

export default function AppLayout() {
  return (
    <div className="min-h-dvh bg-surface flex justify-center">
      <div
        className="w-full max-w-md bg-surface relative"
        style={{
          minHeight: '100dvh',
          paddingBottom: 'calc(4rem + 1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Outlet />
        <BottomNavigation />
      </div>
    </div>
  )
}