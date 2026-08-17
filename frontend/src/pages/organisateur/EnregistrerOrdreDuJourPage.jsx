import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Pencil, X } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { calendarService } from '../../services/calendarService'

const FORM_VIDE = {
  date: new Date().toISOString().slice(0, 10),
  titre: '',
  description: '',
}

function formatDateCourte(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EnregistrerOrdreDuJourPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(FORM_VIDE)
  const [editingId, setEditingId] = useState(null) // null = création, sinon = modification en cours
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState(false)

  const [liste, setListe] = useState([])
  const [chargementListe, setChargementListe] = useState(true)

  const chargerListe = () => {
    setChargementListe(true)
    calendarService
      .getOrdresDuJour()
      .then((data) => setListe([...data].sort((a, b) => new Date(b.date) - new Date(a.date))))
      .catch(() => setListe([]))
      .finally(() => setChargementListe(false))
  }

  useEffect(chargerListe, [])

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const commencerModification = (odj) => {
    setEditingId(odj.id)
    setForm({
      date: odj.date,
      titre: odj.titre,
      description: odj.description ?? '',
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const annulerModification = () => {
    setEditingId(null)
    setForm(FORM_VIDE)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await calendarService.modifierOrdreDuJour(editingId, form)
      } else {
        await calendarService.creerOrdreDuJour(form)
      }
      setSucces(true)
      chargerListe()
    } catch {
      setError("L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  if (succes) {
    return (
      <div>
        <Header title="Ordre du jour" showBack />
        <div className="px-5 py-10 flex flex-col items-center text-center">
          <CheckCircle2 size={48} className="text-success mb-4" />
          <h2 className="font-extrabold text-lg mb-1">
            {editingId ? 'Ordre du jour modifié' : 'Ordre du jour créé'}
          </h2>
          <p className="text-sm text-neutral-500 mb-6">« {form.titre} » a bien été {editingId ? 'mis à jour' : 'publié'}.</p>
          <div className="w-full max-w-xs flex flex-col gap-3">
            <Button onClick={() => navigate('/calendrier')}>Voir le programme</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSucces(false)
                setEditingId(null)
                setForm(FORM_VIDE)
              }}
            >
              Gérer les ordres du jour
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Ordre du jour" showBack />

      <form onSubmit={handleSubmit} className="px-5 pt-5">
        {editingId && (
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-md bg-info/10 border border-info/30">
            <p className="text-xs font-bold text-info">Modification en cours</p>
            <button type="button" onClick={annulerModification} className="text-info">
              <X size={16} />
            </button>
          </div>
        )}

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Date de la réunion</span>
          <input
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Titre</span>
          <input
            value={form.titre}
            onChange={handleChange('titre')}
            placeholder="Ex : Football"
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Description (optionnel)</span>
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            rows={4}
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy resize-none"
          />
        </label>

        {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

        <div className="flex gap-3 mb-8">
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : "Publier l'ordre du jour"}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={annulerModification} disabled={saving}>
              Annuler
            </Button>
          )}
        </div>
      </form>

      <div className="px-5 pb-8">
        <h2 className="font-extrabold text-base mb-3">Ordres du jour existants</h2>
        <p className="text-xs text-neutral-400 mb-3">
          Réversible : tu peux modifier un ordre du jour déjà publié à tout moment.
        </p>

        {chargementListe && <p className="text-sm text-neutral-400">Chargement...</p>}
        {!chargementListe && liste.length === 0 && (
          <p className="text-sm text-neutral-400">Aucun ordre du jour pour le moment.</p>
        )}

        <div className="flex flex-col gap-2">
          {liste.map((odj) => (
            <button
              key={odj.id}
              type="button"
              onClick={() => commencerModification(odj)}
              className={`flex items-center justify-between gap-3 p-3 rounded-card bg-card shadow-card text-left ${
                editingId === odj.id ? 'ring-2 ring-navy' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-400">{formatDateCourte(odj.date)}</p>
                <p className="font-semibold text-sm truncate">{odj.titre}</p>
              </div>
              <Pencil size={16} className="text-neutral-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}