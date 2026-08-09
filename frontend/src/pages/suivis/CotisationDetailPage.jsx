import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Table from '../../components/ui/Table'
import BoutonPDF from '../../components/ui/BoutonPDF'
import EmptyState from '../../components/common/EmptyState'
import { cotisationService } from '../../services/cotisationService'
import { MOIS_FR } from '../../utils/constants'

export default function CotisationDetailPage() {
  const today = new Date()
  const [annee] = useState(today.getFullYear())
  const [mois] = useState(today.getMonth() + 1)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cotisationService
      .getDetailMois(annee, mois)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [annee, mois])

  // Semaines réellement présentes ce mois (1 à 5 en général)
  const semaines = [...new Set(records.map((r) => r.numero_semaine))].sort((a, b) => a - b)

  // On regroupe par servant : si l'API a renvoyé un seul servant (compte perso,
  // le backend filtre déjà pour un Servant simple), on a une vue individuelle ;
  // si elle en a renvoyé plusieurs (Trésorier/Admin), c'est la vue globale.
  const servantsMap = new Map()
  records.forEach((r) => {
    if (!servantsMap.has(r.servant)) {
      servantsMap.set(r.servant, { id: r.servant, nom: r.servant_nom, semaines: {} })
    }
    servantsMap.get(r.servant).semaines[r.numero_semaine] = r.statut
  })
  const lignes = [...servantsMap.values()]
  const vueGlobale = lignes.length > 1
  const impayesTotal = records.filter((r) => r.statut === 'IMPAYE').length

  const columns = [
    ...(vueGlobale ? [{ key: 'nom', label: 'Servant', render: (l) => l.nom }] : []),
    ...semaines.map((s) => ({
      key: `semaine-${s}`,
      label: `Sem. ${s}`,
      render: (l) => {
        const statut = l.semaines[s]
        if (!statut) return <span className="text-neutral-300">—</span>
        return (
          <span className={`text-xs font-bold ${statut === 'PAYE' ? 'text-success' : 'text-danger'}`}>
            {statut === 'PAYE' ? 'Payé' : 'Impayé'}
          </span>
        )
      },
    })),
  ]

  return (
    <div>
      <Header
        title={vueGlobale ? 'Caisse — Cotisations' : 'Ma cotisation'}
        subtitle={`${MOIS_FR[mois - 1]} ${annee}`}
        showBack
      />

      <div className="px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          {vueGlobale && !loading && records.length > 0 && (
            <p className="text-sm text-neutral-600">
              <span className="font-bold text-danger">{impayesTotal}</span> semaine(s) impayée(s) sur{' '}
              <span className="font-bold">{records.length}</span> au total.
            </p>
          )}
          {vueGlobale && !loading && lignes.length > 0 && (
            <BoutonPDF
              zone="cotisation"
              titre="Caisse — Cotisations"
              soustitre={`${MOIS_FR[mois - 1]} ${annee}`}
            />
          )}
        </div>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && lignes.length === 0 && (
          <EmptyState title="Aucune cotisation enregistrée ce mois-ci" />
        )}

        <div id="pdf-zone-cotisation">
          {!loading && lignes.length > 0 && (
            <Table stickyFirstColumn={vueGlobale} columns={columns} rows={lignes} />
          )}
        </div>
      </div>
    </div>
  )
}