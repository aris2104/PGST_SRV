import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { supportService } from '../../services/supportService'
import { useAuth } from '../../context/AuthContext'

function ReponseForm({ message, onReponduAvecSucces }) {
  const [reponse, setReponse] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnvoi(true)
    try {
      const updated = await supportService.repondreMessage(message.id, reponse)
      onReponduAvecSucces(updated)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      <textarea
        value={reponse}
        onChange={(e) => setReponse(e.target.value)}
        rows={3}
        required
        placeholder="Écris ta réponse..."
        className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
      />
      <Button type="submit" disabled={envoi} className="w-auto self-end px-4 py-1.5 text-xs">
        {envoi ? 'Envoi...' : 'Répondre'}
      </Button>
    </form>
  )
}

export default function ContactAdminPage() {
  const { user } = useAuth()
  const estAdmin = user?.role?.code === 'ADMIN'

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

  const handleReponduAvecSucces = (updated) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
  }

  return (
    <div>
      <Header title={estAdmin ? 'Messages reçus' : "Contacter l'admin"} showBack />

      <div className="px-5 py-5">
        {/* L'admin ne peut pas se contacter lui-même : pas de formulaire d'envoi pour lui */}
        {!estAdmin && (
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
        )}

        <h2 className="font-extrabold mb-3">{estAdmin ? 'Tous les messages' : 'Mes messages'}</h2>
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {!loading && messages.length === 0 && (
          <EmptyState title={estAdmin ? 'Aucun message reçu' : 'Aucun message envoyé'} />
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="font-bold text-sm">{m.sujet}</p>
                  {estAdmin && <p className="text-xs text-neutral-500">{m.auteur_nom}</p>}
                </div>
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

              {estAdmin && !m.traite && (
                <ReponseForm message={m} onReponduAvecSucces={handleReponduAvecSucces} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}