import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { useAuth } from '../../context/AuthContext'

// Accueil du Conseiller : simple écran de bienvenue, sans bouton d'action.
// Le Conseiller ne fait aucun choix/aucune gestion depuis ce dashboard.
export default function ConseillerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />
      </div>
        <button
  onClick={() => navigate('/rapport')}
  className="w-full py-3.5 px-3 bg-slate-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
>
   Consulter le rapport global
</button>
    </div>
  )
}