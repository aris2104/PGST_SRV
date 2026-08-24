import { WifiOff, UploadCloud } from 'lucide-react'
import { useNetwork } from '../../context/NetworkContext'

export default function OfflineBanner() {
  const { isOnline, actionsEnAttente, envoiEnCours } = useNetwork()

  if (isOnline && actionsEnAttente === 0) return null

  if (!isOnline) {
    return (
      <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1.5">
        <WifiOff size={14} />
        Pas de connexion — certaines infos peuvent être anciennes
        {actionsEnAttente > 0 && (
          <span className="ml-1">
            · {actionsEnAttente} action{actionsEnAttente > 1 ? 's' : ''} en attente d'envoi
          </span>
        )}
      </div>
    )
  }

  // En ligne, mais il reste des actions à envoyer (ex: juste reconnecté)
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-info text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1.5">
      <UploadCloud size={14} className={envoiEnCours ? 'animate-pulse' : ''} />
      {envoiEnCours
        ? `Envoi de ${actionsEnAttente} action${actionsEnAttente > 1 ? 's' : ''} en attente...`
        : `${actionsEnAttente} action${actionsEnAttente > 1 ? 's' : ''} en attente d'envoi`}
    </div>
  )
}