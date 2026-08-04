import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/common/EmptyState'
import { calendarService } from '../../services/calendarService'

export default function AdminProgrammeAnnoncesPage() {
  const [programme, setProgramme] = useState([])
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      calendarService.getProgrammeSemaine().catch(() => []),
      calendarService.getAnnonces().catch(() => []),
    ]).then(([prog, ann]) => {
      setProgramme(prog)
      setAnnonces(ann)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <Header title="Programme & Annonces" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold text-lg mb-3">Programme de la semaine</h2>
        {loading && <p className="text-neutral-400 text-sm mb-4">Chargement...</p>}
        {!loading && programme.length === 0 && (
          <EmptyState title="Aucun programme publié cette semaine" />
        )}
        <div className="flex flex-col gap-2 mb-6">
          {programme.map((m) => (
            <Card key={m.id} className="flex items-center justify-between">
              <p className="font-bold text-sm">{m.type_messe_display}</p>
              <p className="text-xs text-neutral-500">
                {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </p>
            </Card>
          ))}
        </div>

        <h2 className="font-extrabold text-lg mb-3">Annonces publiées</h2>
        {!loading && annonces.length === 0 && (
          <EmptyState title="Aucune annonce publiée" />
        )}
        <div className="flex flex-col gap-3">
          {annonces.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between mb-1.5">
                <Badge tone={a.portee === 'CIBLEE' ? 'accent' : 'info'}>
                  {a.portee === 'CIBLEE' ? 'pour toi' : 'Générale'}
                </Badge>
                <p className="text-xs text-neutral-400">
                  {new Date(a.date_publication).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <p className="font-bold text-sm">{a.contenu}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}