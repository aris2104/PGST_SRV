import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { adminService } from '../../services/adminService'
import { cotisationService } from '../../services/cotisationService'

const today = new Date()

function calculerSemaineDepuisDate(dateStr) {
  const d = new Date(dateStr)
  return {
    annee: d.getFullYear(),
    mois: d.getMonth() + 1,
    // Même règle que le script d'auto-génération hebdomadaire
    // (management/commands/generer_cotisations_semaine.py), pour rester
    // compatible avec les lignes déjà créées automatiquement.
    numero_semaine: Math.floor((d.getDate() - 1) / 7) + 1,
  }
}

const FORM_VIDE = {
  servant: '',
  date: today.toISOString().slice(0, 10),
  montant: '',
}

export default function EnregistrerPaiementPage() {
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [form, setForm] = useState(FORM_VIDE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succesNom, setSuccesNom] = useState('') // nom du dernier paiement enregistré, vide = pas de bannière

  useEffect(() => {
    adminService.getMembres().then(setMembres).catch(() => setMembres([]))
  }, [])

  const handleChange = (field) => (e) => {
    setSuccesNom('')
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccesNom('')
    try {
      const { annee, mois, numero_semaine } = calculerSemaineDepuisDate(form.date)
      await cotisationService.enregistrerPaiement({
        servant: form.servant,
        annee,
        mois,
        numero_semaine,
        montant: Number(form.montant) || 0,
        statut: 'PAYE',
        date_debut_semaine: form.date,
        date_paiement: form.date,
      })
      const nom = membres.find((m) => String(m.id) === String(form.servant))?.nom_complet ?? 'Le membre'
      setSuccesNom(nom)
      // On garde la date et le servant pour enchaîner vite ; seul le montant se vide.
      setForm((f) => ({ ...f, montant: '' }))
    } catch {
      setError("L'enregistrement a échoué. Une cotisation existe peut-être déjà pour ce servant à cette date.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Enregistrer un paiement" showBack />

      {succesNom && (
        <div className="mx-5 mt-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
            <p className="text-sm font-semibold text-success">Paiement enregistré pour {succesNom}.</p>
          </div>
          <button
            onClick={() => navigate('/tresor/caisse')}
            className="text-xs font-bold text-success underline whitespace-nowrap"
          >
            Voir la caisse
          </button>
        </div>
      )}

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
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Date de la cotisation</span>
          <input
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            required
          />
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