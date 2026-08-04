import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Header from '../../components/layout/Header'
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

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <DashboardActionButton
          label="Administrer le groupe"
          onClick={() => navigate('/membres/ajouter')}
        />
        <DashboardActionButton 
          label="Programme Semaine" 
          onClick={() => navigate('/presi-secre/programme')} 
        />
        <DashboardActionButton 
          label="Publier une annonce" 
          onClick={() => navigate('/presi-secre/publier-annonce')} 
        />
      </div>
    </div>
  )
}