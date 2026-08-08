/**
 * Écoute les messages envoyés par le service worker quand une notification
 * push est cliquée pendant que l'app est déjà ouverte en arrière-plan, et
 * navigue vers l'URL demandée (ex: /rapport?auto=1 pour un rapport).
 *
 * Si l'app était complètement fermée, le service worker ouvre directement
 * cette URL via clients.openWindow() — pas besoin de logique ici dans ce cas,
 * le routeur prend le relais normalement au chargement de la page.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function usePendingRapportPDF() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator)) return

    const handleSWMessage = (e) => {
      if (e.data?.type === 'NAVIGATE' && e.data.url) {
        navigate(e.data.url)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleSWMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage)
  }, [isAuthenticated, navigate])
}