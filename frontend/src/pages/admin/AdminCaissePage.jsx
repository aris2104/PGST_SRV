import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'
import { cotisationService } from '../../services/cotisationService'
import { MOIS_FR } from '../../utils/constants'

export default function AdminCaissePage() {
  const today = new Date()
  const [cotisations, setCotisations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cotisationService
      .getDetailMois(today.getFullYear(), today.getMonth() + 1)
      .then(setCotisations)
      .catch(() => setCotisations([]))
      .finally(() => setLoading(false))
  }, [])

  const payees = cotisations.filter((c) => c.statut === 'PAYE')
  const impayees = cotisations.filter((c) => c.statut === 'IMPAYE')
  const totalCollecte = payees.reduce((sum, c) => sum + Number(c.montant || 0), 0)

  return (
    <div>
      <Header title="Caisse" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold text-lg mb-3">
          {MOIS_FR[today.getMonth()]} {today.getFullYear()}
        </h2>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <p className="text-xs font-semibold text-neutral-500 mb-1">Total collecté</p>
              <p className="text-xl font-extrabold text-success">
                {totalCollecte.toLocaleString('fr-FR')} F
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-neutral-500 mb-1">Impayés (ce mois)</p>
              <p className="text-xl font-extrabold text-danger">{impayees.length}</p>
            </Card>
          </div>
        )}

        <h2 className="font-extrabold mb-3">Servants en impayé</h2>
        {!loading && impayees.length === 0 && (
          <EmptyState title="Aucun impayé ce mois-ci" description="La caisse est à jour." />
        )}
        <div className="flex flex-col gap-2">
          {impayees.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <p className="font-bold text-sm">{c.servant_nom ?? `Servant #${c.servant}`}</p>
              <span className="text-xs font-bold text-danger uppercase">
                Semaine {c.numero_semaine}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}