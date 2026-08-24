import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { calendarService } from '../../services/calendarService'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function OrganisateurDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ordresDuJour, setOrdresDuJour] = useState(null)

  useEffect(() => {
    calendarService.getOrdresDuJour().then(setOrdresDuJour).catch(() => setOrdresDuJour([]))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const aVenir = (ordresDuJour ?? [])
    .filter((o) => o.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const prochaine = aVenir[0]
  const chargement = ordresDuJour === null

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

        <h2 className="font-extrabold text-lg mb-3">Organisation</h2>

        <Card
          onClick={() => navigate('/organisateur/ordre-du-jour')}
          className="p-4 bg-white border border-neutral-200 mb-3 hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Prochaine réunion</p>
          {chargement ? (
            <p className="text-sm text-neutral-400 mt-1">Chargement...</p>
          ) : prochaine ? (
            <>
              <p className="font-bold text-neutral-800 mt-1 capitalize">{formatDate(prochaine.date)}</p>
              <p className="text-sm text-neutral-600">{prochaine.titre}</p>
            </>
          ) : (
            <p className="text-sm text-neutral-400 mt-1">Aucune réunion programmée</p>
          )}
        </Card>

        <Card
          onClick={() => navigate('/calendrier')}
          className="p-4 bg-white border border-neutral-200 hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Ordres du jour à venir</p>
          <p className="text-lg font-black text-neutral-800 mt-1">
            {chargement ? '...' : aVenir.length}
          </p>
        </Card>
      </div>
    </div>
  )
}