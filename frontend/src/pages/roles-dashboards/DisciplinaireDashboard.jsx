import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { sanctionService } from '../../services/sanctionService'

export default function DisciplinaireDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [actives, setActives] = useState(null)

  useEffect(() => {
    // NB : /sanctions/actives/ renvoie toujours les données PERSONNELLES de
    // l'appelant, quel que soit son rôle (voir SuivisDashboard.jsx) — donc
    // inutile ici. getHistorique() sans filtre renvoie tout le groupe pour
    // un rôle privilégié comme Disciplinaire.
    sanctionService
      .getHistorique()
      .then((liste) => setActives(liste.filter((s) => s.statut === 'ACTIVE').length))
      .catch(() => setActives(0))
  }, [])

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />
        <button
  onClick={() => navigate('/rapport')}
  className="w-full py-3.5 px-4 bg-slate-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
>
  Consulter le rapport global
</button>

        <Card
          onClick={() => navigate('/disciplinaire/sanctions')}
          className="p-4 bg-white border border-neutral-200 hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Sanctions actives</p>
          <p className={`text-2xl font-black mt-1 ${actives > 0 ? 'text-danger' : 'text-success'}`}>
            {actives === null ? '...' : actives}
          </p>
        </Card>
      </div>
    </div>
  )
}