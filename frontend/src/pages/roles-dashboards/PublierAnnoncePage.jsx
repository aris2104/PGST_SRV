import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { calendarService } from '../../services/calendarService'
import { adminService } from '../../services/adminService'

export default function PublierAnnoncePage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    titre: '',
    contenu: '',
    portee: 'GENERALE',
    destinataire: '',
  })
  const [membres, setMembres] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    adminService.getMembres().then(setMembres).catch(() => setMembres([]))
  }, [])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        titre: form.titre,
        contenu: form.contenu,
        portee: form.portee,
      }
      if (form.portee === 'CIBLEE' && form.destinataire) {
        payload.destinataire = form.destinataire
      }
      await calendarService.creerAnnonce(payload)
      setSuccess(true)
      setForm({ titre: '', contenu: '', portee: 'GENERALE', destinataire: '' })
    } catch {
      setError("La publication de l'annonce a échoué. Vérifie les champs.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Publier une annonce" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-5">
        {success && (
          <div className="mb-4 p-3 rounded-md text-success bg-success/10 text-sm font-semibold">
            L'annonce a été publiée avec succès !
          </div>
        )}

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Titre</span>
          <input
            type="text"
            value={form.titre}
            onChange={handleChange('titre')}
            placeholder="Ex: Réunion extraordinaire du bureau"
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Portée</span>
          <select
            value={form.portee}
            onChange={handleChange('portee')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
          >
            <option value="GENERALE">Générale (tout le groupe)</option>
            <option value="CIBLEE">Pour toi (un servant précis)</option>
          </select>
        </label>

        {form.portee === 'CIBLEE' && (
          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Destinataire</span>
            <select
              value={form.destinataire}
              onChange={handleChange('destinataire')}
              required
              className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">Choisir un membre</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>{m.nom_complet}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Contenu du message</span>
          <textarea
            value={form.contenu}
            onChange={handleChange('contenu')}
            rows={5}
            required
            placeholder="Rédigez le texte complet de votre annonce ici..."
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy resize-none"
          />
        </label>

        {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Publication en cours...' : "Publier l'annonce"}
        </Button>
      </form>
    </div>
  )
}