import { useEffect, useState } from 'react'
import { Gavel, Wallet, Megaphone, Activity, CalendarClock, UserPlus, MessageSquare } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { adminService } from '../../services/adminService'

// Une couleur cohérente par type d'action, réutilisant la palette déjà en place ailleurs.
const STYLE_PAR_TYPE = {
  sanction: { icon: Gavel, couleur: 'text-danger', fond: 'bg-danger/10' },
  cotisation: { icon: Wallet, couleur: 'text-success', fond: 'bg-success/10' },
  annonce: { icon: Megaphone, couleur: 'text-info', fond: 'bg-info/10' },
  ordre_du_jour: { icon: CalendarClock, couleur: 'text-amber-600', fond: 'bg-amber-100' },
  membre: { icon: UserPlus, couleur: 'text-navy', fond: 'bg-navy/10' },
  message: { icon: MessageSquare, couleur: 'text-teal-600', fond: 'bg-teal-100' },
}

function tempsEcoule(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const heures = Math.floor(diffMs / 3_600_000)
  if (heures < 1) return "à l'instant"
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.floor(heures / 24)
  return `il y a ${jours} j`
}

export default function AdminActivitePage() {
  const [evenements, setEvenements] = useState([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [chargementSuite, setChargementSuite] = useState(false)

  const chargerPage = (numeroPage, remplacer) => {
    adminService
      .getActiviteRecente(numeroPage)
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

  return (
    <div>
      <Header title="Activité" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && evenements.length === 0 && (
          <EmptyState icon={Activity} title="Aucune activité récente" />
        )}

        {!loading && total > 0 && (
          <p className="text-xs text-neutral-400 mb-4">{total} action(s) enregistrée(s) au total.</p>
        )}

        <div className="flex flex-col">
          {evenements.map((e, i) => {
            const style = STYLE_PAR_TYPE[e.type] ?? { icon: Activity, couleur: 'text-navy', fond: 'bg-navy/10' }
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
                    {tempsEcoule(e.date)}{e.auteur ? ` · ${e.auteur}` : ''}
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