import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Table from '../ui/Table'
import BoutonPDF from '../ui/BoutonPDF'
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

// estAdmin : seul l'Admin peut corriger le statut ou supprimer une
// sanction déjà créée — irréversible pour le Disciplinaire (voir backend
// sanctions/views.py). Ces boutons ne s'affichent donc que dans
// AdminSanctionsPage, jamais dans DisciplinaireSanctionsPage.
export default function SanctionsOverview({ estAdmin = false }) {
  const [sanctions, setSanctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const charger = () => {
    sanctionService
      .getHistorique()
      .then(setSanctions)
      .catch(() => setSanctions([]))
      .finally(() => setLoading(false))
  }

  useEffect(charger, [])

  const changerStatut = async (id, statut) => {
    setBusyId(id)
    setError('')
    try {
      await sanctionService.modifier(id, { statut })
      charger()
    } catch {
      setError('La modification a échoué.')
    } finally {
      setBusyId(null)
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer définitivement cette sanction ?')) return
    setBusyId(id)
    setError('')
    try {
      await sanctionService.supprimer(id)
      charger()
    } catch {
      setError('La suppression a échoué.')
    } finally {
      setBusyId(null)
    }
  }

  const actives = sanctions.filter((s) => s.statut === 'ACTIVE')
  const autres = sanctions.filter((s) => s.statut !== 'ACTIVE')

  const colonneAdmin = estAdmin
    ? [
        {
          key: 'admin',
          label: '',
          render: (s) => (
            <div className="flex items-center gap-2 print:hidden">
              <select
                value={s.statut}
                disabled={busyId === s.id}
                onChange={(e) => changerStatut(s.id, e.target.value)}
                className="text-xs font-semibold border border-neutral-300 rounded-md px-1.5 py-1 bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="LEVEE">Levée</option>
                <option value="PURGEE">Purgée</option>
              </select>
              <button
                onClick={() => supprimer(s.id)}
                disabled={busyId === s.id}
                className="text-danger p-1"
                aria-label="Supprimer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ),
        },
      ]
    : []

  return (
    <>
      {!loading && sanctions.length > 0 && (
        <div className="flex justify-end mb-3 print:hidden">
          <BoutonPDF zone="sanctions" titre="Sanctions" />
        </div>
      )}

      {estAdmin && error && <p className="text-danger text-sm font-medium mb-3">{error}</p>}
      {estAdmin && (
        <p className="text-xs text-neutral-400 mb-3">
          En tant qu'Admin, tu peux corriger le statut ou supprimer une sanction. C'est la seule vue qui le permet.
        </p>
      )}

      <div id="pdf-zone-sanctions">
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
                ...colonneAdmin,
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
              ...colonneAdmin,
            ]}
            rows={autres}
          />
        )}
      </div>
    </>
  )
}