import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { viderFileAttente, nombreActionsEnAttente } from '../services/offlineQueue'
import { prechargerDonneesHorsLigne } from '../services/offlinePrefetch'

const DIX_MINUTES_MS = 10 * 60 * 1000

const NetworkContext = createContext(null)

export function NetworkProvider({ children }) {
  // navigator.onLine reflète la connexion réseau de l'appareil (wifi/4G),
  // pas forcément "le serveur PGST répond" — mais c'est déjà 90% du besoin
  // et ça ne coûte aucun appel réseau supplémentaire.
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [actionsEnAttente, setActionsEnAttente] = useState(() => nombreActionsEnAttente())
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  const rafraichirCompteur = useCallback(() => {
    setActionsEnAttente(nombreActionsEnAttente())
  }, [])

  const viderMaintenant = useCallback(async () => {
    if (envoiEnCours) return
    setEnvoiEnCours(true)
    try {
      await viderFileAttente()
    } finally {
      rafraichirCompteur()
      setEnvoiEnCours(false)
    }
  }, [envoiEnCours, rafraichirCompteur])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Dès que le réseau revient, on tente d'envoyer tout ce qui a été
      // mis de côté (ex: un appel fait hors-ligne), puis on rafraîchit
      // tout le cache hors-ligne pendant qu'on est en ligne.
      viderMaintenant()
      prechargerDonneesHorsLigne()
    }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    // Au tout premier chargement, s'il y a déjà des actions en attente
    // (app rouverte après une session hors-ligne) et qu'on est en ligne,
    // on essaie aussi immédiatement.
    if (navigator.onLine) viderMaintenant()

    // Tant que l'app reste ouverte (même sans jamais passer par offline
    // puis online), on rafraîchit périodiquement le cache hors-ligne, pour
    // que les données restent à jour toute la journée (nouvelles
    // sanctions, cotisations, etc. saisies par d'autres pendant ce temps).
    const intervalle = setInterval(() => {
      if (navigator.onLine) prechargerDonneesHorsLigne()
    }, DIX_MINUTES_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <NetworkContext.Provider
      value={{ isOnline, actionsEnAttente, envoiEnCours, rafraichirCompteur, viderMaintenant }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork doit être utilisé à l\'intérieur de <NetworkProvider>')
  return ctx
}