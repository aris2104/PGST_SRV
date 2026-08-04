import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import EmptyState from '../common/EmptyState'
import { sanctionService } from '../../services/sanctionService'

const STATUT_STYLE = {
  ACTIVE: { label: 'Active', className: 'text-danger bg-danger/10' },
  LEVEE: { label: 'Levée', className: 'text-success bg-success/10' },
  PURGEE: { label: 'Purgée', className: 'text-neutral-500 bg-neutral-200' },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SanctionsOverview() {
  const [sanctions, setSanctions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sanctionService
      .getHistorique()
      .then(setSanctions)
      .catch(() => setSanctions([]))
      .finally(() => setLoading(false))
  }, [])

  const actives = sanctions.filter((s) => s.statut === 'ACTIVE')
  const autres = sanctions.filter((s) => s.statut !== 'ACTIVE')

  return (
    <>
      <h2 className="font-extrabold text-lg mb-3">Sanctions actives ({actives.length})</h2>
      {loading && <p className="text-neutral-400 text-sm mb-4">Chargement...</p>}
      {!loading && actives.length === 0 && (
        <EmptyState title="Aucune sanction active" description="Le groupe est à jour." />
      )}
      <div className="flex flex-col gap-3 mb-6">
        {actives.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">{s.servant_nom ?? `Servant #${s.servant}`}</p>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full text-danger bg-danger/10">
                Active
              </span>
            </div>
            <p className="text-xs text-neutral-600 mb-1">{s.type_sanction_display}</p>
            <p className="text-xs text-neutral-500">{s.motif}</p>
          </Card>
        ))}
      </div>

      <h2 className="font-extrabold mb-3">Historique</h2>
      <div className="flex flex-col gap-2">
        {autres.map((s) => {
          const statut = STATUT_STYLE[s.statut] ?? STATUT_STYLE.PURGEE
          return (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{s.servant_nom ?? `Servant #${s.servant}`}</p>
                <p className="text-xs text-neutral-500">{formatDate(s.date_decision)}</p>
              </div>
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${statut.className}`}>
                {statut.label}
              </span>
            </Card>
          )
        })}
      </div>
    </>
  )
}