import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await caisseService.creerMouvement({ ...form, montant: parseFloat(form.montant) })
      navigate('/tresor/mouvements')
    } catch {
      setError("L'enregistrement a échoué. Vérifie les champs.")
    } finally {
      setSaving(false)
    }
  }

  const estSortie = form.type_mouvement === 'SORTIE'

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