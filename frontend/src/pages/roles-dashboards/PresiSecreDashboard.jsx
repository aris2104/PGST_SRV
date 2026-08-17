import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Header from '../../components/layout/Header'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { useAuth } from '../../context/AuthContext'

export function DashboardActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-card rounded-card shadow-card px-4 py-4 mb-3"
    >
      <span className="font-bold text-sm">{label}</span>
      <ChevronRight size={18} className="text-neutral-500" />
    </button>
  )
}

export default function PresiSecreDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const roleCode = String(user?.role_code ?? user?.role?.code ?? '').trim().toUpperCase()
  const estPresident = roleCode === 'PRESIDENT'

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />

        {/* Le choix des servants ("Programme") est désormais réservé au
            Président et au Cérémoniaire — le Secrétaire ne l'a plus. */}
        {estPresident && (
          <DashboardActionButton
            label="Programme Semaine"
            onClick={() => navigate('/presi-secre/programme')}
          />
        )}
        <DashboardActionButton 
          label="Publier une annonce" 
          onClick={() => navigate('/presi-secre/publier-annonce')} 
        />
        <DashboardActionButton
          label="Faire l'appel"
          onClick={() => navigate('/presi-secre/appel')}
        />
        <DashboardActionButton
          label="Rapport"
          onClick={() => navigate('/rapport')}
        />
      </div>
    </div>
  )
}