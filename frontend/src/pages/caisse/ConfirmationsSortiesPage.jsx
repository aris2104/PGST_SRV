import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { caisseService } from '../../services/caisseService'

function formatMontant(m) {
  return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ConfirmationsSortiesPage() {
  const [sorties, setSorties] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  const charger = () => {
    caisseService.getMesConfirmations()
      .then(setSorties)
      .catch(() => setSorties([]))
      .finally(() => setLoading(false))
  }

  useEffect(charger, [])

  const handleStatuer = async (mouvementId, decision) => {
    setSavingId(mouvementId)
    try {
      await caisseService.statuer(mouvementId, decision)
      setSorties((prev) => prev.filter((s) => s.id !== mouvementId))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Header title="Sorties à approuver" showBack />

      <div className="px-5 py-5">
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && sorties.length === 0 && (
          <EmptyState
            title="Aucune sortie en attente"
            description="Tu n'as aucune sortie de fonds à approuver pour l'instant."
          />
        )}

        <div className="flex flex-col gap-4">
          {sorties.map((m) => (
            <div key={m.id} className="bg-white rounded-card shadow-card p-4">
              <p className="font-bold text-sm mb-1">{m.motif}</p>
              <p className="text-xs text-neutral-500 mb-0.5">{formatDate(m.date)}</p>
              <p className="text-xs text-neutral-500 mb-3">Proposé par {m.initiee_par_nom}</p>

              <p className="text-danger font-extrabold text-lg mb-1">
                − {formatMontant(m.montant)}
              </p>

              {m.description && (
                <p className="text-xs text-neutral-600 mb-3 italic">{m.description}</p>
              )}

              {/* Qui a déjà répondu */}
              {m.confirmations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {m.confirmations
                    .filter((c) => c.decision !== 'EN_ATTENTE')
                    .map((c) => (
                      <span key={c.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.decision === 'CONFIRME'
                          ? 'text-success border-success/30 bg-success/10'
                          : 'text-danger border-danger/30 bg-danger/10'
                      }`}>
                        {c.membre_nom} — {c.decision === 'CONFIRME' ? '✓' : '✗'}
                      </span>
                    ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleStatuer(m.id, 'CONFIRME')}
                  disabled={savingId === m.id}
                  className="flex-1 bg-success border-success"
                >
                  Confirmer
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleStatuer(m.id, 'DECLINE')}
                  disabled={savingId === m.id}
                  className="flex-1 text-danger border-danger"
                >
                  Décliner
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}