/** @type {import('tailwindcss').Config} */
export default {
  // On évite volontairement la classe générique '.dark' : certaines
  // extensions Chrome (simulateurs de téléphone, etc.) ajoutent elles-mêmes
  // une classe "dark" sur <html> pour leur propre thème, ce qui entre en
  // collision avec Tailwind et active notre mode nuit par erreur. On utilise
  // à la place un attribut propre à l'app : [data-theme="dark"].
  darkMode: ['selector', '[data-theme="dark"]'],
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
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}