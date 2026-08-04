import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { calendarService } from '../../services/calendarService'

export default function EnregistrerOrdreDuJourPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    titre: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await calendarService.creerOrdreDuJour(form)
      navigate('/calendrier')
    } catch {
      setError("L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Ordre du jour" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-5">
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

        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : "Publier l'ordre du jour"}
        </Button>
      </form>
    </div>
  )
}