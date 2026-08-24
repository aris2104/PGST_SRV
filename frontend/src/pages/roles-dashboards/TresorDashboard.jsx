import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { DashboardActionButton } from './PresiSecreDashboard'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { caisseService } from '../../services/caisseService'
import { cotisationService } from '../../services/cotisationService'

function formatMontant(m) {
  return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR')
}

/** Liste de détails générique affichée dans les modales de tuiles. */
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

export default function TresorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [solde, setSolde] = useState(null)
  const [mouvements, setMouvements] = useState(null)
  const [cotisationsPayees, setCotisationsPayees] = useState(null)
  const [impayesCount, setImpayesCount] = useState(null)
  const [modalOuverte, setModalOuverte] = useState(null) // 'entrees' | 'sorties' | 'solde' | null

  const rechargerSolde = () => {
    caisseService.getSolde().then(setSolde).catch(() => setSolde(null))
    caisseService.getMouvements().then(setMouvements).catch(() => setMouvements([]))
  }

  useEffect(() => {
    const today = new Date()
    rechargerSolde()
    cotisationService.getToutesPayees().then(setCotisationsPayees).catch(() => setCotisationsPayees([]))
    cotisationService
      .getDetailMois(today.getFullYear(), today.getMonth() + 1)
      .then((data) => setImpayesCount(data.filter((c) => c.statut === 'IMPAYE').length))
      .catch(() => setImpayesCount(0))
  }, [])

  const chargement = solde === null || mouvements === null || cotisationsPayees === null

  const detailEntrees = chargement
    ? []
    : [
        ...mouvements
          .filter((m) => m.type_mouvement === 'ENTREE')
          .map((m) => ({
            key: `mvt-${m.id}`,
            motif: m.motif,
            date: m.date,
            montant: m.montant,
            origine: m.initiee_par_nom || 'Trésorier',
            sens: 'ENTREE',
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

  const detailSorties = chargement
    ? []
    : mouvements
        .filter((m) => m.type_mouvement === 'SORTIE' && m.statut_global === 'CONFIRME')
        .map((m) => ({
          key: `srt-${m.id}`,
          motif: m.motif,
          date: m.date,
          montant: m.montant,
          origine: m.initiee_par_nom || 'Trésorier',
          sens: 'SORTIE',
        }))

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />
        <button
  onClick={() => navigate('/rapport')}
  className="w-full py-3.5 px-4 bg-slate-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
>
  Consulter le rapport global
</button>

        <h2 className="font-extrabold text-lg mb-3">Trésorerie</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className="p-3 bg-white border border-neutral-200"
            onClick={() => setModalOuverte('solde')}
          >
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Solde actuel</p>
            <p className="text-lg font-black text-neutral-800 mt-1">
              {chargement ? '...' : formatMontant(solde.solde)}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Impayés ce mois</p>
            <p className={`text-lg font-black mt-1 ${impayesCount > 0 ? 'text-danger' : 'text-success'}`}>
              {impayesCount === null ? '...' : `${impayesCount} servant(s)`}
            </p>
          </Card>
          <Card
            className="p-3 bg-white border border-neutral-200"
            onClick={() => setModalOuverte('entrees')}
          >
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Encaissements</p>
            <p className="text-lg font-black text-success mt-1">
              {chargement ? '...' : formatMontant(solde.total_entrees)}
            </p>
          </Card>
          <Card
            className="p-3 bg-white border border-neutral-200"
            onClick={() => setModalOuverte('sorties')}
          >
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Dépenses</p>
            <p className="text-lg font-black text-danger mt-1">
              {chargement ? '...' : formatMontant(solde.total_sorties)}
            </p>
          </Card>
        </div>

        <h2 className="font-extrabold text-lg mb-3">Actions</h2>
        <DashboardActionButton label="Voir les impayés" onClick={() => navigate('/tresor/impayes')} />
      </div>

      <Modal open={modalOuverte === 'entrees'} title="Détail des entrées" onClose={() => setModalOuverte(null)}>
        <p className="text-xs text-neutral-400 mb-3">Dons/divers + cotisations hebdomadaires payées + amendes encaissées.</p>
        <DetailList items={detailEntrees} emptyLabel="Aucune entrée enregistrée." />
      </Modal>

      <Modal open={modalOuverte === 'sorties'} title="Détail des dépenses" onClose={() => setModalOuverte(null)}>
        <DetailList items={detailSorties} emptyLabel="Aucune dépense confirmée." />
      </Modal>

      <Modal open={modalOuverte === 'solde'} title="Composition du solde" onClose={() => setModalOuverte(null)}>
        {!chargement && (
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
              <p className="text-sm text-neutral-500">Total des dépenses confirmées</p>
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