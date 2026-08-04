import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

function SettingsRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-card shadow-card px-4 py-3.5 mb-2.5"
    >
      <span className="font-bold text-sm">{label}</span>
      <ChevronRight size={18} className="text-neutral-400" />
    </button>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const anneeAdhesion = user?.membre_depuis
    ? new Date(user.membre_depuis).getFullYear()
    : '—'

  const handleLogout = () => {
    logout()
    navigate('/connexion', { replace: true })
  }

  return (
    <div>
      <Header title="Parametres" />

      <div className="px-5 py-5">
        <div className="flex items-center gap-3 mb-8">
          <Avatar initials={user?.initiales ?? '--'} />
          <div>
            <p className="font-extrabold">{user?.nom_complet ?? '—'}</p>
            <p className="text-sm text-neutral-500 font-medium">
              Membre depuis {anneeAdhesion}
            </p>
          </div>
        </div>

        <h2 className="font-extrabold mb-3">COMPTE</h2>
        <SettingsRow label="Modifier mes infos" onClick={() => navigate('/parametres/profil')} />
        <SettingsRow label="Notifications" onClick={() => navigate('/parametres/notifications')} />
        <SettingsRow label="Confidentialité" onClick={() => navigate('/parametres/confidentialite')} />

        <h2 className="font-extrabold mb-3 mt-8">SUPPORT</h2>
        <SettingsRow label="Aide" onClick={() => navigate('/parametres/aide')} />
        <SettingsRow label="Contacter l'admin" onClick={() => navigate('/parametres/contact-admin')} />

        <div className="mt-8">
          <Button variant="danger" onClick={handleLogout}>
            Se deconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}