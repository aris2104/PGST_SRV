import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import { cotisationService } from '../../services/cotisationService'
import { MOIS_FR } from '../../utils/constants'

export default function CotisationDetailPage() {
  const today = new Date()
  const [annee] = useState(today.getFullYear())
  const [mois] = useState(today.getMonth() + 1)
  const [semaines, setSemaines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cotisationService
      .getDetailMois(annee, mois)
      .then(setSemaines)
      .catch(() => setSemaines([]))
      .finally(() => setLoading(false))
  }, [annee, mois])

  return (
    <div>
      <Header title="Ma cotisation" showBack />

      <div className="px-5 py-5">
        <h2 className="font-extrabold text-lg mb-4">
          {MOIS_FR[mois - 1]} {annee}
        </h2>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && semaines.length === 0 && (
          <p className="text-neutral-400 text-sm">Aucune cotisation enregistrée ce mois-ci.</p>
        )}

        <div className="flex flex-col gap-3">
          {semaines.map((s) => (
            <div key={s.id} className="bg-white rounded-card shadow-card px-4 py-3">
              <p
                className={`font-extrabold text-sm mb-0.5 ${
                  s.statut === 'PAYE' ? 'text-success' : 'text-danger'
                }`}
              >
                Semaine {s.numero_semaine}
              </p>
              <p className="font-bold text-sm">
                {s.statut === 'PAYE' ? 'payé' : 'impayé'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
