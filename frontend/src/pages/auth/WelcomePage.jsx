import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // La PWA redémarre TOUJOURS sur "/" après un swipe/fermeture forcée
    // (start_url du manifeste). Sans cette vérification, cet écran
    // affichait systématiquement le bouton "Connexion" même quand la
    // session était encore valide — donnant l'impression trompeuse
    // d'être déconnecté à chaque réouverture de l'app.
    if (!loading && isAuthenticated) {
      navigate('/accueil', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full border-[3px] border-white/25 border-t-white animate-spin mx-auto" />
    )
  }

  return (
    <div className="text-center w-full">
      <h1 className="text-white text-2xl font-extrabold tracking-wide mb-12">
        BIENVENUE SUR PGST
      </h1>

      <Button variant="secondary" onClick={() => navigate('/connexion')} className="w-full max-w-xs mx-auto">
        Connexion
      </Button>
    </div>
  )
}