import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Avatar from '../../components/common/Avatar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

function Champ({ label, valeur }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-bold">{valeur || '—'}</span>
    </div>
  )
}

export default function ProfilPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const anneeAdhesion = user?.membre_depuis
    ? new Date(user.membre_depuis).getFullYear()
    : '—'

  return (
    <div>
      <Header title="Mon profil" showBack />

      <div className="px-5 py-5">
        <div className="flex flex-col items-center mb-6">
          <Avatar initials={user?.initiales ?? '--'} size={72} />
          <p className="font-extrabold text-lg mt-3">{user?.nom_complet ?? '—'}</p>
          <p className="text-sm text-neutral-500 font-medium">
            {user?.role?.libelle ?? 'Aucun rôle'}
          </p>
        </div>

        <Card className="mb-5">
          <Champ label="Matricule" valeur={user?.matricule} />
          <Champ label="Téléphone" valeur={user?.telephone} />
          <Champ label="Membre depuis" valeur={anneeAdhesion} />
          <Champ label="Rôle" valeur={user?.role?.libelle} />
        </Card>

        <Button variant="secondary" onClick={() => navigate('/parametres/profil')}>
          Modifier mes infos
        </Button>
      </div>
    </div>
  )
}