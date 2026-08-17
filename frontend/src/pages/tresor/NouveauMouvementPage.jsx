import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { caisseService } from '../../services/caisseService'

export default function NouveauMouvementPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    type_mouvement: 'ENTREE',
    montant: '',
    motif: '',
    description: '',
    date: today,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState(null) // null | { type, montant, motif }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await caisseService.creerMouvement({ ...form, montant: parseFloat(form.montant) })
      setSucces({ type: form.type_mouvement, montant: form.montant, motif: form.motif })
    } catch {
      setError("L'enregistrement a échoué. Vérifie les champs.")
    } finally {
      setSaving(false)
    }
  }

  const estSortie = form.type_mouvement === 'SORTIE'

  if (succes) {
    const sortie = succes.type === 'SORTIE'
    return (
      <div>
        <Header title="Nouveau mouvement" showBack />
        <div className="px-5 py-10 flex flex-col items-center text-center">
          {sortie ? (
            <Clock size={48} className="text-amber-500 mb-4" />
          ) : (
            <CheckCircle2 size={48} className="text-success mb-4" />
          )}
          <h2 className="font-extrabold text-lg mb-1">
            {sortie ? 'Sortie soumise au bureau' : 'Entrée enregistrée'}
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            {succes.motif} — {succes.montant} FCFA
            {sortie
              ? ' — en attente de confirmation par le bureau, pas encore déduite du solde.'
              : ' — déjà comptabilisée dans le solde.'}
          </p>
          <div className="w-full max-w-xs flex flex-col gap-3">
            <Button onClick={() => navigate('/tresor/mouvements')}>Voir les mouvements</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setForm({ type_mouvement: 'ENTREE', montant: '', motif: '', description: '', date: today })
                setSucces(null)
              }}
            >
              Enregistrer un autre mouvement
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Nouveau mouvement" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-5">
        {/* Type */}
        <div className="flex rounded-xl overflow-hidden border border-neutral-200 mb-5">
          {['ENTREE', 'SORTIE'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type_mouvement: t }))}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                form.type_mouvement === t
                  ? t === 'ENTREE' ? 'bg-success text-white' : 'bg-danger text-white'
                  : 'bg-white text-neutral-500'
              }`}
            >
              {t === 'ENTREE' ? '↑ Entrée de fonds' : '↓ Sortie de fonds'}
            </button>
          ))}
        </div>

        {estSortie && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-5">
            Une sortie de fonds sera soumise à la confirmation de tous les membres du bureau.
          </div>
        )}

        <label className="block mb-4">
          <span className="block mb-1.5 text-xs font-semibold text-neutral-500">Motif</span>
          <input value={form.motif} onChange={set('motif')} required
            className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 text-xs font-semibold text-neutral-500">Montant (FCFA)</span>
          <input value={form.montant} onChange={set('montant')} type="number" min="1" required
            className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 text-xs font-semibold text-neutral-500">Date</span>
          <input value={form.date} onChange={set('date')} type="date" required
            className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </label>

        <label className="block mb-5">
          <span className="block mb-1.5 text-xs font-semibold text-neutral-500">Description (optionnel)</span>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy" />
        </label>

        {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : estSortie ? 'Soumettre au bureau' : "Enregistrer l'entrée"}
        </Button>
      </form>
    </div>
  )
}