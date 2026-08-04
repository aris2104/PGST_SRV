import { useState, useEffect } from 'react'
import { ChevronLeft, Bell, BellRing } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { subscribeUserToPush } from '../../utils/push'

export default function Header({ title, subtitle, showBack = false, onBack }) {
  const navigate = useNavigate()
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    // Vérifie au chargement si la permission est déjà accordée
    if ('Notification' in window && window.Notification.permission === 'granted') {
      setIsSubscribed(true)
    }
  }, [])

  const handleBack = () => {
    if (onBack) return onBack()
    navigate(-1)
  }

  const handleBellClick = async () => {
    if (isSubscribed) {
      alert("Les notifications push sont déjà actives sur cet appareil.")
      return
    }

    const success = await subscribeUserToPush()
    if (success) {
      setIsSubscribed(true)
      alert("Notifications activées avec succès ! Tu recevras désormais les alertes.")
    } else {
      alert("Impossible d'activer les notifications. Vérifie les paramètres de ton navigateur.")
    }
  }

  return (
    <header
      className="bg-header text-white px-5 pb-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <div className="flex items-center justify-between">
        {/* Partie gauche : Bouton retour + Titre / Sous-titre */}
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Retour"
              className="p-1 -ml-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <ChevronLeft size={33} />
            </button>
          )}
          <div>
            {subtitle && <p className="text-sm font-medium opacity-90">{subtitle}</p>}
            <h1 className={showBack ? 'text-lg font-bold' : 'text-2xl font-bold'}>
              {title}
            </h1>
          </div>
        </div>

        {/* Partie droite : Cloche de notification push */}
        <button
          onClick={handleBellClick}
          title={isSubscribed ? "Notifications activées" : "Activer les notifications"}
          className={`p-2 rounded-full transition-colors relative ${
            isSubscribed 
              ? 'text-emerald-300 bg-white/10 hover:bg-white/20' 
              : 'text-white/80 hover:bg-white/10'
          }`}
        >
          {isSubscribed ? <BellRing size={22} /> : <Bell size={22} />}
          {!isSubscribed && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    </header>
  )
}