import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import AnimatedNumber from '../../components/ui/AnimatedNumber'
import BoutonPDF from '../../components/ui/BoutonPDF'
import EmptyState from '../../components/common/EmptyState'
import { caisseService } from '../../services/caisseService'
import { cotisationService } from '../../services/cotisationService'

const STATUT_STYLE = {
  CONFIRME: { label: 'Confirmé', className: 'text-success bg-success/10' },
  DECLINE: { label: 'Décliné', className: 'text-danger bg-danger/10' },
  EN_ATTENTE: { label: 'En attente', className: 'text-amber-600 bg-amber-100' },
}

function formatMontant(m) {
  return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Une ligne de détail réutilisée dans les modales (Entrées / Sorties / Solde).
function LigneDetail({ item }) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{item.motif}</p>
          <p className="text-xs text-neutral-500">{formatDate(item.date)} · {item.origine}</p>
        </div>
        <p className={`font-extrabold text-sm flex-shrink-0 ${item.sens === 'ENTREE' ? 'text-success' : 'text-danger'}`}>
          {item.sens === 'ENTREE' ? '+' : '−'}{formatMontant(item.montant)}
        </p>
      </div>
    </div>
  )
}

export default function MouvementsPage() {
  const navigate = useNavigate()
  const [mouvements, setMouvements] = useState(null)
  const [cotisationsPayees, setCotisationsPayees] = useState(null)
  const [solde, setSolde] = useState(null)
  const [modalOuverte, setModalOuverte] = useState(null) // 'ENTREES' | 'SORTIES' | 'SOLDE' | null

  useEffect(() => {
    caisseService.getMouvements().then(setMouvements).catch(() => setMouvements([]))
    cotisationService.getToutesPayees().then(setCotisationsPayees).catch(() => setCotisationsPayees([]))
    caisseService.getSolde().then(setSolde).catch(() => setSolde(null))
  }, [])

  const chargement = mouvements === null || cotisationsPayees === null || solde === null

  const detailEntrees = chargement
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

  const sortiesToutes = chargement ? [] : mouvements.filter((m) => m.type_mouvement === 'SORTIE')
  const detailSorties = sortiesToutes.map((m) => ({
    key: `srt-${m.id}`, motif: m.motif, date: m.date, montant: m.montant,
    origine: m.initiee_par_nom || 'Trésorier', sens: 'SORTIE', statut_global: m.statut_global,
  }))

  return (
    <div>
      <Header title="Mouvements de caisse" showBack />

      <div className="px-5 py-5">
        {/* --- Tuiles cliquables : Entrées / Sorties / Solde --- */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Card onClick={() => setModalOuverte('ENTREES')} className="bg-success/10">
            <p className="text-xs font-bold text-success mb-1">Total Entrées</p>
            <p className="font-extrabold text-sm">
              {chargement ? '...' : <AnimatedNumber value={solde.total_entrees} suffix=" FCFA" />}
            </p>
            <p className="text-[10px] text-success/70 mt-1">{detailEntrees.length} entrée(s) · voir le détail</p>
          </Card>
          <Card onClick={() => setModalOuverte('SORTIES')} className="bg-danger/10">
            <p className="text-xs font-bold text-danger mb-1">Total Sorties</p>
            <p className="font-extrabold text-sm">
              {chargement ? '...' : <AnimatedNumber value={solde.total_sorties} suffix=" FCFA" />}
            </p>
            <p className="text-[10px] text-danger/70 mt-1">{sortiesToutes.length} sortie(s) · voir le détail</p>
          </Card>
        </div>

        <Card onClick={() => setModalOuverte('SOLDE')} className="bg-navy text-white mb-5">
          <p className="text-xs font-bold text-white/70 mb-1">Solde actuel de la caisse</p>
          <p className="font-extrabold text-2xl">
            {chargement ? '...' : <AnimatedNumber value={solde.solde} suffix=" FCFA" />}
          </p>
          <p className="text-[10px] text-white/60 mt-1">Entrées (dons + cotisations) − sorties confirmées</p>
        </Card>

        <div className="flex items-center justify-between mb-5">
          <Button
            className="flex items-center gap-2"
            onClick={() => navigate('/tresor/mouvements/nouveau')}
          >
            <Plus size={16} /> Nouveau
          </Button>
          {!chargement && mouvements.length > 0 && (
            <BoutonPDF zone="mouvements" titre="Mouvements de caisse" />
          )}
        </div>

        {chargement && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {!chargement && mouvements.length === 0 && (
          <EmptyState title="Aucun mouvement enregistré" />
        )}

        <div id="pdf-zone-mouvements">
          <div className="flex flex-col gap-3">
          {!chargement && mouvements.map((m) => {
            const estSortie = m.type_mouvement === 'SORTIE'
            const statut = estSortie ? STATUT_STYLE[m.statut_global] ?? STATUT_STYLE.EN_ATTENTE : null
            const enAttente = estSortie
              ? m.confirmations?.filter((c) => c.decision === 'EN_ATTENTE').length ?? 0
              : 0

            return (
              <div key={m.id} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{m.motif}</p>
                    <p className="text-xs text-neutral-500">{formatDate(m.date)} · {m.initiee_par_nom}</p>
                  </div>
                  <p className={`font-extrabold text-sm ml-2 ${estSortie ? 'text-danger' : 'text-success'}`}>
                    {estSortie ? '−' : '+'}{formatMontant(m.montant)}
                  </p>
                </div>

                {estSortie && statut && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${statut.className}`}>
                      {statut.label}
                    </span>
                    {enAttente > 0 && (
                      <p className="text-[11px] text-neutral-400">{enAttente} réponse(s) en attente</p>
                    )}
                  </div>
                )}

                {estSortie && m.confirmations?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.confirmations.map((c) => (
                      <span key={c.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.decision === 'CONFIRME' ? 'text-success border-success/30 bg-success/10'
                        : c.decision === 'DECLINE' ? 'text-danger border-danger/30 bg-danger/10'
                        : 'text-neutral-400 border-neutral-200 bg-neutral-50'
                      }`}>
                        {c.membre_nom}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          </div>
        </div>
      </div>

      <Modal open={modalOuverte === 'ENTREES'} onClose={() => setModalOuverte(null)} title="Détail des entrées">
        <p className="text-xs text-neutral-400 mb-3">Dons/divers + cotisations hebdomadaires payées + amendes encaissées.</p>
        {detailEntrees.length === 0 && <p className="text-sm text-neutral-400">Aucune entrée enregistrée.</p>}
        {detailEntrees.map((item) => <LigneDetail key={item.key} item={item} />)}
      </Modal>

      <Modal open={modalOuverte === 'SORTIES'} onClose={() => setModalOuverte(null)} title="Détail des sorties">
        {detailSorties.length === 0 && <p className="text-sm text-neutral-400">Aucune sortie enregistrée.</p>}
        {detailSorties.map((item) => (
          <div key={item.key}>
            <LigneDetail item={item} />
            {item.statut_global && item.statut_global !== 'CONFIRME' && (
              <p className="text-[11px] text-neutral-400 -mt-2 mb-2">
                {STATUT_STYLE[item.statut_global]?.label ?? item.statut_global} — pas encore déduite du solde
              </p>
            )}
          </div>
        ))}
      </Modal>

      <Modal open={modalOuverte === 'SOLDE'} onClose={() => setModalOuverte(null)} title="Pourquoi ce solde ?">
        {!chargement && (
          <>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-600">Dons / divers</p>
              <p className="font-extrabold text-success text-sm">+{formatMontant(solde.total_entrees_mouvements)}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-600">Cotisations hebdomadaires payées</p>
              <p className="font-extrabold text-success text-sm">+{formatMontant(solde.total_cotisations)}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-600">Total des sorties confirmées</p>
              <p className="font-extrabold text-danger text-sm">−{formatMontant(solde.total_sorties)}</p>
            </div>
            <div className="flex items-center justify-between py-3">
              <p className="text-sm font-extrabold">Solde actuel</p>
              <p className="font-extrabold text-navy text-base">{formatMontant(solde.solde)}</p>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Les amendes encaissées comptent dans "Dons / divers" (générées automatiquement au
              moment où le Trésorier les marque payées, depuis les Sanctions).
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}