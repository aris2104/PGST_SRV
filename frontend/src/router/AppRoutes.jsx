import { lazy, Suspense } from 'react'
import { useAuth } from '../context/AuthContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import { ROLES } from '../utils/constants'

// Chargement différé : chaque page n'est téléchargée que lorsqu'elle
// est réellement visitée. Le prefetch sur la nav (voir BottomNavigation)
// précharge les 4 onglets principaux au survol/touch pour une nav instantanée.

// Auth
const WelcomePage = lazy(() => import('../pages/auth/WelcomePage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))

// App (onglets)
const HomePage = lazy(() => import('../pages/home/HomePage'))
const CalendarPage = lazy(() => import('../pages/calendar/CalendarPage'))
const SuivisDashboard = lazy(() => import('../pages/suivis/SuivisDashboard'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))

// Suivis
const SanctionHistoryPage = lazy(() => import('../pages/suivis/SanctionHistoryPage'))
const CotisationDetailPage = lazy(() => import('../pages/suivis/CotisationDetailPage'))
const PresencesPage = lazy(() => import('../pages/suivis/PresencesPage'))

// Settings
const EditProfilePage = lazy(() => import('../pages/settings/EditProfilePage'))
const ProfilPage = lazy(() => import('../pages/settings/ProfilPage'))
const NotificationsPage = lazy(() => import('../pages/settings/NotificationsPage'))
const ConfidentialitePage = lazy(() => import('../pages/settings/ConfidentialitePage'))
const AidePage = lazy(() => import('../pages/settings/AidePage'))
const ContactAdminPage = lazy(() => import('../pages/settings/ContactAdminPage'))

// Presi & Secré
const PublierAnnoncePage = lazy(() => import('../pages/roles-dashboards/PublierAnnoncePage'))
const PlanifierProgrammePage = lazy(() => import('../pages/organisateur/PlanifierProgrammePage'))
const EnregistrerPresencePage = lazy(() => import('../pages/presi-secre/EnregistrerPresencePage'))

// Disciplinaire
const DisciplinaireSanctionsPage = lazy(() => import('../pages/disciplinaire/DisciplinaireSanctionsPage'))
const EnregistrerSanctionPage = lazy(() => import('../pages/disciplinaire/EnregistrerSanctionPage'))

// Trésorerie
const TresorCaissePage = lazy(() => import('../pages/tresor/TresorCaissePage'))
const TresorImpayesPage = lazy(() => import('../pages/tresor/TresorImpayesPage'))
const EnregistrerPaiementPage = lazy(() => import('../pages/tresor/EnregistrerPaiementPage'))
const NouveauMouvementPage = lazy(() => import('../pages/tresor/NouveauMouvementPage'))
const MouvementsPage = lazy(() => import('../pages/tresor/MouvementsPage'))
const ConfirmationsSortiesPage = lazy(() => import('../pages/caisse/ConfirmationsSortiesPage'))

// Organisation
const EnregistrerOrdreDuJourPage = lazy(() => import('../pages/organisateur/EnregistrerOrdreDuJourPage'))

// Dashboards & Admin
const PresiSecreDashboard = lazy(() => import('../pages/roles-dashboards/PresiSecreDashboard'))
const TresorDashboard = lazy(() => import('../pages/roles-dashboards/TresorDashboard'))
const DisciplinaireDashboard = lazy(() => import('../pages/roles-dashboards/DisciplinaireDashboard'))
const OrganisateurDashboard = lazy(() => import('../pages/roles-dashboards/OrganisateurDashboard'))
const AdminDashboard = lazy(() => import('../pages/roles-dashboards/AdminDashboard'))
const AdminGroupPage = lazy(() => import('../pages/admin/AdminGroupPage'))
const AdminCaissePage = lazy(() => import('../pages/admin/AdminCaissePage'))
const AdminSanctionsPage = lazy(() => import('../pages/admin/AdminSanctionsPage'))
const AdminProgrammeAnnoncesPage = lazy(() => import('../pages/admin/AdminProgrammeAnnoncesPage'))
const AdminActivitePage = lazy(() => import('../pages/admin/AdminActivitePage'))
const RapportPage = lazy(() => import('../pages/admin/RapportPage'))
const AddMemberPage = lazy(() => import('../pages/members/AddMemberPage'))

// Fallback spinner identique au splash screen
function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: '#24365A' }}>
      <div className="w-10 h-10 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* --- Authentification --- */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/connexion" element={<LoginPage />} />
      </Route>

      {/* --- Application (nécessite une session) --- */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/accueil" element={<HomePage />} />
        <Route path="/calendrier" element={<CalendarPage />} />

        {/* --- Suivis --- */}
        <Route path="/suivis" element={<SuivisDashboard />} />
        <Route path="/suivis/sanctions" element={<SanctionHistoryPage />} />
        <Route path="/suivis/cotisation" element={<CotisationDetailPage />} />
        <Route path="/suivis/presences" element={<PresencesPage />} />

        {/* --- Paramètres --- */}
        <Route path="/parametres" element={<SettingsPage />} />
        <Route path="/parametres/profil" element={<EditProfilePage />} />
        <Route path="/parametres/mon-profil" element={<ProfilPage />} />
        <Route path="/parametres/notifications" element={<NotificationsPage />} />
        <Route path="/parametres/confidentialite" element={<ConfidentialitePage />} />
        <Route path="/parametres/aide" element={<AidePage />} />
        <Route path="/parametres/contact-admin" element={<ContactAdminPage />} />

        {/* --- Membres --- */}
        <Route
          path="/membres/ajouter"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]}>
              <AddMemberPage />
            </ProtectedRoute>
          }
        />

        {/* --- Sous-pages Président/Secrétaire : le choix des servants + les annonces --- */}
        <Route
          path="/presi-secre/programme"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]}>
              <PlanifierProgrammePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/presi-secre/publier-annonce"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]}>
              <PublierAnnoncePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/presi-secre/appel"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]}>
              <EnregistrerPresencePage />
            </ProtectedRoute>
          }
        />


        {/* --- Sous-page Organisateur : uniquement l'ordre du jour --- */}
        <Route
          path="/organisateur/ordre-du-jour"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ORGANISATEUR, ROLES.ADMIN]}>
              <EnregistrerOrdreDuJourPage />
            </ProtectedRoute>
          }
        />

        {/* --- Disciplinaire --- */}
        <Route
          path="/disciplinaire/sanctions"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DISCIPLINAIRE, ROLES.ADMIN]}>
              <DisciplinaireSanctionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/disciplinaire/enregistrer"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DISCIPLINAIRE, ROLES.ADMIN]}>
              <EnregistrerSanctionPage />
            </ProtectedRoute>
          }
        />

        {/* --- Trésorerie --- */}
        <Route
          path="/tresor/caisse"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRESORIER, ROLES.ADMIN]}>
              <TresorCaissePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tresor/impayes"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRESORIER, ROLES.ADMIN]}>
              <TresorImpayesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tresor/enregistrer-paiement"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRESORIER, ROLES.ADMIN]}>
              <EnregistrerPaiementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tresor/mouvements"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRESORIER, ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]}>
              <MouvementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tresor/mouvements/nouveau"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRESORIER, ROLES.ADMIN]}>
              <NouveauMouvementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caisse/confirmations"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.DISCIPLINAIRE, ROLES.ORGANISATEUR, ROLES.ADMIN]}>
              <ConfirmationsSortiesPage />
            </ProtectedRoute>
          }
        />

        {/* --- Tableaux de bord par rôle --- */}
        <Route
          path="/administration/presi-secre"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]}>
              <PresiSecreDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administration/tresor"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRESORIER, ROLES.ADMIN]}>
              <TresorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administration/disciplinaire"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DISCIPLINAIRE, ROLES.ADMIN]}>
              <DisciplinaireDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administration/organisateur"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ORGANISATEUR, ROLES.ADMIN]}>
              <OrganisateurDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/administration/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* --- Sous-pages Admin --- */}
        <Route
          path="/admin/groupe"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/caisse"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminCaissePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sanctions"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminSanctionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/programme-annonces"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.TRESORIER, ROLES.DISCIPLINAIRE, ROLES.ORGANISATEUR]}>
              <AdminProgrammeAnnoncesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activite"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminActivitePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rapport"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.TRESORIER]}>
              <RapportPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<CatchAll />} />
    </Routes>
    </Suspense>
  )
}

function CatchAll() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/accueil' : '/'} replace />
}