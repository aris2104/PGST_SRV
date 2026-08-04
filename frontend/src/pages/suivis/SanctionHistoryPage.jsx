import { useEffect, useState, useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'
import { sanctionService } from '../../services/sanctionService'

const STATUT_STYLE = {
  ACTIVE: { label: 'Active', className: 'text-danger bg-danger/10' },
  LEVEE: { label: 'Levée', className: 'text-success bg-success/10' },
  PURGEE: { label: 'Purgée', className: 'text-neutral-500 bg-neutral-200' },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function SanctionCard({ sanction }) {
  const statut = STATUT_STYLE[sanction.statut] ?? STATUT_STYLE.PURGEE

  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-bold text-sm">{sanction.type_sanction_display}</p>
        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${statut.className}`}>
          {statut.label}
        </span>
      </div>

      <p className="text-sm text-neutral-700 mb-2 leading-snug">{sanction.motif}</p>

      <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
        <span>{formatDate(sanction.date_decision)}</span>
        {sanction.decidee_par_nom && <span>par {sanction.decidee_par_nom}</span>}
      </div>

      {sanction.type_sanction === 'AMENDE' && sanction.montant && (
        <p className="text-xs font-bold text-neutral-600 mt-2">
          Montant : {Number(sanction.montant).toLocaleString('fr-FR')} FCFA
        </p>
      )}
      {sanction.type_sanction === 'SUSPENSION' && sanction.duree_jours && (
        <p className="text-xs font-bold text-neutral-600 mt-2">
          Durée : {sanction.duree_jours} jour(s)
          {sanction.date_fin && ` — jusqu'au ${formatDate(sanction.date_fin)}`}
        </p>
      )}
    </Card>
  )
}

export default function SanctionHistoryPage() {
  const [sanctions, setSanctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    sanctionService
      .getHistorique()
      .then(setSanctions)
      .catch(() => setError("Impossible de charger l'historique pour le moment."))
      .finally(() => setLoading(false))
  }, [])

  // Regroupement par année, du plus récent au plus ancien
  const parAnnee = useMemo(() => {
    const groupes = {}
    sanctions.forEach((s) => {
      const annee = new Date(s.date_decision).getFullYear()
      if (!groupes[annee]) groupes[annee] = []
      groupes[annee].push(s)
    })
    return Object.entries(groupes).sort((a, b) => b[0] - a[0])
  }, [sanctions])

  const sanctionsActives = sanctions.filter((s) => s.statut === 'ACTIVE').length

  return (
    <div>
      <Header title="Historique des sanctions" showBack />

      <div className="px-5 py-5">
        {!loading && !error && (
          <p
            className={`text-center font-bold text-sm mb-6 ${
              sanctionsActives > 0 ? 'text-danger' : 'text-success'
            }`}
          >
            {sanctionsActives > 0
              ? `${sanctionsActives} sanction(s) active(s)`
              : 'Aucune sanction active'}
          </p>
        )}

        {loading && <p className="text-neutral-400 text-sm text-center py-8">Chargement...</p>}

        {error && <p className="text-danger text-sm text-center py-8">{error}</p>}

        {!loading && !error && sanctions.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="Aucune sanction enregistrée"
            description="Ton dossier disciplinaire est vierge."
          />
        )}

        {!loading &&
          parAnnee.map(([annee, items]) => (
            <div key={annee} className="mb-6">
              <h2 className="text-sm font-extrabold text-neutral-500 mb-3">{annee}</h2>
              {items.map((s) => (
                <SanctionCard key={s.id} sanction={s} />
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
