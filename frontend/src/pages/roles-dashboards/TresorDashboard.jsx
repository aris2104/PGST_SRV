import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { DashboardActionButton } from './PresiSecreDashboard'

export default function TresorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`bienvenu ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <DashboardActionButton label="Administrer la caisse" onClick={() => navigate('/tresor/caisse')} />
        <DashboardActionButton label="Enregistrer un paiement" onClick={() => navigate('/tresor/enregistrer-paiement')} />
        <DashboardActionButton label="Voir les impayés" onClick={() => navigate('/tresor/impayes')} />
      </div>
    </div>
  )
}