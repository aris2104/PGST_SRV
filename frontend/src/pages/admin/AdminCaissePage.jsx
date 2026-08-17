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

/** Liste de détails générique affichée dans les modales de tuiles (même
 * composant que sur le dashboard Trésorier, pour rester cohérent). */
function DetailList({ mouvements, emptyLabel }) {
  if (!mouvements.length) {
    return <p className="text-sm text-neutral-400">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {mouvements.map((m) => (
        <div key={m.id} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0">
          <div>
            <p className="text-sm font-bold">{m.motif}</p>
            <p className="text-xs text-neutral-400">
              {formatDate(m.date)} · {m.initiee_par_nom || 'Trésorier'}
            </p>
            {m.description && <p className="text-xs text-neutral-500 mt-0.5">{m.description}</p>}
          </div>
          <p className={`text-sm font-black ${m.type_mouvement === 'ENTREE' ? 'text-success' : 'text-danger'}`}>
            {m.type_mouvement === 'ENTREE' ? '+' : '−'}{formatMontant(m.montant)}
          </p>
        </div>
      ))}
    </div>
  )
}

// Caisse — vue Admin/Conseiller : mêmes tuiles Entrées/Sorties/Solde que le
// dashboard Trésorier (mouvements de caisse), PLUS le suivi des cotisations
// impayées du mois. Avant, cette page ne montrait que les cotisations —
// incohérent avec "voir toute la caisse" pour ces deux rôles.
export default function AdminCaissePage() {
  const today = new Date()
  const [cotisations, setCotisations] = useState([])
  const [loadingCotisations, setLoadingCotisations] = useState(true)
  const [mouvements, setMouvements] = useState(null)
  const [modalOuverte, setModalOuverte] = useState(null) // 'entrees' | 'sorties' | 'solde' | null

  useEffect(() => {
    cotisationService
      .getDetailMois(today.getFullYear(), today.getMonth() + 1)
      .then(setCotisations)
      .catch(() => setCotisations([]))
      .finally(() => setLoadingCotisations(false))

    caisseService.getMouvements().then(setMouvements).catch(() => setMouvements([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const impayees = cotisations.filter((c) => c.statut === 'IMPAYE')

  const entrees = (mouvements ?? []).filter((m) => m.type_mouvement === 'ENTREE')
  const sorties = (mouvements ?? []).filter((m) => m.type_mouvement === 'SORTIE' && m.statut_global === 'CONFIRME')
  const totalEntrees = entrees.reduce((s, m) => s + parseFloat(m.montant), 0)
  const totalSorties = sorties.reduce((s, m) => s + parseFloat(m.montant), 0)
  const solde = totalEntrees - totalSorties
  const chargementMouvements = mouvements === null

  return (
    <div>
      <Header title="Caisse" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold text-lg mb-3">Solde &amp; mouvements</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-3 bg-white border border-neutral-200" onClick={() => setModalOuverte('solde')}>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Solde actuel</p>
            <p className="text-lg font-black text-neutral-800 mt-1">
              {chargementMouvements ? '...' : formatMontant(solde)}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200" onClick={() => setModalOuverte('entrees')}>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Entrées</p>
            <p className="text-lg font-black text-success mt-1">
              {chargementMouvements ? '...' : formatMontant(totalEntrees)}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200" onClick={() => setModalOuverte('sorties')}>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Sorties</p>
            <p className="text-lg font-black text-danger mt-1">
              {chargementMouvements ? '...' : formatMontant(totalSorties)}
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
        <DetailList mouvements={entrees} emptyLabel="Aucune entrée enregistrée." />
      </Modal>

      <Modal open={modalOuverte === 'sorties'} title="Détail des sorties" onClose={() => setModalOuverte(null)}>
        <DetailList mouvements={sorties} emptyLabel="Aucune sortie confirmée." />
      </Modal>

      <Modal open={modalOuverte === 'solde'} title="Composition du solde" onClose={() => setModalOuverte(null)}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Total des entrées</p>
            <p className="text-sm font-bold text-success">{formatMontant(totalEntrees)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Total des sorties confirmées</p>
            <p className="text-sm font-bold text-danger">− {formatMontant(totalSorties)}</p>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
            <p className="text-sm font-extrabold">Solde actuel de la caisse</p>
            <p className="text-base font-black">{formatMontant(solde)}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}