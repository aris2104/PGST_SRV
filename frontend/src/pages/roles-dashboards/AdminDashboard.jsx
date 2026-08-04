import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { DashboardActionButton } from './PresiSecreDashboard'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`bienvenu ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <DashboardActionButton label="Administrer le groupe" onClick={() => navigate('/admin/groupe')} />
        <DashboardActionButton label="Voir la caisse" onClick={() => navigate('/admin/caisse')} />
        <DashboardActionButton label="Sanctions" onClick={() => navigate('/admin/sanctions')} />
        <DashboardActionButton label="Programme & annonces" onClick={() => navigate('/admin/programme-annonces')} />
        <DashboardActionButton label="Activité" onClick={() => navigate('/admin/activite')} />
      </div>
    </div>
  )
}