// src/pages/roles-dashboards/CeremoniaireDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { sanctionService } from '../../services/sanctionService'

export default function CeremoniaireDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [actives, setActives] = useState(null)

  useEffect(() => {
    sanctionService
      .getHistorique()
      .then((liste) => setActives(liste.filter((s) => s.statut === 'ACTIVE').length))
      .catch(() => setActives(0))
  }, [])

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5 space-y-5">
        <WelcomeVerset prenom={user?.prenom} />
        <button
  onClick={() => navigate('/rapport')}
  className="w-full py-3.5 px-4 bg-slate-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
>
   Consulter le rapport global
</button>

        {/* --- Bloc Choix des Servants --- */}
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
            Gestion du Culte & Service
          </p>
          <button
            onClick={() => navigate('/presi-secre/programme')}
            className="w-full py-3.5 px-4 bg-[#24365A] text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-[#1b2944] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Faire le choix des servants
          </button>
        </div>

        {/* --- Bloc Discipline & Sanctions --- */}
        <div className="space-y-3">
          <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
            Discipline
          </p>

          <Card
            onClick={() => navigate('/disciplinaire/sanctions')}
            className="p-4 bg-white border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer rounded-2xl"
          >
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Sanctions actives</p>
            <p className={`text-2xl font-black mt-1 ${actives > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {actives === null ? '...' : actives}
            </p>
          </Card>

          <button
            onClick={() => navigate('/disciplinaire/enregistrer')}
            className="w-full py-3.5 px-4 bg-amber-600 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-amber-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Enregistrer une sanction
          </button>
        </div>
      </div>
    </div>
  )
}