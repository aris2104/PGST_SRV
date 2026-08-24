import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'
import { cotisationService } from '../../services/cotisationService'
import { sanctionService } from '../../services/sanctionService'

export default function TresorImpayesPage() {
  const today = new Date()
  const [impayees, setImpayees] = useState([])
  const [amendesImpayees, setAmendesImpayees] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [encaissementEnCours, setEncaissementEnCours] = useState(null)
  const [error, setError] = useState('')

  const formatMontant = (montant) => `${Number(montant || 0).toLocaleString('fr-FR')} FCFA`

  const charger = async () => {
    setLoading(true)
    try {
      const [cotisationsData, sanctionsData] = await Promise.all([
        cotisationService.getDetailMois(today.getFullYear(), today.getMonth() + 1).catch(() => []),
        sanctionService.getHistorique().catch(() => [])
      ])

      const listCotisations = Array.isArray(cotisationsData) ? cotisationsData : cotisationsData.results || []
      const listSanctions = Array.isArray(sanctionsData) ? sanctionsData : sanctionsData.results || []

      // Triées par date (la plus ancienne en premier = la plus urgente à
      // encaisser). Un même nom peut légitimement apparaître plusieurs
      // fois : une ligne par semaine impayée, pas une par personne.
      const impayeesTriees = listCotisations
        .filter((c) => c.statut === 'IMPAYE')
        .sort((a, b) => new Date(a.date_debut_semaine) - new Date(b.date_debut_semaine))

      setImpayees(impayeesTriees)
      setAmendesImpayees(
        listSanctions.filter((s) => s.type_sanction === 'AMENDE' && !s.amende_payee)
      )
    } catch {
      setError("Erreur lors du chargement des données.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

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

  const encaisser = async (id) => {
    setEncaissementEnCours(id)
    setError('')
    try {
      await sanctionService.marquerAmendePayee(id)
      setAmendesImpayees((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setError("Impossible d'encaisser cette amende. Réessaie.")
    } finally {
      setEncaissementEnCours(null)
    }
  }

  const aucunImpaye = impayees.length === 0 && amendesImpayees.length === 0

  return (
    <div>
      <Header title="Impayés" subtitle="Vue Trésorier" showBack />

      <div className="px-5 py-5">
        {error && <p className="text-danger text-sm font-medium mb-3">{error}</p>}
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && aucunImpaye && (
          <EmptyState title="Aucun impayé ce mois-ci" description="La caisse est à jour." />
        )}

        {!loading && impayees.length > 0 && (
          <>
            <h2 className="font-extrabold text-lg mb-3">Cotisations impayées</h2>
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
          </>
        )}

        {!loading && amendesImpayees.length > 0 && (
          <>
            <h2 className="font-extrabold text-lg mb-3 mt-6">Amendes à encaisser</h2>
            <div className="flex flex-col gap-2">
              {amendesImpayees.map((s) => (
                <Card key={s.id} className="p-3 bg-white border border-neutral-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{s.servant_nom || `Servant #${s.servant}`}</p>
                    <p className="text-xs text-neutral-500">{s.motif}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-sm text-danger">{formatMontant(s.montant)}</p>
                    <Button
                      className="!w-auto px-3 py-1.5 text-xs"
                      disabled={encaissementEnCours === s.id}
                      onClick={() => encaisser(s.id)}
                    >
                      {encaissementEnCours === s.id ? '...' : 'Encaisser'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}