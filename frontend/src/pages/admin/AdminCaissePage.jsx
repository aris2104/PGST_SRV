import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/common/EmptyState'
import { cotisationService } from '../../services/cotisationService'
import { caisseService } from '../../services/caisseService'
import { MOIS_FR } from '../../utils/constants'

function formatMontant(m) {
  return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR')
}

function DetailList({ items, emptyLabel }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-400">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((m) => (
        <div key={m.key} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0">
          <div>
            <p className="text-sm font-bold">{m.motif}</p>
            <p className="text-xs text-neutral-400">{formatDate(m.date)} · {m.origine}</p>
          </div>
          <p className={`text-sm font-black ${m.sens === 'ENTREE' ? 'text-success' : 'text-danger'}`}>
            {m.sens === 'ENTREE' ? '+' : '−'}{formatMontant(m.montant)}
          </p>
        </div>
      ))}
    </div>
  )
}

// Caisse — vue Admin/Conseiller : mêmes tuiles Entrées/Sorties/Solde que le
// dashboard Trésorier, calculées par la même source de vérité unique
// (/caisse/mouvements/solde/), PLUS le suivi des cotisations impayées du mois.
export default function AdminCaissePage() {
  const today = new Date()
  const [cotisations, setCotisations] = useState([])
  const [loadingCotisations, setLoadingCotisations] = useState(true)
  const [mouvements, setMouvements] = useState(null)
  const [cotisationsPayees, setCotisationsPayees] = useState(null)
  const [solde, setSolde] = useState(null)
  const [modalOuverte, setModalOuverte] = useState(null) // 'entrees' | 'sorties' | 'solde' | null

  useEffect(() => {
    cotisationService
      .getDetailMois(today.getFullYear(), today.getMonth() + 1)
      .then(setCotisations)
      .catch(() => setCotisations([]))
      .finally(() => setLoadingCotisations(false))

    caisseService.getMouvements().then(setMouvements).catch(() => setMouvements([]))
    cotisationService.getToutesPayees().then(setCotisationsPayees).catch(() => setCotisationsPayees([]))
    caisseService.getSolde().then(setSolde).catch(() => setSolde(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const impayees = cotisations.filter((c) => c.statut === 'IMPAYE')
  const chargementCaisse = mouvements === null || cotisationsPayees === null || solde === null

  const detailEntrees = chargementCaisse
    ? []
    : [
        ...mouvements
          .filter((m) => m.type_mouvement === 'ENTREE')
          .map((m) => ({
            key: `mvt-${m.id}`, motif: m.motif, date: m.date, montant: m.montant,
            origine: m.initiee_par_nom || 'Trésorier', sens: 'ENTREE',
          })),
        ...cotisationsPayees.map((c) => ({
          key: `cot-${c.id}`,
          motif: `Cotisation — ${c.servant_nom ?? 'Servant #' + c.servant}`,
          date: c.date_paiement ?? c.date_debut_semaine,
          montant: c.montant,
          origine: 'Cotisation hebdomadaire',
          sens: 'ENTREE',
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const detailSorties = chargementCaisse
    ? []
    : mouvements
        .filter((m) => m.type_mouvement === 'SORTIE' && m.statut_global === 'CONFIRME')
        .map((m) => ({
          key: `srt-${m.id}`, motif: m.motif, date: m.date, montant: m.montant,
          origine: m.initiee_par_nom || 'Trésorier', sens: 'SORTIE',
        }))

  return (
    <div>
      <Header title="Caisse" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold text-lg mb-3">Solde &amp; mouvements</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-3 bg-white border border-neutral-200" onClick={() => setModalOuverte('solde')}>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Solde actuel</p>
            <p className="text-lg font-black text-neutral-800 mt-1">
              {chargementCaisse ? '...' : formatMontant(solde.solde)}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200" onClick={() => setModalOuverte('entrees')}>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Entrées</p>
            <p className="text-lg font-black text-success mt-1">
              {chargementCaisse ? '...' : formatMontant(solde.total_entrees)}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200" onClick={() => setModalOuverte('sorties')}>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Sorties</p>
            <p className="text-lg font-black text-danger mt-1">
              {chargementCaisse ? '...' : formatMontant(solde.total_sorties)}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Impayés (ce mois)</p>
            <p className={`text-lg font-black mt-1 ${impayees.length > 0 ? 'text-danger' : 'text-success'}`}>
              {loadingCotisations ? '...' : `${impayees.length} servant(s)`}
            </p>
          </Card>
        </div>

        <h2 className="font-extrabold mb-3">
          Servants en impayé — {MOIS_FR[today.getMonth()]} {today.getFullYear()}
        </h2>
        {!loadingCotisations && impayees.length === 0 && (
          <EmptyState title="Aucun impayé ce mois-ci" description="La caisse est à jour." />
        )}
        <div className="flex flex-col gap-2">
          {!loadingCotisations && impayees.length > 0 && (
            <Table
              columns={[
                { key: 'servant', label: 'Servant', render: (c) => c.servant_nom ?? `Servant #${c.servant}` },
                { key: 'date', label: 'Date', render: (c) => (
                  <span className="text-danger font-bold uppercase text-xs">
                    {new Date(c.date_debut_semaine).toLocaleDateString('fr-FR')}
                  </span>
                ) },
              ]}
              rows={impayees}
            />
          )}
        </div>
      </div>

      <Modal open={modalOuverte === 'entrees'} title="Détail des entrées" onClose={() => setModalOuverte(null)}>
        <p className="text-xs text-neutral-400 mb-3">Dons/divers + cotisations hebdomadaires payées + amendes encaissées.</p>
        <DetailList items={detailEntrees} emptyLabel="Aucune entrée enregistrée." />
      </Modal>

      <Modal open={modalOuverte === 'sorties'} title="Détail des sorties" onClose={() => setModalOuverte(null)}>
        <DetailList items={detailSorties} emptyLabel="Aucune sortie confirmée." />
      </Modal>

      <Modal open={modalOuverte === 'solde'} title="Composition du solde" onClose={() => setModalOuverte(null)}>
        {!chargementCaisse && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">Dons / divers</p>
              <p className="text-sm font-bold text-success">{formatMontant(solde.total_entrees_mouvements)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">Cotisations hebdomadaires payées</p>
              <p className="text-sm font-bold text-success">{formatMontant(solde.total_cotisations)}</p>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <p className="text-sm text-neutral-500">Total des sorties confirmées</p>
              <p className="text-sm font-bold text-danger">− {formatMontant(solde.total_sorties)}</p>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
              <p className="text-sm font-extrabold">Solde actuel de la caisse</p>
              <p className="text-base font-black">{formatMontant(solde.solde)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}