import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'pgst-theme' // valeur stockée : 'light' | 'dark'

function getThemeInitiale() {
  const stockee = localStorage.getItem(STORAGE_KEY)
  if (stockee === 'light' || stockee === 'dark') return stockee
  // Pas de préférence enregistrée : on suit la préférence système au
  // premier lancement, puis l'utilisateur peut la changer manuellement.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getThemeInitiale)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être utilisé à l\'intérieur de <ThemeProvider>')
  return ctx
}