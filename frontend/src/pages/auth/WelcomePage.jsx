import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'

export default function WelcomePage() {
  const navigate = useNavigate()

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