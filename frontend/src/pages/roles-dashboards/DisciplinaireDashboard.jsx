import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { DashboardActionButton } from './PresiSecreDashboard'

export default function DisciplinaireDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`bienvenu ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <DashboardActionButton label="Enregistrer une sanction" onClick={() => navigate('/disciplinaire/nouvelle-sanction')} />
        <DashboardActionButton label="Sanctions actives" onClick={() => navigate('/disciplinaire/sanctions')} />
        <DashboardActionButton label="Historique disciplinaire" onClick={() => navigate('/disciplinaire/sanctions')} />
      </div>
    </div>
  )
}