import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Header from '../../components/layout/Header'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'

const today = new Date().toISOString().slice(0, 10)
const FORM_VIDE = { matricule: '', nom: '', prenom: '', telephone: '', membre_depuis: today, role: '', password: '' }

export default function AddMemberPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roleCode = user?.role?.code
  const isAdmin = roleCode === ROLES.ADMIN || roleCode === ROLES.SUPER_ADMIN
  const isSuperAdmin = roleCode === ROLES.SUPER_ADMIN
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(FORM_VIDE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState(null) // null | { nom, prenom, matricule }

  useEffect(() => {
    // Seul l'Admin voit/choisit le rôle à la création : inutile de charger
    // la liste des rôles pour Président/Secrétaire, qui créent toujours
    // un simple Servant (imposé aussi côté backend, voir perform_create).
    if (isAdmin) {
      adminService.getRoles().then(setRoles).catch(() => setRoles([]))
    }
  }, [isAdmin])

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
      setSucces({ nom: form.nom, prenom: form.prenom, matricule: form.matricule })
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

  if (succes) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-10">
        <Header title="Ajouter un membre" showBack />
        <div className="px-5 py-10 flex flex-col items-center text-center">
          <CheckCircle2 size={48} className="text-success mb-4" />
          <h2 className="font-extrabold text-lg mb-1">Membre ajouté</h2>
          <p className="text-sm text-neutral-500 mb-6">
            {succes.prenom} {succes.nom} ({succes.matricule}) a bien été créé{isAdmin ? '' : ' avec le rôle Servant'}.
          </p>
          <div className="w-full max-w-xs flex flex-col gap-3">
            <Button onClick={() => navigate('/membres')}>Voir la liste des membres</Button>
            <Button
              variant="secondary"
              onClick={() => { setForm(FORM_VIDE); setSucces(null) }}
            >
              Ajouter un autre membre
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <Header title="Ajouter un membre" showBack />

      <div className="max-w-lg mx-auto p-5">
        

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

          {isAdmin ? (
            <label className="block mb-4">
              <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Rôle (optionnel)</span>
              <select
                className="w-full px-4 py-3 rounded-md bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-navy"
                value={form.role}
                onChange={handleChange('role')}
              >
                <option value="">Aucun rôle</option>
                {roles
                  .filter((r) => isSuperAdmin || !['ADMIN', 'SUPER_ADMIN'].includes(r.code))
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.libelle}</option>
                  ))}
              </select>
              {!isSuperAdmin && (
                <p className="text-xs text-neutral-400 mt-1">
                  Seul un Super Admin peut attribuer le rôle Admin.
                </p>
              )}
            </label>
          ) : (
            <p className="mb-4 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2">
              Ce membre sera créé avec le rôle <span className="font-semibold">Servant</span>.
              Seul un administrateur peut attribuer un rôle du bureau.
            </p>
          )}

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