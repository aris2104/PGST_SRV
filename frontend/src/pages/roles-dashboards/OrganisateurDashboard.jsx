import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { DashboardActionButton } from './PresiSecreDashboard'

export default function OrganisateurDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`bienvenu ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <DashboardActionButton label="Enregistrer l'ordre du jour" onClick={() => navigate('/organisateur/ordre-du-jour')} />
      </div>
    </div>
  )
}