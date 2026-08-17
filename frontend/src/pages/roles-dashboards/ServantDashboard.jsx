import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { useAuth } from '../../context/AuthContext'
import { calendarService } from '../../services/calendarService'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function ServantDashboard() {
  const { user } = useAuth()
  const [annonces, setAnnonces] = useState([])
  const [ordresDuJour, setOrdresDuJour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('annonce')
  const highlightRefs = useRef({})

  useEffect(() => {
    calendarService
      .getAnnonces()
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
      .finally(() => setLoading(false))
    calendarService.getOrdresDuJour().then(setOrdresDuJour).catch(() => setOrdresDuJour([]))
  }, [])

  useEffect(() => {
    if (!highlightId || loading) return
    const el = highlightRefs.current[highlightId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, loading, annonces])

  const today = new Date().toISOString().slice(0, 10)
  const prochaine = (ordresDuJour ?? [])
    .filter((o) => o.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div>
      <Header title={`Bienvenue ${user?.prenom ?? ''}`} />

      <div className="px-5 py-5">
        <WelcomeVerset prenom={user?.prenom} />

        {ordresDuJour !== null && prochaine && (
          <Card className="p-4 bg-white border border-neutral-200 mb-5">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Prochaine réunion</p>
            <p className="font-bold text-neutral-800 mt-1 capitalize">{formatDate(prochaine.date)}</p>
            <p className="text-sm text-neutral-600">{prochaine.titre}</p>
          </Card>
        )}

        <h2 className="text-xl font-extrabold mb-4">Annonces</h2>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && annonces.length === 0 && (
          <p className="text-neutral-400 text-sm">Aucune annonce pour le moment.</p>
        )}

        <div className="flex flex-col gap-4">
          {annonces.map((annonce) => {
            const estCible = String(annonce.id) === highlightId
            return (
              <Card
                key={annonce.id}
                ref={(el) => { highlightRefs.current[annonce.id] = el }}
                className={`flex gap-3 items-start transition-colors duration-700 ${estCible ? 'bg-info/10' : ''}`}
              >
                <Badge
                  tone={annonce.portee === 'CIBLEE' ? 'accent' : 'info'}
                  className="w-16 flex-shrink-0 pt-0.5"
                >
                  {annonce.portee === 'CIBLEE' ? 'pour toi' : 'Générale'}
                </Badge>
                <p className="font-bold text-sm leading-snug">{annonce.contenu}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}