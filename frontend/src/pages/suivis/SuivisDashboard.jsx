import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import AnimatedNumber from '../../components/ui/AnimatedNumber'
import { useAuth } from '../../context/AuthContext'
import { getRoleConfig } from '../../utils/roleConfig'
import { ROLES } from '../../utils/constants'
import { calculerBadges } from '../../utils/badges'
import { sanctionService } from '../../services/sanctionService'
import { cotisationService } from '../../services/cotisationService'
import { presenceService } from '../../services/presenceService'

// NOTE IMPORTANTE (vérifié côté backend) :
// /sanctions/actives/ et /cotisations/resume/ renvoient TOUJOURS les
// données personnelles de l'utilisateur qui appelle l'API, quel que soit
// son rôle. Ce n'est donc utile que pour un SERVANT qui consulte SES
// PROPRES suivis.
//
// Pour un rôle responsable (Président, Secrétaire, Trésorier, Disciplinaire,
// Organisateur, Admin), la page n'affiche QUE la vue "groupe" (raccourcis
// vers les vraies pages de gestion) — plus de doublon avec une section
// personnelle qui n'a pas de sens pour un membre du bureau consultant Suivis
// dans le cadre de sa fonction.

export default function SuivisDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roleCode = user?.role?.code
  const { suiviTitle } = getRoleConfig(roleCode)

  const [sanctionsActives, setSanctionsActives] = useState(null)
  const [cotisationResume, setCotisationResume] = useState(null)
  const [presenceResume, setPresenceResume] = useState(null)
  const isServant = roleCode === ROLES.SERVANT

  useEffect(() => {
    // Les rôles responsables n'affichent plus cette section (voir plus bas),
    // donc plus la peine de déclencher ces 3 requêtes pour eux.
    if (!isServant) return
    sanctionService.getActives().then(setSanctionsActives).catch(() => null)
    cotisationService.getResume().then(setCotisationResume).catch(() => null)
    presenceService.getResume().then(setPresenceResume).catch(() => null)
  }, [isServant])

  const pourcentageMois = cotisationResume?.mois_en_cours?.pourcentage ?? 0
  const cumulAnnuel = cotisationResume?.cumul_annuel
  const dernieresReunions = presenceResume?.dernieres_reunions
  const cumulPresenceAnnuel = presenceResume?.cumul_annuel

  return (
    <div>
      <Header title={suiviTitle} />

      <div className="px-5 py-5">
        {/* --- Rôles responsables : uniquement la vue groupe, pas de doublon --- */}
        <RoleBusinessSection roleCode={roleCode} navigate={navigate} />

        {/* --- SERVANT uniquement : ses propres données personnelles --- */}
        {isServant && (
          <>
        <BadgesRow
          cotisationResume={cotisationResume}
          presenceResume={presenceResume}
          sanctionsActives={sanctionsActives}
          membreDepuis={user?.membre_depuis}
        />

        <h3 className="text-sm font-bold text-neutral-600 mb-2">Sanctions</h3>
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
        <h3 className="text-sm font-bold text-neutral-600 mb-2">Cotisations</h3>
        <Card
          onClick={() => navigate('/suivis/cotisation')}
          className="mb-6 hover:bg-neutral-300/60 transition-colors cursor-pointer"
        >
          <p className="text-xs font-semibold text-neutral-600 mb-1">
            ce mois-ci · <AnimatedNumber value={pourcentageMois} suffix="%" className="font-bold" />
          </p>
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
        <h3 className="text-sm font-bold text-neutral-600 mb-2">Présence aux réunions</h3>
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
                {dernieresReunions ? (
                  <>
                    <AnimatedNumber value={dernieresReunions.presentes} className="font-bold" />/
                    {dernieresReunions.total} dernières réunions
                  </>
                ) : (
                  '0/0 dernières réunions'
                )}
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
          </>
        )}
      </div>
    </div>
  )
}

// Un simple raccourci cliquable, réutilisé pour toutes les sections métier.
function ShortcutCard({ label, description, onClick }) {
  return (
    <Card
      onClick={onClick}
      className="mb-3 hover:bg-neutral-300/60 transition-colors cursor-pointer"
    >
      <p className="font-bold">{label}</p>
      {description && (
        <p className="text-xs font-semibold text-neutral-600 mt-0.5">{description}</p>
      )}
    </Card>
  )
}

// Badges du servant : calculés côté client à partir des résumés déjà
// chargés (aucun appel réseau en plus). N'affiche rien tant que les 3
// résumés ne sont pas encore là, pour ne pas montrer une rangée vide.
function BadgesRow({ cotisationResume, presenceResume, sanctionsActives, membreDepuis }) {
  if (!cotisationResume || !presenceResume || !sanctionsActives) return null

  const badges = calculerBadges({ cotisationResume, presenceResume, sanctionsActives, membreDepuis })
  if (badges.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-neutral-600 mb-2">Mes badges</h3>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {badges.map((badge, i) => (
          <div
            key={badge.id}
            title={badge.description}
            style={{ animationDelay: `${i * 80}ms` }}
            className="animate-pop-in flex-shrink-0 flex flex-col items-center gap-1 bg-card rounded-card shadow-card px-3 py-2.5 w-20 text-center"
          >
            <span className="text-2xl leading-none">{badge.emoji}</span>
            <span className="text-[10px] font-extrabold text-neutral-600 leading-tight">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Section affichée UNIQUEMENT pour les rôles responsables, au-dessus de la
// partie personnelle. SERVANT n'en a pas (il n'a pas de fonction métier).
function RoleBusinessSection({ roleCode, navigate }) {
  if (roleCode === ROLES.PRESIDENT || roleCode === ROLES.SECRETAIRE) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Suivi du groupe</h2>
        <ShortcutCard
          label="Membres"
          description="Consulter, ajouter et gérer les membres du groupe"
          onClick={() => navigate('/membres')}
        />
        <ShortcutCard
          label="Présences"
          description="Registre des présences aux réunions"
          onClick={() => navigate('/suivis/presences')}
        />
        <ShortcutCard
          label="Cotisations"
          description="Suivi des cotisations du groupe"
          onClick={() => navigate('/suivis/cotisation')}
        />
        <ShortcutCard
          label="Confirmations de caisse"
          description="Sorties de fonds en attente de validation"
          onClick={() => navigate('/caisse/confirmations')}
        />
      </div>
    )
  }

  if (roleCode === ROLES.TRESORIER) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Suivi financier</h2>
        <ShortcutCard
          label="Caisse"
          description="Solde, mouvements et impayés"
          onClick={() => navigate('/tresor/caisse')}
        />
        <ShortcutCard
          label="Impayés"
          description="Servants en retard de cotisation"
          onClick={() => navigate('/tresor/caisse')}
        />
        <ShortcutCard
          label="Enregistrer un paiement"
          onClick={() => navigate('/tresor/enregistrer-paiement')}
        />
        <ShortcutCard
          label="Membres"
          description="Consultation seule"
          onClick={() => navigate('/membres')}
        />
      </div>
    )
  }

  if (roleCode === ROLES.DISCIPLINAIRE) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Suivi disciplinaire</h2>
        <ShortcutCard
          label="Sanctions actives"
          description="Vue d'ensemble des sanctions en cours dans le groupe"
          onClick={() => navigate('/disciplinaire/sanctions')}
        />
        <ShortcutCard
          label="Nouvelle sanction"
          onClick={() => navigate('/disciplinaire/enregistrer')}
        />
        <ShortcutCard
          label="Membres"
          description="Consultation seule"
          onClick={() => navigate('/membres')}
        />
        <ShortcutCard
          label="Confirmations de caisse"
          description="Sorties de fonds en attente de validation"
          onClick={() => navigate('/caisse/confirmations')}
        />
      </div>
    )
  }

  if (roleCode === ROLES.ORGANISATEUR) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Suivi organisation</h2>
        <ShortcutCard
          label="Ordre du jour"
          description="Créer et consulter les ordres du jour"
          onClick={() => navigate('/organisateur/ordre-du-jour')}
        />
        <ShortcutCard
          label="Programme"
          description="Programme des prochaines réunions"
          onClick={() => navigate('/calendrier')}
        />
        <ShortcutCard
          label="Membres"
          description="Consultation seule"
          onClick={() => navigate('/membres')}
        />
        <ShortcutCard
          label="Confirmations de caisse"
          description="Sorties de fonds en attente de validation"
          onClick={() => navigate('/caisse/confirmations')}
        />
      </div>
    )
  }

  if (roleCode === ROLES.CEREMONIAIRE) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Suivi du programme</h2>
        <ShortcutCard
          label="Choisir les servants"
          description="Programme de messe de la semaine"
          onClick={() => navigate('/presi-secre/programme')}
        />
        <ShortcutCard
          label="Programme"
          description="Programme des prochaines réunions"
          onClick={() => navigate('/calendrier')}
        />
        <ShortcutCard
          label="Membres"
          description="Consultation seule"
          onClick={() => navigate('/membres')}
        />
        <ShortcutCard
          label="Sanctions"
          description="Le Cérémoniaire gère aussi la discipline"
          onClick={() => navigate('/disciplinaire/sanctions')}
        />
        <ShortcutCard
          label="Confirmations de caisse"
          description="Sorties de fonds en attente de validation"
          onClick={() => navigate('/caisse/confirmations')}
        />
      </div>
    )
  }

  if (roleCode === ROLES.ADMIN || roleCode === ROLES.SUPER_ADMIN) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Vue globale</h2>
        <ShortcutCard
          label="Groupe"
          description="Membres, rôles, statuts"
          onClick={() => navigate('/membres')}
        />
        <ShortcutCard
          label="Caisse"
          onClick={() => navigate('/admin/caisse')}
        />
        <ShortcutCard
          label="Sanctions"
          onClick={() => navigate('/disciplinaire/sanctions')}
        />
        <ShortcutCard
          label="Activité récente"
          onClick={() => navigate('/admin/activite')}
        />
        <ShortcutCard
          label="Confirmations de caisse"
          description="Sorties de fonds en attente de validation"
          onClick={() => navigate('/caisse/confirmations')}
        />
      </div>
    )
  }

  // CONSEILLER : quasi la même vue globale que l'Admin, SAUF l'activité
  // récente (journal brut) et la gestion des comptes — ça reste à l'Admin.
  if (roleCode === ROLES.CONSEILLER) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Vue globale</h2>
        <ShortcutCard
          label="Membres"
          description="Consultation"
          onClick={() => navigate('/membres')}
        />
        <ShortcutCard
          label="Caisse"
          onClick={() => navigate('/admin/caisse')}
        />
        <ShortcutCard
          label="Sanctions"
          onClick={() => navigate('/disciplinaire/sanctions')}
        />
        <ShortcutCard
          label="Confirmations de caisse"
          description="Sorties de fonds en attente de validation"
          onClick={() => navigate('/caisse/confirmations')}
        />
      </div>
    )
  }

  // SERVANT : pas de section métier.
  return null
}