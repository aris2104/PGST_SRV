import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NetworkProvider } from './context/NetworkContext'
import OfflineBanner from './components/layout/OfflineBanner'
import AppRoutes from './router/AppRoutes'
import { usePendingRapportPDF } from './hooks/usePendingRapportPDF'

function AppInner() {
  usePendingRapportPDF()
  useEffect(() => {
    document.getElementById('splash')?.remove()
  }, [])
  return (
    <>
      <OfflineBanner />
      <AppRoutes />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </BrowserRouter>
      </NetworkProvider>
    </ThemeProvider>
  )
}