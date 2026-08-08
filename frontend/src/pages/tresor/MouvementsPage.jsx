import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import BoutonPDF from '../../components/ui/BoutonPDF'
import EmptyState from '../../components/common/EmptyState'
import { caisseService } from '../../services/caisseService'

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

export default function MouvementsPage() {
  const navigate = useNavigate()
  const [mouvements, setMouvements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    caisseService.getMouvements()
      .then(setMouvements)
      .catch(() => setMouvements([]))
      .finally(() => setLoading(false))
  }, [])

  const totalEntrees = mouvements
    .filter((m) => m.type_mouvement === 'ENTREE')
    .reduce((s, m) => s + parseFloat(m.montant), 0)

  const totalSorties = mouvements
    .filter((m) => m.type_mouvement === 'SORTIE' && m.statut_global === 'CONFIRME')
    .reduce((s, m) => s + parseFloat(m.montant), 0)

  return (
    <div>
      <Header title="Mouvements de caisse" showBack />

      <div className="px-5 py-5">
        {/* Solde rapide */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-success/10 rounded-card p-3">
            <p className="text-xs font-bold text-success mb-1">Total Entrées</p>
            <p className="font-extrabold text-sm">{formatMontant(totalEntrees)}</p>
          </div>
          <div className="bg-danger/10 rounded-card p-3">
            <p className="text-xs font-bold text-danger mb-1">Total Sorties</p>
            <p className="font-extrabold text-sm">{formatMontant(totalSorties)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <Button
            className="flex items-center gap-2"
            onClick={() => navigate('/tresor/mouvements/nouveau')}
          >
            <Plus size={16} /> Nouveau
          </Button>
          {!loading && mouvements.length > 0 && (
            <BoutonPDF zone="mouvements" titre="Mouvements de caisse" />
          )}
        </div>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {!loading && mouvements.length === 0 && (
          <EmptyState title="Aucun mouvement enregistré" />
        )}

        <div id="pdf-zone-mouvements">
          <div className="flex flex-col gap-3">
          {mouvements.map((m) => {
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

                {/* Détail des confirmations */}
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
    </div>
  )
}