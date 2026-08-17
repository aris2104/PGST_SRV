import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { DashboardActionButton } from './PresiSecreDashboard'
import { useAuth } from '../../context/AuthContext'

export default function CeremoniaireDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />

        <DashboardActionButton
          label="Programme Semaine"
          onClick={() => navigate('/presi-secre/programme')}
        />
      </div>
    </div>
  )
}