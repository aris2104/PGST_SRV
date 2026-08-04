import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [matricule, setMatricule] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(matricule, password)
      navigate('/accueil', { replace: true })
    } catch {
      setError('Identifiant ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Conteneur fixe calé sur la hauteur exacte de l'écran (100dvh) sans défilement
    <div className="h-[100dvh] w-full flex flex-col justify-between px-6 py-8 overflow-hidden">
      
      {/* 1. Titre en haut */}
      <div className="pt-4 text-center">
        <h1 className="text-2xl font-black uppercase tracking-wider">Connexion</h1>
      </div>

      {/* 2. Formulaire centré verticalement */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto my-auto space-y-4">
        <Input
          label="Identifiant"
          placeholder="SRV-AriskPes"
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          autoComplete="username"
          required
        />

        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="text-danger text-sm font-medium my-2 text-center">{error}</p>
        )}

        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Connexion...' : 'Connexion'}
          </Button>
        </div>
      </form>

      {/* 3. Pied de page équilibrant l'alignement */}
      <div className="pb-2 text-center text-xs text-neutral-500">
        Plateforme PSGT
      </div>

    </div>
  )
}