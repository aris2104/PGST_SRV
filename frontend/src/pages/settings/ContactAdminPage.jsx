import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { supportService } from '../../services/supportService'

export default function ContactAdminPage() {
  const [sujet, setSujet] = useState('')
  const [contenu, setContenu] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const chargerMessages = () => {
    supportService.getMesMessages().then(setMessages).catch(() => setMessages([]))
  }

  useEffect(() => {
    chargerMessages()
    setLoading(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnvoi(true)
    setConfirmation('')
    try {
      await supportService.envoyerMessage(sujet, contenu)
      setSujet('')
      setContenu('')
      setConfirmation('Message envoyé. Tu recevras une réponse ici même.')
      chargerMessages()
    } catch {
      setConfirmation("Erreur lors de l'envoi. Réessaie.")
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      <Header title="Contacter l'admin" showBack />

      <div className="px-5 py-5">
        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-4 mb-6">
          <label className="block mb-3">
            <span className="block mb-1 text-xs font-semibold text-neutral-500">Sujet</span>
            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              required
            />
          </label>
          <label className="block mb-4">
            <span className="block mb-1 text-xs font-semibold text-neutral-500">Message</span>
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              required
            />
          </label>

          {confirmation && (
            <p className="text-sm font-medium mb-3 text-neutral-600">{confirmation}</p>
          )}

          <Button type="submit" disabled={envoi}>
            {envoi ? 'Envoi...' : 'Envoyer'}
          </Button>
        </form>

        <h2 className="font-extrabold mb-3">Mes messages</h2>
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {!loading && messages.length === 0 && (
          <EmptyState title="Aucun message envoyé" />
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-sm">{m.sujet}</p>
                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  m.traite ? 'text-success bg-success/10' : 'text-neutral-500 bg-neutral-200'
                }`}>
                  {m.traite ? 'Traité' : 'En attente'}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mb-2">{m.contenu}</p>
              {m.reponse && (
                <div className="bg-neutral-50 rounded-md p-3 mt-2">
                  <p className="text-xs font-bold text-neutral-500 mb-1">Réponse de l'admin</p>
                  <p className="text-sm text-neutral-700">{m.reponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}