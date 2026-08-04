import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { adminService } from '../../services/adminService'
import { cotisationService } from '../../services/cotisationService'

const today = new Date()

export default function EnregistrerPaiementPage() {
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [form, setForm] = useState({
    servant: '',
    annee: today.getFullYear(),
    mois: today.getMonth() + 1,
    numero_semaine: 1,
    montant: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.getMembres().then(setMembres).catch(() => setMembres([]))
  }, [])

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await cotisationService.enregistrerPaiement({
        servant: form.servant,
        annee: Number(form.annee),
        mois: Number(form.mois),
        numero_semaine: Number(form.numero_semaine),
        montant: Number(form.montant) || 0,
        statut: 'PAYE',
        date_debut_semaine: today.toISOString().slice(0, 10),
      })
      navigate('/tresor/caisse')
    } catch {
      setError("L'enregistrement a échoué. Cette semaine existe peut-être déjà pour ce servant.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Enregistrer un paiement" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-5">
        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Servant</span>
          <select
            value={form.servant}
            onChange={handleChange('servant')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            required
          >
            <option value="">Choisir un membre</option>
            {membres.map((m) => (
              <option key={m.id} value={m.id}>{m.nom_complet}</option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Semaine du mois</span>
          <select
            value={form.numero_semaine}
            onChange={handleChange('numero_semaine')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>Semaine {n}</option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Montant (FCFA)</span>
          <input
            type="number"
            min="0"
            value={form.montant}
            onChange={handleChange('montant')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            required
          />
        </label>

        {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer le paiement'}
        </Button>
      </form>
    </div>
  )
}