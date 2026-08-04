import { useEffect, useState } from 'react'
import { Gavel, Wallet, Megaphone, Activity } from 'lucide-react'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/common/EmptyState'
import { adminService } from '../../services/adminService'

const ICONS = {
  sanction: Gavel,
  cotisation: Wallet,
  annonce: Megaphone,
}

function tempsEcoule(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const heures = Math.floor(diffMs / 3_600_000)
  if (heures < 1) return "à l'instant"
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.floor(heures / 24)
  return `il y a ${jours} j`
}

export default function AdminActivitePage() {
  const [evenements, setEvenements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService
      .getActiviteRecente()
      .then(setEvenements)
      .catch(() => setEvenements([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Header title="Activité" subtitle="Vue Admin" showBack />

      <div className="px-5 py-5">
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && evenements.length === 0 && (
          <EmptyState icon={Activity} title="Aucune activité récente" />
        )}

        <div className="flex flex-col">
          {evenements.map((e, i) => {
            const Icon = ICONS[e.type] ?? Activity
            return (
              <div key={i} className="flex gap-3 pb-5 relative">
                {i < evenements.length - 1 && (
                  <span className="absolute left-[15px] top-8 bottom-0 w-px bg-neutral-200" />
                )}
                <div className="w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center flex-shrink-0 z-10">
                  <Icon size={15} className="text-navy" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-bold text-sm">{e.titre}</p>
                  <p className="text-xs text-neutral-600 mb-1">{e.description}</p>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    {tempsEcoule(e.date)}{e.auteur ? ` · ${e.auteur}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}