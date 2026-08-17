import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/common/EmptyState'
import { cotisationService } from '../../services/cotisationService'

export default function TresorImpayesPage() {
  const today = new Date()
  const [impayees, setImpayees] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const charger = () => {
    cotisationService
      .getDetailMois(today.getFullYear(), today.getMonth() + 1)
      .then((data) => setImpayees(data.filter((c) => c.statut === 'IMPAYE')))
      .catch(() => setImpayees([]))
      .finally(() => setLoading(false))
  }

  useEffect(charger, [])

  const handleMarquerPaye = async (id) => {
    setSavingId(id)
    setError('')
    try {
      await cotisationService.marquerPaye(id)
      setImpayees((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError("Impossible de marquer ce paiement. Réessaie.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Header title="Impayés" subtitle="Vue Trésorier" showBack />

      <div className="px-5 py-5">
        {error && <p className="text-danger text-sm font-medium mb-3">{error}</p>}
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {!loading && impayees.length === 0 && (
          <EmptyState title="Aucun impayé ce mois-ci" description="La caisse est à jour." />
        )}
        {!loading && impayees.length > 0 && (
          <Table
            columns={[
              { key: 'servant', label: 'Servant', render: (c) => c.servant_nom ?? `Servant #${c.servant}` },
              {
                key: 'date',
                label: 'Date',
                render: (c) => new Date(c.date_debut_semaine).toLocaleDateString('fr-FR'),
              },
              {
                key: 'action',
                label: '',
                render: (c) => (
                  <Button
                    variant="secondary"
                    className="w-auto px-3 py-1.5 text-xs"
                    disabled={savingId === c.id}
                    onClick={() => handleMarquerPaye(c.id)}
                  >
                    {savingId === c.id ? '...' : 'Marquer payé'}
                  </Button>
                ),
              },
            ]}
            rows={impayees}
          />
        )}
      </div>
    </div>
  )
}