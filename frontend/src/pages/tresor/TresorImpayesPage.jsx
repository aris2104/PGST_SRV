import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { cotisationService } from '../../services/cotisationService'

export default function TresorImpayesPage() {
  const today = new Date()
  const [impayees, setImpayees] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

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
    try {
      await cotisationService.marquerPaye(id)
      setImpayees((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Header title="Impayés" subtitle="Vue Trésorier" showBack />

      <div className="px-5 py-5">
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {!loading && impayees.length === 0 && (
          <EmptyState title="Aucun impayé ce mois-ci" description="La caisse est à jour." />
        )}
        <div className="flex flex-col gap-3">
          {impayees.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">{c.servant_nom ?? `Servant #${c.servant}`}</p>
                <p className="text-xs text-neutral-500">Semaine {c.numero_semaine}</p>
              </div>
              <Button
                variant="secondary"
                className="w-auto px-4"
                disabled={savingId === c.id}
                onClick={() => handleMarquerPaye(c.id)}
              >
                {savingId === c.id ? '...' : 'Marquer payé'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}