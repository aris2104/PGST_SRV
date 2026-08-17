import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'
import { adminService } from '../../services/adminService'

// Page "Membres", commune à tous les rôles responsables.
//
// Le backend distingue deux permissions (voir utils/permissions.py) :
// - CanBrowseMembers  : PRESIDENT, SECRETAIRE, TRESORIER, DISCIPLINAIRE,
//                       ORGANISATEUR, ADMIN -> peuvent CONSULTER la liste.
// - IsPresiOrSecretary: PRESIDENT, SECRETAIRE, ADMIN -> peuvent en plus
//                       AJOUTER un membre, changer un rôle, activer/désactiver.
//
// Cette page reflète exactement cette distinction côté frontend :
// tout le monde voit le tableau, seuls les rôles autorisés voient les
// contrôles d'administration.

const CAN_EDIT_ROLES = [ROLES.PRESIDENT, ROLES.SECRETAIRE, ROLES.ADMIN]

export default function MembersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = CAN_EDIT_ROLES.includes(user?.role?.code)
  // Sécurité : seul l'Admin peut changer le rôle d'un membre (voir aussi
  // la vérification côté backend dans UserViewSet.perform_update, qui est
  // la vraie ligne de défense — ceci n'est que le reflet côté UI).
  const canChangeRoles = user?.role?.code === ROLES.ADMIN

  const [membres, setMembres] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    // La liste des rôles ne sert qu'au select d'édition : inutile de
    // l'appeler pour un utilisateur qui ne peut pas changer les rôles.
    const requests = canChangeRoles
      ? Promise.all([adminService.getMembres(), adminService.getRoles()])
      : adminService.getMembres().then((m) => [m, []])

    requests
      .then(([m, r]) => {
        setMembres(m)
        setRoles(r)
      })
      .catch(() => setError("Impossible de charger la liste des membres."))
      .finally(() => setLoading(false))
  }, [canChangeRoles])

  const handleRoleChange = async (userId, roleId) => {
    setSavingId(userId)
    try {
      const updated = await adminService.changerRole(userId, roleId || null)
      setMembres((prev) => prev.map((m) => (m.id === userId ? { ...m, role: updated.role } : m)))
    } catch {
      setError("Le changement de rôle a échoué.")
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleActif = async (userId, current) => {
    setSavingId(userId)
    try {
      await adminService.toggleActif(userId, !current)
      setMembres((prev) => prev.map((m) => (m.id === userId ? { ...m, is_active: !current } : m)))
    } catch {
      setError("La mise à jour a échoué.")
    } finally {
      setSavingId(null)
    }
  }

  const columns = [
    {
      key: 'membre',
      label: 'Membre',
      render: (m) => (
        <div className="flex items-center gap-2 min-w-[130px]">
          <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center font-bold text-xs text-neutral-700 flex-shrink-0">
            {m.initiales}
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">{m.nom_complet}</p>
            <p className="text-[11px] text-neutral-500">{m.matricule}</p>
          </div>
        </div>
      ),
    },
    canChangeRoles
      ? {
          key: 'role',
          label: 'Rôle',
          render: (m) => (
            <select
              value={m.role?.id ?? ''}
              disabled={savingId === m.id}
              onChange={(e) => handleRoleChange(m.id, e.target.value)}
              className="px-2 py-1.5 rounded-md border border-neutral-300 text-xs bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">Aucun rôle</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.libelle}</option>
              ))}
            </select>
          ),
        }
      : {
          key: 'role',
          label: 'Rôle',
          render: (m) => (
            <span className="text-xs font-semibold text-neutral-600">
              {m.role?.libelle ?? 'Aucun rôle'}
            </span>
          ),
        },
    {
      key: 'statut',
      label: 'Statut',
      render: (m) =>
        canEdit ? (
          <button
            onClick={() => handleToggleActif(m.id, m.is_active)}
            disabled={savingId === m.id}
            className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${
              m.is_active ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
            }`}
          >
            {m.is_active ? 'Actif' : 'Désactivé'}
          </button>
        ) : (
          <span
            className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${
              m.is_active ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
            }`}
          >
            {m.is_active ? 'Actif' : 'Désactivé'}
          </span>
        ),
    },
  ]

  return (
    <div>
      <Header title="Membres" showBack />

      <div className="px-5 py-5">
        {canEdit && (
          <Button
            variant="secondary"
            className="mb-5 flex items-center justify-center gap-2"
            onClick={() => navigate('/membres/ajouter')}
          >
            <UserPlus size={16} /> Ajouter un membre
          </Button>
        )}

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {error && <p className="text-danger text-sm font-medium mb-3">{error}</p>}

        {!loading && membres.length === 0 && (
          <EmptyState title="Aucun membre enregistré" />
        )}

        {!loading && membres.length > 0 && (
          <Table stickyFirstColumn columns={columns} rows={membres} />
        )}
      </div>
    </div>
  )
}