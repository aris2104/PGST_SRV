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

export default function TresorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mouvements, setMouvements] = useState(null)
  const [impayesCount, setImpayesCount] = useState(null)
  const [modalOuverte, setModalOuverte] = useState(null) // 'entrees' | 'sorties' | 'solde' | null

  useEffect(() => {
    const today = new Date()
    caisseService.getMouvements().then(setMouvements).catch(() => setMouvements([]))
    cotisationService
      .getDetailMois(today.getFullYear(), today.getMonth() + 1)
      .then((data) => setImpayesCount(data.filter((c) => c.statut === 'IMPAYE').length))
      .catch(() => setImpayesCount(0))
  }, [])

  const entrees = (mouvements ?? []).filter((m) => m.type_mouvement === 'ENTREE')
  const sorties = (mouvements ?? []).filter((m) => m.type_mouvement === 'SORTIE' && m.statut_global === 'CONFIRME')

  const totalEntrees = entrees.reduce((s, m) => s + parseFloat(m.montant), 0)
  const totalSorties = sorties.reduce((s, m) => s + parseFloat(m.montant), 0)

  const solde = totalEntrees - totalSorties
  const chargement = mouvements === null

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />

        <h2 className="font-extrabold text-lg mb-3">Trésorerie</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className="p-3 bg-white border border-neutral-200"
            onClick={() => setModalOuverte('solde')}
          >
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Solde actuel</p>
            <p className="text-lg font-black text-neutral-800 mt-1">
              {chargement ? '...' : formatMontant(solde)}
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
              {chargement ? '...' : formatMontant(totalEntrees)}
            </p>
          </Card>
          <Card
            className="p-3 bg-white border border-neutral-200"
            onClick={() => setModalOuverte('sorties')}
          >
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Dépenses</p>
            <p className="text-lg font-black text-danger mt-1">
              {chargement ? '...' : formatMontant(totalSorties)}
            </p>
          </Card>
        </div>

        <h2 className="font-extrabold text-lg mb-3">Actions</h2>
        <DashboardActionButton label="Voir les impayés" onClick={() => navigate('/tresor/impayes')} />
      </div>

      <Modal open={modalOuverte === 'entrees'} title="Détail des entrées" onClose={() => setModalOuverte(null)}>
        <DetailList mouvements={entrees} emptyLabel="Aucune entrée enregistrée." />
      </Modal>

      <Modal open={modalOuverte === 'sorties'} title="Détail des dépenses" onClose={() => setModalOuverte(null)}>
        <DetailList mouvements={sorties} emptyLabel="Aucune dépense confirmée." />
      </Modal>

      <Modal open={modalOuverte === 'solde'} title="Composition du solde" onClose={() => setModalOuverte(null)}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Total des entrées</p>
            <p className="text-sm font-bold text-success">{formatMontant(totalEntrees)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Total des dépenses</p>
            <p className="text-sm font-bold text-danger">− {formatMontant(totalSorties)}</p>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
            <p className="text-sm font-extrabold">Solde actuel de la caisse</p>
            <p className="text-base font-black">{formatMontant(solde)}</p>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Le solde correspond à la somme de toutes les entrées, moins la somme de toutes les
            dépenses confirmées par le bureau.
          </p>
        </div>
      </Modal>
    </div>
  )
}