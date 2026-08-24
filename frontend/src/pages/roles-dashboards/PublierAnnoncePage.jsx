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
    destinataires: [], // plusieurs membres possibles désormais
  })
  const [membres, setMembres] = useState([])
  const [filtreRole, setFiltreRole] = useState('TOUS')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    adminService.getMembres().then(setMembres).catch(() => setMembres([]))
  }, [])

  // Rôles disponibles pour le filtre, déduits des membres chargés
  const roles = [
    ...new Map(
      membres
        .filter((m) => m.role)
        .map((m) => [m.role.id ?? m.role.code, m.role])
    ).values(),
  ]

  const membresFiltres = membres.filter((m) => {
    if (filtreRole === 'TOUS') return true
    return String(m.role?.id ?? m.role?.code) === filtreRole
  })

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const toggleDestinataire = (id) => {
    setForm((f) => {
      const deja = f.destinataires.includes(id)
      return {
        ...f,
        destinataires: deja
          ? f.destinataires.filter((d) => d !== id)
          : [...f.destinataires, id],
      }
    })
  }

  const toutSelectionner = () => {
    setForm((f) => ({ ...f, destinataires: membresFiltres.map((m) => m.id) }))
  }

  const toutDeselectionner = () => {
    setForm((f) => ({ ...f, destinataires: [] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.portee === 'CIBLEE' && form.destinataires.length === 0) {
      setError('Sélectionne au moins un membre pour une annonce ciblée.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        titre: form.titre,
        contenu: form.contenu,
        portee: form.portee,
      }
      if (form.portee === 'CIBLEE') {
        payload.destinataires = form.destinataires
      }
      await calendarService.creerAnnonce(payload)
      setSuccess(true)
      setForm({ titre: '', contenu: '', portee: 'GENERALE', destinataires: [] })
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
            <option value="CIBLEE">Ciblée (un servant précis)</option>
          </select>
        </label>

        {form.portee === 'CIBLEE' && (
          <div className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">
              Destinataires ({form.destinataires.length} sélectionné{form.destinataires.length > 1 ? 's' : ''})
            </span>

            {roles.length > 0 && (
              <select
                value={filtreRole}
                onChange={(e) => setFiltreRole(e.target.value)}
                className="w-full mb-2 px-4 py-2.5 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm"
              >
                <option value="TOUS">Filtrer par rôle : tous</option>
                {roles.map((r) => (
                  <option key={r.id ?? r.code} value={String(r.id ?? r.code)}>
                    {r.libelle || r.nom || r.code}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-3 mb-2">
              <button
                type="button"
                onClick={toutSelectionner}
                className="text-xs font-semibold text-navy underline"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={toutDeselectionner}
                className="text-xs font-semibold text-neutral-500 underline"
              >
                Tout désélectionner
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-300 bg-white divide-y divide-neutral-100">
              {membresFiltres.length === 0 && (
                <p className="px-4 py-3 text-sm text-neutral-500">Aucun membre pour ce filtre.</p>
              )}
              {membresFiltres.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={form.destinataires.includes(m.id)}
                    onChange={() => toggleDestinataire(m.id)}
                    className="h-4 w-4 accent-navy"
                  />
                  <span className="text-sm text-neutral-700">
                    {m.nom_complet}
                    {m.role?.libelle || m.role?.nom ? ` — ${m.role.libelle || m.role.nom}` : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>
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