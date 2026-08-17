// Base de l'API Django (Redirigé automatiquement par le proxy de vite.config.js vers localhost:8000)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'

// Miroir JS de tailwind.config.js, utile pour les couleurs passées en JS (ex: SVG, inline style)
export const COLORS = {
  navy: '#24365A',
  navyLight: '#2E4266',
  header: '#3F4A77',
  olive: '#5C6B4C',
  maroon: '#6E1E1E',
  maroonDark: '#4E1414',
  card: '#E4E4E4',
  surface: '#F3EFEC',
  success: '#2F9E44',
  danger: '#C0392B',
  info: '#2D6CDF',
  accent: '#3E8E6B',
}

// Codes de rôle -> doivent correspondre à apps/roles/models.py (Role.Code) côté backend
export const ROLES = {
  PRESIDENT: 'PRESIDENT',
  SECRETAIRE: 'SECRETAIRE',
  TRESORIER: 'TRESORIER',
  DISCIPLINAIRE: 'DISCIPLINAIRE',
  ORGANISATEUR: 'ORGANISATEUR',
  CEREMONIAIRE: 'CEREMONIAIRE',
  CONSEILLER: 'CONSEILLER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  SERVANT: 'SERVANT',
}

export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const JOURS_FR_ABBR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']