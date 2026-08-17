import { useEffect } from 'react'

/**
 * Petite fenêtre modale générique (fond semi-transparent + panneau en bas
 * sur mobile). Utilisée notamment pour le détail des tuiles du tableau de
 * bord de la caisse (entrées / dépenses / solde).
 */
export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-md max-h-[80vh] bg-white rounded-t-2xl sm:rounded-card shadow-card p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}