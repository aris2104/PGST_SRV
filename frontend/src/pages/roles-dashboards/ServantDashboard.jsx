import React, { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { calendarService } from '../../services/calendarService'

export default function ServantDashboard() {
  const { user } = useAuth()
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calendarService
      .getAnnonces()
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Header title={`Bienvenu ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <h2 className="text-xl font-extrabold mb-4">Annonces</h2>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && annonces.length === 0 && (
          <p className="text-neutral-400 text-sm">Aucune annonce pour le moment.</p>
        )}

        <div className="flex flex-col gap-4">
          {annonces.map((annonce) => (
            <Card key={annonce.id} className="flex gap-3 items-start">
              <Badge
                tone={annonce.portee === 'CIBLEE' ? 'accent' : 'info'}
                className="w-16 flex-shrink-0 pt-0.5"
              >
                {annonce.portee === 'CIBLEE' ? 'pour toi' : 'Générale'}
              </Badge>
              <p className="font-bold text-sm leading-snug">{annonce.contenu}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}