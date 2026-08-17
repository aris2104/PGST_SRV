import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { useAuth } from '../../context/AuthContext'
import { DashboardActionButton } from './PresiSecreDashboard'
import WelcomeVerset from '../../components/ui/WelcomeVerset'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />

        <DashboardActionButton label="Sanctions" onClick={() => navigate('/admin/sanctions')} />
        <DashboardActionButton label="Programme & annonces" onClick={() => navigate('/admin/programme-annonces')} />
        <DashboardActionButton label="Rapport complet" onClick={() => navigate('/rapport')} />
        <DashboardActionButton label="Messages reçus" onClick={() => navigate('/parametres/contact-admin')} />
      </div>
    </div>
  )
}