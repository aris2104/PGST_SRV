import { useState, useEffect } from 'react'
import { ChevronLeft, Bell, BellRing } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { subscribeUserToPush } from '../../utils/push'
import { useNotifications } from '../../hooks/useNotificationsBadge'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function Header({ title, subtitle, showBack = false, onBack }) {
  const navigate = useNavigate()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [panelOuvert, setPanelOuvert] = useState(false)
  const { count: badgeCount, items } = useNotifications()

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
    // 1. On ouvre/ferme toujours le panneau de notifications, peu importe le reste.
    setPanelOuvert((v) => !v)

    // 2. Si ce n'est pas encore autorisé, on demande l'autorisation navigateur
    //    (seulement la première fois — après ça, isSubscribed passe à true).
    if (!isSubscribed) {
      const success = await subscribeUserToPush()
      if (success) setIsSubscribed(true)
    }
  }

  const handleItemClick = (item) => {
    setPanelOuvert(false)
    navigate(item.target)
  }

  return (
    <header
      className="sticky top-0 z-40 bg-header text-white px-5 pb-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)',
        transform: 'translateZ(0)',
      }}
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

        {/* Partie droite : Cloche de notifications (autorisation + panneau) */}
        <div className="relative">
          <button
            onClick={handleBellClick}
            title="Notifications"
            className={`p-2 rounded-full transition-colors relative ${
              isSubscribed
                ? 'text-emerald-300 bg-white/10 hover:bg-white/20'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            {isSubscribed ? <BellRing size={22} /> : <Bell size={22} />}
            {!isSubscribed && badgeCount === 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold border-2 border-header">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {panelOuvert && (
            <>
              {/* Zone invisible pour fermer le panneau au clic extérieur */}
              <div className="fixed inset-0 z-30" onClick={() => setPanelOuvert(false)} />

              <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white text-neutral-800 rounded-card shadow-card z-40 border border-neutral-200">
                <div className="p-3 border-b border-neutral-100">
                  <p className="font-bold text-sm">Notifications</p>
                </div>
                {items.length === 0 ? (
                  <p className="p-4 text-sm text-neutral-400 text-center">Rien de nouveau pour l'instant.</p>
                ) : (
                  <ul>
                    {items.map((n) => (
                      <li key={`${n.type}-${n.id}`} className="border-b border-neutral-100 last:border-0">
                        <button
                          onClick={() => handleItemClick(n)}
                          className="w-full text-left p-3 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                        >
                          <p className="text-[10px] font-bold uppercase text-neutral-400 mb-0.5">
                            {n.type === 'annonce' ? 'Annonce'
                              : n.type === 'message' ? 'Message'
                              : n.type === 'confirmation' ? 'Sortie à approuver'
                              : 'Ordre du jour'} · {formatDate(n.date)}
                          </p>
                          <p className="text-sm font-semibold">{n.titre}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}