/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette extraite pixel par pixel des maquettes Figma
        navy: {
          DEFAULT: '#24365A',   // fond des écrans de connexion
          light: '#2E4266',
        },
        header: '#3F4A77',      // bandeau supérieur (Annonces, Calendrier, Suivis...)
        olive: '#5C6B4C',       // cercles décoratifs
        maroon: {
          DEFAULT: '#6E1E1E',   // bouton Connexion / Se déconnecter
          dark: '#4E1414',
        },
        card: '#E4E4E4',        // fond des cartes (Annonces, Programme...)
        surface: '#F3EFEC',     // fond des écrans clairs (Calendrier, Suivis, Paramètres)
        success: '#2F9E44',     // "payé" / cotisation à jour
        danger: '#C0392B',      // "impayé" / sanction active
        info: '#2D6CDF',        // libellés "Générale"
        accent: '#3E8E6B',      // libellés "pour toi"
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        phone: '2.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
