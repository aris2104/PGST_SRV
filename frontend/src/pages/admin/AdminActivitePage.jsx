import { useEffect, useState } from 'react'
import { Gavel, Wallet, Megaphone, Activity, CalendarClock, UserPlus, MessageSquare, ShieldAlert, ShieldCheck, Filter, Download } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { adminService } from '../../services/adminService'
import { exportPDF } from '../../utils/exportPDF'

// Une couleur cohérente par type d'action, réutilisant la palette déjà en place ailleurs.
const STYLE_PAR_TYPE = {
  sanction: { icon: Gavel, couleur: 'text-danger', fond: 'bg-danger/10' },
  cotisation: { icon: Wallet, couleur: 'text-success', fond: 'bg-success/10' },
  annonce: { icon: Megaphone, couleur: 'text-info', fond: 'bg-info/10' },
  ordre_du_jour: { icon: CalendarClock, couleur: 'text-amber-600', fond: 'bg-amber-100' },
  membre: { icon: UserPlus, couleur: 'text-navy', fond: 'bg-navy/10' },
  message: { icon: MessageSquare, couleur: 'text-teal-600', fond: 'bg-teal-100' },
  connexion: { icon: ShieldCheck, couleur: 'text-emerald-600', fond: 'bg-emerald-100' },
  connexion_echouee: { icon: ShieldAlert, couleur: 'text-rose-600', fond: 'bg-rose-100' },
}

const TYPES_DISPONIBLES = [
  { key: 'connexion', label: 'Connexions' },
  { key: 'sanction', label: 'Sanctions' },
  { key: 'cotisation', label: 'Cotisations' },
  { key: 'annonce', label: 'Annonces' },
  { key: 'ordre_du_jour', label: 'Ordres du jour' },
  { key: 'membre', label: 'Nouveaux membres' },
  { key: 'message', label: 'Messages' },
]

function tempsEcoule(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const heures = Math.floor(diffMs / 3_600_000)
  if (heures < 1) return "à l'instant"
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.floor(heures / 24)
  return `il y a ${jours} j`
}

function formatDateLisible(dateStr) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminActivitePage() {
  const [evenements, setEvenements] = useState([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [chargementSuite, setChargementSuite] = useState(false)

  // --- Filtres ---
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [types, setTypes] = useState(new Set(TYPES_DISPONIBLES.map((t) => t.key)))
  const [filtresOuverts, setFiltresOuverts] = useState(true) // visible par défaut, rien de caché

  const filtresActifs = () => ({
    ...(dateDebut ? { date_debut: dateDebut } : {}),
    ...(dateFin ? { date_fin: dateFin } : {}),
    types: [...types].join(','),
  })

  const chargerPage = (numeroPage, remplacer) => {
    adminService
      .getActiviteRecente(numeroPage, 30, filtresActifs())
      .then((data) => {
        setEvenements((prev) => (remplacer ? data.results : [...prev, ...data.results]))
        setHasNext(data.has_next)
        setTotal(data.count)
        setPage(numeroPage)
      })
      .catch(() => {
        if (remplacer) setEvenements([])
      })
      .finally(() => {
        setLoading(false)
        setChargementSuite(false)
      })
  }

  useEffect(() => {
    chargerPage(1, true)
  }, [])

  const handleVoirPlus = () => {
    setChargementSuite(true)
    chargerPage(page + 1, false)
  }

  const handleAppliquerFiltres = () => {
    setLoading(true)
    setFiltresOuverts(false)
    chargerPage(1, true)
  }

  const toggleType = (key) => {
    setTypes((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const styleDe = (e) => {
    if (e.type === 'connexion' && e.titre.includes('échouée')) return STYLE_PAR_TYPE.connexion_echouee
    return STYLE_PAR_TYPE[e.type] ?? { icon: Activity, couleur: 'text-navy', fond: 'bg-navy/10' }
  }

  return (
    <div>
      <Header title="Activité" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">

        {/* --- Filtres --- */}
        <div className="bg-white rounded-card shadow-card p-4 mb-5">
          <button
            onClick={() => setFiltresOuverts((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-neutral-500">
              <Filter size={14} /> Filtres
            </span>
            <span className="text-xs text-neutral-400">{filtresOuverts ? 'Réduire' : 'Ouvrir'}</span>
          </button>

          {filtresOuverts && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block">
                  <span className="block mb-1 text-[11px] font-semibold text-neutral-500">Du</span>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-neutral-300 text-sm" />
                </label>
                <label className="block">
                  <span className="block mb-1 text-[11px] font-semibold text-neutral-500">Au</span>
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-neutral-300 text-sm" />
                </label>
              </div>

              <span className="block mb-1.5 text-[11px] font-semibold text-neutral-500">Types d'actions</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {TYPES_DISPONIBLES.map((t) => (
                  <button
                    key={t.key} type="button" onClick={() => toggleType(t.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      types.has(t.key) ? 'bg-navy text-white border-navy' : 'bg-white text-neutral-500 border-neutral-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Button onClick={handleAppliquerFiltres} disabled={types.size === 0}>
                Appliquer
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          {!loading && (
            <p className="text-xs text-neutral-400">{total} action(s) au total.</p>
          )}
          {!loading && evenements.length > 0 && (
            <button
              onClick={() => exportPDF('activite', { titre: "Journal d'activité" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-600"
            >
              <Download size={14} /> PDF
            </button>
          )}
        </div>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && evenements.length === 0 && (
          <EmptyState icon={Activity} title="Aucune action pour ces filtres" />
        )}

        <div id="pdf-zone-activite" className="flex flex-col">
          {evenements.map((e, i) => {
            const style = styleDe(e)
            const Icon = style.icon
            return (
              <div key={i} className="flex gap-3 pb-5 relative">
                {i < evenements.length - 1 && (
                  <span className="absolute left-[15px] top-8 bottom-0 w-px bg-neutral-200" />
                )}
                <div className={`w-8 h-8 rounded-full ${style.fond} flex items-center justify-center flex-shrink-0 z-10`}>
                  <Icon size={15} className={style.couleur} />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-bold text-sm">{e.titre}</p>
                  <p className="text-xs text-neutral-600 mb-1">{e.description}</p>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    {tempsEcoule(e.date)} · {formatDateLisible(e.date)}{e.auteur ? ` · ${e.auteur}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {!loading && hasNext && (
          <Button variant="secondary" onClick={handleVoirPlus} disabled={chargementSuite}>
            {chargementSuite ? 'Chargement...' : 'Voir plus'}
          </Button>
        )}
      </div>
    </div>
  )
}