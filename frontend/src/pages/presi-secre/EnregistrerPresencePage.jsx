import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { CalendarX2 } from 'lucide-react'
import { calendarService } from '../../services/calendarService'
import { presenceService } from '../../services/presenceService'

const STATUTS = [
  { value: 'PRESENT', label: 'Présent' },
  { value: 'RETARD', label: 'Retard' },
  { value: 'PERMISSION', label: 'Permission' },
  { value: 'ABSENT', label: 'Absent' },
]

const STATUT_STYLES = {
  PRESENT: 'bg-success text-white',
  RETARD: 'bg-info text-white',
  PERMISSION: 'bg-neutral-500 text-white',
  ABSENT: 'bg-danger text-white',
}

export default function EnregistrerPresencePage() {
  const navigate = useNavigate()

  const [ordresDuJour, setOrdresDuJour] = useState([])
  const [servants, setServants] = useState([])
  const [selectedOdj, setSelectedOdj] = useState('')
  const [presences, setPresences] = useState({}) // { servantId: 'PRESENT' | ... }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([calendarService.getOrdresDuJour(), presenceService.getServants()])
      .then(([odjList, servantsList]) => {
        setOrdresDuJour(odjList)
        setServants(servantsList)
      })
      .catch(() => setError("Impossible de charger l'ordre du jour ou la liste des servants."))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectOdj = (id) => {
    setSelectedOdj(id)
    // Par défaut, tout le monde est marqué présent — le bureau ajuste les exceptions.
    const initial = {}
    servants.forEach((s) => { initial[s.id] = 'PRESENT' })
    setPresences(initial)
  }

  const setStatut = (servantId, statut) => {
    setPresences((prev) => ({ ...prev, [servantId]: statut }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      await presenceService.enregistrerAppel(selectedOdj, presences)
      navigate('/suivis/presences')
    } catch {
      setError("L'enregistrement de l'appel a échoué. Réessaie.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Faire l'appel" showBack />

      <div className="px-5 py-5">
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && ordresDuJour.length === 0 && (
          <EmptyState
            icon={CalendarX2}
            title="Aucun ordre du jour publié"
            description="L'Organisateur doit d'abord publier une réunion avant de pouvoir faire l'appel."
          />
        )}

        {!loading && ordresDuJour.length > 0 && (
          <>
            <label className="block mb-5">
              <span className="block mb-1.5 font-semibold text-sm text-neutral-700">
                Réunion (suivant l'ordre du jour publié)
              </span>
              <select
                value={selectedOdj}
                onChange={(e) => handleSelectOdj(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="">Choisir une date / un ordre du jour</option>
                {ordresDuJour.map((odj) => (
                  <option key={odj.id} value={odj.id}>
                    {odj.date} — {odj.titre}
                  </option>
                ))}
              </select>
            </label>

            {selectedOdj && (
              <>
                <div className="flex flex-col gap-3 mb-5">
                  {servants.map((s) => (
                    <div key={s.id} className="bg-card rounded-card shadow-card p-3">
                      <p className="font-bold text-sm mb-2">{s.nom_complet}</p>
                      <div className="flex gap-2 flex-wrap">
                        {STATUTS.map((st) => {
                          const active = presences[s.id] === st.value
                          return (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() => setStatut(s.id, st.value)}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                active ? STATUT_STYLES[st.value] : 'bg-white text-neutral-500 border border-neutral-300'
                              }`}
                            >
                              {st.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Enregistrement...' : "Enregistrer l'appel"}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}