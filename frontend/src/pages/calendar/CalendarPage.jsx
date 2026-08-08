import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { calendarService } from '../../services/calendarService'
import { JOURS_FR_ABBR } from '../../utils/constants'

/* ==========================================
   UTILITAIRES DE DATE (Sans librairie externe)
   ========================================== */

// Obtenir le lundi de la semaine d'une date
function getLundi(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

// Ajouter/soustraire des jours
function addJours(d, jours) {
  const result = new Date(d)
  result.setDate(result.getDate() + jours)
  return result
}

// Formater YYYY-MM-DD
function formatISO(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Formater l'affichage (ex: "03 Aoû - 09 Aoû 2026")
function formatPlageSemaine(lundi) {
  const dimanche = addJours(lundi, 6)
  const opt = { day: '2-digit', month: 'short' }
  const debut = lundi.toLocaleDateString('fr-FR', opt)
  const fin = dimanche.toLocaleDateString('fr-FR', opt)
  return `${debut} — ${fin} ${dimanche.getFullYear()}`
}

function formatJourNumero(dateStr) {
  const d = new Date(dateStr)
  return { jour: JOURS_FR_ABBR[d.getDay()], numero: String(d.getDate()).padStart(2, '0') }
}

function formatHeure(heureStr) {
  if (!heureStr) return ''
  const [h, m] = heureStr.split(':')
  return `${h}H${m}`
}

/* ==========================================
   COMPOSANT POP-UP (MODAL DÉTAILS)
   ========================================== */
function MesseModal({ messe, onClose }) {
  if (!messe) return null
  const { jour, numero } = formatJourNumero(messe.date)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-neutral-100 flex flex-col max-h-[85vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50">
          <div>
            <span className="text-xs font-bold text-info uppercase tracking-wider">
              {jour} {numero}
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">
              {messe.type_messe_display || messe.type_messe}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-600 font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/60 flex justify-between items-center text-sm">
            <div>
              <p className="text-xs text-neutral-400 font-semibold">Heure</p>
              <p className="font-extrabold text-danger text-base">{formatHeure(messe.heure)}</p>
            </div>
            {messe.lieu && (
              <div className="text-right">
                <p className="text-xs text-neutral-400 font-semibold">Lieu</p>
                <p className="font-bold text-neutral-800">{messe.lieu}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider mb-2.5">
              Servants programmés ({messe.servants_detail?.length || 0})
            </p>

            {messe.servants_detail && messe.servants_detail.length > 0 ? (
              <div className="space-y-2">
                {messe.servants_detail.map((servant, idx) => (
                  <div
                    key={servant.id || idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-info/10 text-info font-extrabold text-xs flex items-center justify-center shrink-0">
                      {servant.prenom ? servant.prenom.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">
                        {servant.nom_complet || `${servant.prenom || ''} ${servant.nom || ''}`}
                      </p>
                      {servant.matricule && (
                        <p className="text-xs text-neutral-400">
                          Matricule : {servant.matricule}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 italic">
                Aucun servant affecté pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-900 text-white font-bold text-sm rounded-xl hover:bg-neutral-800 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================
   LIGNES DE LISTE CLIQUABLES
   ========================================== */
function MesseRow({ messe, onClick }) {
  const { jour, numero } = formatJourNumero(messe.date)
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg border-b border-neutral-200 last:border-0 cursor-pointer hover:bg-neutral-100/60 active:bg-neutral-100 transition"
    >
      <div className="text-center w-10 flex-shrink-0">
        <p className="text-info text-xs font-bold">{jour}</p>
        <p className="font-extrabold text-lg leading-none">{numero}</p>
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm">{messe.type_messe_display || messe.type_messe}</p>
      </div>
      <p className="text-danger font-bold text-sm">{formatHeure(messe.heure)}</p>
    </div>
  )
}

function ProgrammeRow({ messe, onClick }) {
  const { jour, numero } = formatJourNumero(messe.date)
  const nomsServants = messe.servants_detail?.map((s) => s.prenom).join(', ') || '—'
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg border-b border-neutral-200 last:border-0 cursor-pointer hover:bg-neutral-100/60 active:bg-neutral-100 transition"
    >
      <div className="text-center w-10 flex-shrink-0">
        <p className="text-info text-xs font-bold">{jour}</p>
        <p className="font-extrabold text-lg leading-none">{numero}</p>
      </div>
      <p className="font-bold text-sm flex-1">
        {messe.type_messe_display || messe.type_messe} : <span className="font-normal">{nomsServants}</span>
      </p>
    </div>
  )
}

/* ==========================================
   PAGE PRINCIPALE
   ========================================== */
export default function CalendarPage() {
  const [searchParams] = useSearchParams()
  const highlightOdjId = searchParams.get('odj')
  const highlightRefs = useRef({})

  // Date de référence (par défaut aujourd'hui)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [mesMesses, setMesMesses] = useState([])
  const [programme, setProgramme] = useState([])
  const [ordresDuJour, setOrdresDuJour] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMesse, setSelectedMesse] = useState(null)

  // Calcule le Lundi de la semaine affichée
  const lundiCourant = getLundi(currentDate)

  // Navigation : Semaine précédente / suivante / Aujourd'hui
  const handlePrevWeek = () => setCurrentDate((prev) => addJours(prev, -7))
  const handleNextWeek = () => setCurrentDate((prev) => addJours(prev, 7))
  const handleToday = () => setCurrentDate(new Date())

  // Sélection manuelle d'une date spécifique via l'input
  const handleDateSelect = (e) => {
    if (e.target.value) {
      setCurrentDate(new Date(e.target.value))
    }
  }

  // Chargement des données à chaque changement de date
  useEffect(() => {
    setLoading(true)
    const dateParam = formatISO(currentDate)

    // On passe la date sélectionnée aux services backend
    Promise.all([
      calendarService.getMesMesses(dateParam).catch(() => []),
      calendarService.getProgrammeSemaine(dateParam).catch(() => []),
      calendarService.getOrdresDuJour().catch(() => []),
    ]).then(([mes, prog, odj]) => {
      setMesMesses(mes)
      setProgramme(prog)
      setOrdresDuJour(odj)
      setLoading(false)
    })
  }, [currentDate])

  // Ordres du jour de la semaine actuellement affichée
  const dimancheCourant = addJours(lundiCourant, 6)
  const odjDeLaSemaine = ordresDuJour.filter((o) => {
    const d = new Date(o.date)
    return d >= lundiCourant && d <= dimancheCourant
  })

  useEffect(() => {
    if (!highlightOdjId || loading) return
    const el = highlightRefs.current[highlightOdjId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightOdjId, loading, ordresDuJour])

  return (
    <div>
      <Header subtitle="Programme" title="Calendrier" />

      <div className="px-5 py-5 space-y-4">
        {/* BARRE DE NAVIGATION DANS LE TEMPS */}
        <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* Bouton Semaine Précédente */}
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
              title="Semaine précédente"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Affichage de la plage de dates */}
            <div className="text-center flex-1">
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Semaine du
              </p>
              <p className="font-extrabold text-neutral-800 text-sm sm:text-base">
                {formatPlageSemaine(lundiCourant)}
              </p>
            </div>

            {/* Bouton Semaine Suivante */}
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
              title="Semaine suivante"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Raccourcis : Revenir à aujourd'hui + Choisir une date exacte */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 gap-2">
            <button
              onClick={handleToday}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition"
            >
              <RotateCcw size={14} /> Aujourd'hui
            </button>

            {/* Input Date Picker masqué sous un bouton iconique */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-info/10 text-info hover:bg-info/20 rounded-xl text-xs font-bold cursor-pointer transition">
              <CalendarIcon size={14} /> Choisir une date
              <input
                type="date"
                value={formatISO(currentDate)}
                onChange={handleDateSelect}
                className="sr-only" // Caché visuellement mais cliquable via le label
              />
            </label>
          </div>
        </div>

        {/* SECTION 1 : Mes messes cette semaine */}
        <div>
          <h2 className="text-danger font-extrabold mb-3">Mes messes</h2>
          <Card className="mb-4">
            {loading && <p className="text-neutral-400 text-sm py-2">Chargement...</p>}
            {!loading && mesMesses.length === 0 && (
              <p className="text-neutral-400 text-sm py-2">
                Aucune messe programmée pour vous cette semaine.
              </p>
            )}
            {!loading &&
              mesMesses.map((m) => (
                <MesseRow key={m.id} messe={m} onClick={() => setSelectedMesse(m)} />
              ))}
          </Card>
        </div>

        {/* SECTION 2 : Programme global */}
        <div>
          <h2 className="text-danger font-extrabold mb-3">Programme général</h2>
          <Card>
            {loading && <p className="text-neutral-400 text-sm py-2">Chargement...</p>}
            {!loading && programme.length === 0 && (
              <p className="text-neutral-400 text-sm py-2">
                Aucun programme disponible pour cette semaine.
              </p>
            )}
            {!loading &&
              programme.map((m) => (
                <ProgrammeRow key={m.id} messe={m} onClick={() => setSelectedMesse(m)} />
              ))}
          </Card>
        </div>
        {/* SECTION 3 : Ordre du jour de la semaine */}
        <div>
          <h2 className="text-danger font-extrabold mb-3">Ordre du jour</h2>
          <Card>
            {loading && <p className="text-neutral-400 text-sm py-2">Chargement...</p>}
            {!loading && odjDeLaSemaine.length === 0 && (
              <p className="text-neutral-400 text-sm py-2">
                Aucun ordre du jour publié pour cette semaine.
              </p>
            )}
            {!loading &&
              odjDeLaSemaine.map((o) => {
                const { jour, numero } = formatJourNumero(o.date)
                const estCible = String(o.id) === highlightOdjId
                return (
                  <div
                    key={o.id}
                    ref={(el) => { highlightRefs.current[o.id] = el }}
                    className={`flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg border-b border-neutral-200 last:border-0 transition-colors duration-700 ${
                      estCible ? 'bg-info/10' : ''
                    }`}
                  >
                    <div className="text-center w-10 flex-shrink-0">
                      <p className="text-info text-xs font-bold">{jour}</p>
                      <p className="font-extrabold text-lg leading-none">{numero}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{o.titre}</p>
                      {o.description && (
                        <p className="text-xs text-neutral-500 mt-0.5">{o.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
          </Card>
        </div>
      </div>

      {/* MODAL POP-UP */}
      <MesseModal messe={selectedMesse} onClose={() => setSelectedMesse(null)} />
    </div>
  )
}