import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './router/AppRoutes'
import { usePendingRapportPDF } from './hooks/usePendingRapportPDF'

function AppInner() {
  usePendingRapportPDF()
  useEffect(() => {
    document.getElementById('splash')?.remove()
  }, [])
  return <AppRoutes />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  )
}