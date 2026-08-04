import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../../components/ui/Button'
import Header from '../../components/layout/Header'
import { adminService } from '../../services/adminService'

const today = new Date().toISOString().slice(0, 10)

export default function AddMemberPage() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    telephone: '',
    membre_depuis: today,
    role: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.getRoles().then(setRoles).catch(() => setRoles([]))
  }, [])

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.role) delete payload.role
      await adminService.creerMembre(payload)
      navigate('/presi-secre') // Retour au dashboard après ajout
    } catch (err) {
      const data = err.response?.data
      const premierChamp = data ? Object.values(data)[0] : null
      setError(
        Array.isArray(premierChamp)
          ? premierChamp[0]
          : "Impossible d'ajouter ce membre. Vérifiez le matricule et le mot de passe."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <Header title="Ajouter un membre" />

      <div className="max-w-lg mx-auto p-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4 font-medium"
        >
          <ArrowLeft size={18} /> Retour
        </button>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Matricule</span>
            <input
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="SRV-..."
              value={form.matricule}
              onChange={handleChange('matricule')}
              required
            />
          </label>

          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Prénom</span>
            <input
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              value={form.prenom}
              onChange={handleChange('prenom')}
              required
            />
          </label>

          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Nom</span>
            <input
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              value={form.nom}
              onChange={handleChange('nom')}
              required
            />
          </label>

          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Téléphone (optionnel)</span>
            <input
              type="tel"
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              value={form.telephone}
              onChange={handleChange('telephone')}
            />
          </label>

          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Membre depuis</span>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              value={form.membre_depuis}
              onChange={handleChange('membre_depuis')}
              required
            />
          </label>

          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Rôle (optionnel)</span>
            <select
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              value={form.role}
              onChange={handleChange('role')}
            >
              <option value="">Aucun rôle</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.libelle}</option>
              ))}
            </select>
          </label>

          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Mot de passe initial</span>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
              value={form.password}
              onChange={handleChange('password')}
              minLength={4}
              required
            />
          </label>

          {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full mt-2">
            {saving ? 'Ajout...' : 'Ajouter le membre'}
          </Button>
        </form>
      </div>
    </div>
  )
}