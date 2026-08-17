import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { adminService } from '../../services/adminService'
import { sanctionService } from '../../services/sanctionService'

const TYPES = [
  { value: 'AVERTISSEMENT', label: 'Avertissement' },
  { value: 'AMENDE', label: 'Amende' },
  { value: 'SUSPENSION', label: 'Suspension temporaire' },
  { value: 'MISE_A_PIED', label: 'Mise à pied' },
  { value: 'AUTRE', label: 'Autre' },
]

export default function EnregistrerSanctionPage() {
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [form, setForm] = useState({
    servant: '',
    type_sanction: 'AVERTISSEMENT',
    motif: '',
    date_decision: new Date().toISOString().slice(0, 10),
    duree_jours: '',
    montant: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState(null) // null | { nomServant, type }

  useEffect(() => {
    adminService.getMembres().then(setMembres).catch(() => setMembres([]))
  }, [])

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        servant: form.servant,
        type_sanction: form.type_sanction,
        motif: form.motif,
        date_decision: form.date_decision,
        statut: 'ACTIVE',
      }
      if (form.type_sanction === 'SUSPENSION' && form.duree_jours) {
        payload.duree_jours = Number(form.duree_jours)
      }
      if (form.type_sanction === 'AMENDE' && form.montant) {
        payload.montant = Number(form.montant)
      }
      await sanctionService.creer(payload)
      const nomServant = membres.find((m) => String(m.id) === String(form.servant))?.nom_complet ?? 'Le membre'
      const typeLabel = TYPES.find((t) => t.value === form.type_sanction)?.label ?? form.type_sanction
      setSucces({ nomServant, typeLabel })
    } catch {
      setError("L'enregistrement de la sanction a échoué. Vérifie les champs.")
    } finally {
      setSaving(false)
    }
  }

  if (succes) {
    return (
      <div>
        <Header title="Enregistrer une sanction" showBack />
        <div className="px-5 py-10 flex flex-col items-center text-center">
          <CheckCircle2 size={48} className="text-danger mb-4" />
          <h2 className="font-extrabold text-lg mb-1">Sanction enregistrée</h2>
          <p className="text-sm text-neutral-500 mb-6">
            {succes.typeLabel} appliqué(e) à {succes.nomServant}.
          </p>
          <div className="w-full max-w-xs flex flex-col gap-3">
            <Button onClick={() => navigate('/disciplinaire/sanctions')}>Voir les sanctions</Button>
            <Button variant="secondary" onClick={() => navigate('/accueil')}>
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Enregistrer une sanction" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-5">
        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Servant concerné</span>
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
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Type de sanction</span>
          <select
            value={form.type_sanction}
            onChange={handleChange('type_sanction')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        {form.type_sanction === 'SUSPENSION' && (
          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Durée (jours)</span>
            <input
              type="number"
              min="1"
              value={form.duree_jours}
              onChange={handleChange('duree_jours')}
              className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </label>
        )}

        {form.type_sanction === 'AMENDE' && (
          <label className="block mb-4">
            <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Montant (FCFA)</span>
            <input
              type="number"
              min="0"
              value={form.montant}
              onChange={handleChange('montant')}
              className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </label>
        )}

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Date de la décision</span>
          <input
            type="date"
            value={form.date_decision}
            onChange={handleChange('date_decision')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Motif</span>
          <textarea
            value={form.motif}
            onChange={handleChange('motif')}
            rows={4}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            required
          />
        </label>

        {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer la sanction'}
        </Button>
      </form>
    </div>
  )
}