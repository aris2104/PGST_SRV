import { useEffect, useState } from 'react'
import Table from '../ui/Table'
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

function StatutBadge({ statut }) {
  const s = STATUT_STYLE[statut] ?? STATUT_STYLE.PURGEE
  return (
    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  )
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
      {!loading && actives.length > 0 && (
        <div className="mb-6">
          <Table
            columns={[
              { key: 'servant', label: 'Servant', render: (s) => s.servant_nom ?? `Servant #${s.servant}` },
              { key: 'type', label: 'Type', render: (s) => s.type_sanction_display },
              { key: 'motif', label: 'Motif', render: (s) => s.motif },
              { key: 'statut', label: 'Statut', render: (s) => <StatutBadge statut={s.statut} /> },
            ]}
            rows={actives}
          />
        </div>
      )}

      <h2 className="font-extrabold mb-3">Historique</h2>
      {!loading && autres.length === 0 && (
        <EmptyState title="Aucun historique" description="Rien à afficher pour l'instant." />
      )}
      {!loading && autres.length > 0 && (
        <Table
          columns={[
            { key: 'servant', label: 'Servant', render: (s) => s.servant_nom ?? `Servant #${s.servant}` },
            { key: 'date', label: 'Date', render: (s) => formatDate(s.date_decision) },
            { key: 'statut', label: 'Statut', render: (s) => <StatutBadge statut={s.statut} /> },
          ]}
          rows={autres}
        />
      )}
    </>
  )
}