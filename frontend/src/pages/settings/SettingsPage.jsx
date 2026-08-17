import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { canContactAdmin } from '../../utils/roleConfig'

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
      <Header title="Paramètres" />

      <div className="px-5 py-5">
        <button
          onClick={() => navigate('/parametres/mon-profil')}
          className="w-full flex items-center gap-3 mb-8 text-left"
        >
          <Avatar initials={user?.initiales ?? '--'} />
          <div>
            <p className="font-extrabold">{user?.nom_complet ?? '—'}</p>
            <p className="text-sm text-neutral-500 font-medium">
              Membre depuis {anneeAdhesion}
            </p>
          </div>
        </button>

        <h2 className="font-extrabold mb-3">COMPTE</h2>
        <SettingsRow label="Modifier mes infos" onClick={() => navigate('/parametres/profil')} />
        <SettingsRow label="Notifications" onClick={() => navigate('/parametres/notifications')} />
        <SettingsRow label="Confidentialité" onClick={() => navigate('/parametres/confidentialite')} />

        <h2 className="font-extrabold mb-3 mt-8">SUPPORT</h2>
        <SettingsRow label="Aide" onClick={() => navigate('/parametres/aide')} />
        {canContactAdmin(user) && (
          <SettingsRow label="Contacter l'admin" onClick={() => navigate('/parametres/contact-admin')} />
        )}

        <h2 className="font-extrabold mb-3 mt-8">À PROPOS</h2>
        <SettingsRow label="L'équipe" onClick={() => navigate('/parametres/equipe')} />

        <div className="mt-8">
          <Button variant="danger" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}