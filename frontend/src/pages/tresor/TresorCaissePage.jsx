import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { cotisationService } from '../../services/cotisationService'
import { MOIS_FR } from '../../utils/constants'

export default function TresorCaissePage() {
  const navigate = useNavigate()
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
      <Header title="Administrer la caisse" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold text-lg mb-3">
          {MOIS_FR[today.getMonth()]} {today.getFullYear()}
        </h2>

        {loading && <p className="text-neutral-400 text-sm mb-4">Chargement...</p>}

        {!loading && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <p className="text-xs font-semibold text-neutral-500 mb-1">Total collecté</p>
              <p className="text-xl font-extrabold text-success">
                {totalCollecte.toLocaleString('fr-FR')} F
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-neutral-500 mb-1">Impayés</p>
              <p className="text-xl font-extrabold text-danger">{impayees.length}</p>
            </Card>
          </div>
        )}

        <Card onClick={() => navigate('/tresor/impayes')} className="mb-3">
          <p className="font-bold text-sm">Voir les impayés</p>
        </Card>
        <Card onClick={() => navigate('/tresor/enregistrer-paiement')}>
          <p className="font-bold text-sm">Enregistrer un paiement</p>
        </Card>
      </div>
    </div>
  )
}