import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { sanctionService } from '../../services/sanctionService'
import { cotisationService } from '../../services/cotisationService'
import { presenceService } from '../../services/presenceService'

export default function SuivisDashboard() {
  const navigate = useNavigate()
  const [sanctionsActives, setSanctionsActives] = useState(null)
  const [cotisationResume, setCotisationResume] = useState(null)
  const [presenceResume, setPresenceResume] = useState(null)

  useEffect(() => {
    sanctionService.getActives().then(setSanctionsActives).catch(() => null)
    cotisationService.getResume().then(setCotisationResume).catch(() => null)
    presenceService.getResume().then(setPresenceResume).catch(() => null)
  }, [])

  const pourcentageMois = cotisationResume?.mois_en_cours?.pourcentage ?? 0
  const cumulAnnuel = cotisationResume?.cumul_annuel
  const dernieresReunions = presenceResume?.dernieres_reunions
  const cumulPresenceAnnuel = presenceResume?.cumul_annuel

  return (
    <div>
      <Header title="Suivis" />

      <div className="px-5 py-5">
        {/* --- Sanctions --- */}
        <h2 className="text-lg font-extrabold mb-3">Sanctions</h2>
        <Card
          onClick={() => navigate('/suivis/sanctions')}
          className="mb-6 hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          <p
            className={`font-bold text-center mb-1 ${
              sanctionsActives?.a_une_sanction_active ? 'text-danger' : 'text-success'
            }`}
          >
            {sanctionsActives === null
              ? 'Chargement...'
              : sanctionsActives.a_une_sanction_active
              ? `${sanctionsActives.nombre} sanction(s) active(s)`
              : 'Aucune sanction active'}
          </p>
          <p className="text-center text-xs font-semibold text-neutral-600">
            cliquez pour voir l'historique
          </p>
        </Card>

        {/* --- Cotisations --- */}
        <h2 className="text-lg font-extrabold mb-3">Cotisations</h2>
        <Card
          onClick={() => navigate('/suivis/cotisation')}
          className="mb-6 hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          <p className="text-xs font-semibold text-neutral-600 mb-1">ce mois-ci</p>
          <div className="w-full h-2 rounded-full bg-neutral-300 overflow-hidden mb-3">
            <div
              className="h-full bg-success rounded-full transition-all duration-300"
              style={{ width: `${pourcentageMois}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-neutral-600 mb-0.5">cumul annuel</p>
          <p className="text-center text-sm font-bold text-neutral-500">
            {cotisationResume === null
              ? 'Chargement...'
              : cumulAnnuel
              ? `${cumulAnnuel.payees}/${cumulAnnuel.total_attendu} SEMAINES`
              : '0/48 SEMAINES'}
          </p>
        </Card>

        {/* --- Présence aux réunions --- */}
        <h2 className="text-lg font-extrabold mb-3">Présence aux reunions</h2>
        <Card
          onClick={() => navigate('/suivis/presences')}
          className="hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          {presenceResume === null ? (
            <p className="text-center text-sm font-semibold text-neutral-400 py-2">
              Chargement...
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-neutral-700 mb-3">
                {dernieresReunions
                  ? `${dernieresReunions.presentes}/${dernieresReunions.total} dernières réunions`
                  : '0/0 dernières réunions'}
              </p>
              <p className="text-xs font-semibold text-neutral-600 mb-0.5">cumul annuel</p>
              <p className="text-center text-sm font-bold text-neutral-500">
                {cumulPresenceAnnuel
                  ? `${cumulPresenceAnnuel.presentes}/${cumulPresenceAnnuel.total} réunions`
                  : '0/0 réunions'}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}