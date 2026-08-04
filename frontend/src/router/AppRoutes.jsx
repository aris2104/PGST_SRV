import { useAuth } from '../context/AuthContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'

import WelcomePage from '../pages/auth/WelcomePage'
import LoginPage from '../pages/auth/LoginPage'

import HomePage from '../pages/home/HomePage'
import CalendarPage from '../pages/calendar/CalendarPage'

import SuivisDashboard from '../pages/suivis/SuivisDashboard'
import SanctionHistoryPage from '../pages/suivis/SanctionHistoryPage'
import CotisationDetailPage from '../pages/suivis/CotisationDetailPage'

// --- Settings ---
import SettingsPage from '../pages/settings/SettingsPage'
import EditProfilePage from '../pages/settings/EditProfilePage'
import NotificationsPage from '../pages/settings/NotificationsPage'
import ConfidentialitePage from '../pages/settings/ConfidentialitePage'
import AidePage from '../pages/settings/AidePage'
import ContactAdminPage from '../pages/settings/ContactAdminPage'

// --- Presi & Secré ---
import PublierAnnoncePage from '../pages/roles-dashboards/PublierAnnoncePage'
import PlanifierProgrammePage from '../pages/organisateur/PlanifierProgrammePage'

// --- Disciplinaire ---
import DisciplinaireSanctionsPage from '../pages/disciplinaire/DisciplinaireSanctionsPage'
import EnregistrerSanctionPage from '../pages/disciplinaire/EnregistrerSanctionPage'

// --- Trésorerie ---
import TresorCaissePage from '../pages/tresor/TresorCaissePage'
import TresorImpayesPage from '../pages/tresor/TresorImpayesPage'
import EnregistrerPaiementPage from '../pages/tresor/EnregistrerPaiementPage'

// --- Organisation ---
import EnregistrerOrdreDuJourPage from '../pages/organisateur/EnregistrerOrdreDuJourPage'

// --- Dashboards & Admin ---
import PresiSecreDashboard from '../pages/roles-dashboards/PresiSecreDashboard'
import TresorDashboard from '../pages/roles-dashboards/TresorDashboard'
import DisciplinaireDashboard from '../pages/roles-dashboards/DisciplinaireDashboard'
import OrganisateurDashboard from '../pages/roles-dashboards/OrganisateurDashboard'
import AdminDashboard from '../pages/roles-dashboards/AdminDashboard'
import AdminGroupPage from '../pages/admin/AdminGroupPage'
import AdminCaissePage from '../pages/admin/AdminCaissePage'
import AdminSanctionsPage from '../pages/admin/AdminSanctionsPage'
import AdminProgrammeAnnoncesPage from '../pages/admin/AdminProgrammeAnnoncesPage'
import AdminActivitePage from '../pages/admin/AdminActivitePage'
import PresencesPage from '../pages/suivis/PresencesPage'

import AddMemberPage from '../pages/members/AddMemberPage'

import { ROLES } from '../utils/constants'

export default function AppRoutes() {
  return (
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
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
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
      </Route>

      <Route path="*" element={<CatchAll />} />
    </Routes>
  )
}

function CatchAll() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/accueil' : '/'} replace />
}