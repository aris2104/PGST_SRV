import { useState } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { userService } from '../../services/userService'

export default function ConfidentialitePage() {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (nouveau !== confirmation) {
      setMessage({ type: 'error', texte: 'La confirmation ne correspond pas au nouveau mot de passe.' })
      return
    }

    setSaving(true)
    try {
      await userService.changerMotDePasse(ancien, nouveau)
      setMessage({ type: 'success', texte: 'Mot de passe mis à jour avec succès.' })
      setAncien('')
      setNouveau('')
      setConfirmation('')
    } catch (err) {
      const detail = err.response?.data?.ancien_mot_de_passe?.[0]
      setMessage({ type: 'error', texte: detail || 'Une erreur est survenue.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Confidentialité" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold mb-3">Changer mon mot de passe</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-4 mb-6">
          <label className="block mb-3">
            <span className="block mb-1 text-xs font-semibold text-neutral-500">Mot de passe actuel</span>
            <input
              type="password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              required
            />
          </label>
          <label className="block mb-3">
            <span className="block mb-1 text-xs font-semibold text-neutral-500">Nouveau mot de passe</span>
            <input
              type="password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              minLength={4}
              required
            />
          </label>
          <label className="block mb-4">
            <span className="block mb-1 text-xs font-semibold text-neutral-500">Confirmer le nouveau mot de passe</span>
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              minLength={4}
              required
            />
          </label>

          {message && (
            <p className={`text-sm font-medium mb-3 ${message.type === 'success' ? 'text-success' : 'text-danger'}`}>
              {message.texte}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </Button>
        </form>

        <h2 className="font-extrabold mb-3">Visibilité</h2>
        <div className="bg-white rounded-card shadow-card p-4">
          <p className="text-sm text-neutral-600">
            Ton nom, ton matricule et ton rôle sont visibles par les autres membres du
            groupe dans les listes de programme. Tes informations de contact
            (téléphone) restent privées et ne sont visibles que par le Président,
            le Secrétaire et l'Administrateur.
          </p>
        </div>
      </div>
    </div>
  )
}