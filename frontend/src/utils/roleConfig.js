// Configuration centrale par rôle.
// Source de vérité unique pour la navigation basse (BottomNavigation) et,
// plus tard, pour les dashboards/actions métier (étapes suivantes du plan).
//
// Objectif : arrêter de coder les libellés/routes en dur dans chaque
// composant. Un seul endroit à modifier si un rôle change de comportement.

import { ROLES } from './constants'

// Le 3e onglet de la navigation basse (actuellement "Suivis" pour tout le
// monde) doit pointer vers un contenu différent selon le rôle :
// - SERVANT              -> ses propres données (/suivis)
// - PRESIDENT/SECRETAIRE -> suivi du groupe
// - TRESORIER            -> suivi financier
// - DISCIPLINAIRE        -> suivi disciplinaire
// - ORGANISATEUR         -> suivi organisation
// - ADMIN                -> vue globale
//
// Pour l'instant toutes les routes renvoient encore vers /suivis
// (SuivisDashboard n'est pas encore rendu dynamique - ce sera l'étape 3).
// Le seul changement ici est le LIBELLÉ affiché dans la nav, calculé
// dynamiquement au lieu d'être figé sur "Suivis".

export const ROLE_CONFIG = {
  [ROLES.SERVANT]: {
    suiviLabel: 'Mes suivis',
    suiviRoute: '/suivis',
    suiviTitle: 'Mes suivis',
  },
  [ROLES.PRESIDENT]: {
    suiviLabel: 'Suivis',
    suiviRoute: '/suivis',
    suiviTitle: 'Suivi du groupe',
  },
  [ROLES.SECRETAIRE]: {
    suiviLabel: 'Suivis',
    suiviRoute: '/suivis',
    suiviTitle: 'Suivi du groupe',
  },
  [ROLES.TRESORIER]: {
    suiviLabel: 'Trésorerie',
    suiviRoute: '/suivis',
    suiviTitle: 'Suivi financier',
  },
  [ROLES.DISCIPLINAIRE]: {
    suiviLabel: 'Discipline',
    suiviRoute: '/suivis',
    suiviTitle: 'Suivi disciplinaire',
  },
  [ROLES.ORGANISATEUR]: {
    suiviLabel: 'Organisation',
    suiviRoute: '/suivis',
    suiviTitle: 'Suivi organisation',
  },
  [ROLES.CEREMONIAIRE]: {
    suiviLabel: 'Programme',
    suiviRoute: '/suivis',
    suiviTitle: 'Suivi du programme',
  },
  [ROLES.CONSEILLER]: {
    // Conseiller : pas d'accès de gestion, mêmes suivis personnels qu'un Servant.
    suiviLabel: 'Mes suivis',
    suiviRoute: '/suivis',
    suiviTitle: 'Mes suivis',
  },
  [ROLES.ADMIN]: {
    suiviLabel: 'Suivis',
    suiviRoute: '/suivis',
    suiviTitle: 'Vue globale',
  },
  [ROLES.SUPER_ADMIN]: {
    suiviLabel: 'Suivis',
    suiviRoute: '/suivis',
    suiviTitle: 'Vue globale',
  },
}

// Valeur de repli si le rôle de l'utilisateur est absent/inconnu
// (ex: pendant le chargement de la session).
const DEFAULT_CONFIG = {
  suiviLabel: 'Suivis',
  suiviRoute: '/suivis',
  suiviTitle: 'Suivis',
}

// Petite fonction utilitaire : renvoie la config du rôle passé, ou la
// config par défaut si le rôle n'existe pas dans ROLE_CONFIG.
export function getRoleConfig(roleCode) {
  return ROLE_CONFIG[roleCode] || DEFAULT_CONFIG
}
// "Contacter l'admin" (Paramètres > Support) n'a de sens que pour les
// utilisateurs qui NE SONT PAS admin : un admin a déjà son accès aux
// messages reçus via son propre dashboard ("Messages reçus"), et
// ContactAdminPage.jsx bascule lui-même vers une vue "boîte de réception"
// quand user.role.code === 'ADMIN'. Donc : visible pour tous sauf Admin.
export function canContactAdmin(user) {
  if (!user) return false
  const roleCode = user?.role_code || user?.role?.code || user?.role
  return String(roleCode).trim().toUpperCase() !== ROLES.ADMIN
}