import { Outlet } from 'react-router-dom'
import BottomNavigation from '../components/layout/BottomNavigation'

export default function AppLayout() {
  return (
    <div className="fixed inset-0 bg-surface flex justify-center overflow-y-auto">
      <div
        className="w-full max-w-md bg-surface relative"
        style={{
          minHeight: '100%',
          paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Outlet />
        <BottomNavigation />
      </div>
    </div>
  )
}