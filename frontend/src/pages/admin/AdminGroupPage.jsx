import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/common/EmptyState'
import { adminService } from '../../services/adminService'

export default function AdminGroupPage() {
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    Promise.all([adminService.getMembres(), adminService.getRoles()])
      .then(([m, r]) => {
        setMembres(m)
        setRoles(r)
      })
      .catch(() => setError("Impossible de charger la liste des membres."))
      .finally(() => setLoading(false))
  }, [])

  const [info, setInfo] = useState('')

  const handleRoleChange = async (userId, roleId) => {
    setSavingId(userId)
    setInfo('')
    try {
      const resultat = await adminService.changerRole(userId, roleId || null)
      if (resultat.queued) {
        // Hors-ligne : on met à jour l'affichage tout de suite avec le rôle
        // choisi localement (optimiste), en attendant la confirmation
        // serveur qui arrivera au retour du réseau.
        const roleChoisi = roles.find((r) => String(r.id) === String(roleId)) || null
        setMembres((prev) => prev.map((m) => (m.id === userId ? { ...m, role: roleChoisi } : m)))
        setInfo("Pas de connexion : le changement de rôle sera appliqué dès le retour du réseau.")
      } else {
        setMembres((prev) => prev.map((m) => (m.id === userId ? { ...m, role: resultat.data.role } : m)))
      }
    } catch {
      setError("Le changement de rôle a échoué.")
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleActif = async (userId, current) => {
    setSavingId(userId)
    setInfo('')
    try {
      const resultat = await adminService.toggleActif(userId, !current)
      setMembres((prev) => prev.map((m) => (m.id === userId ? { ...m, is_active: !current } : m)))
      if (resultat.queued) {
        setInfo("Pas de connexion : la mise à jour sera appliquée dès le retour du réseau.")
      }
    } catch {
      setError("La mise à jour a échoué.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Header title="Membres" showBack />

      <div className="px-5 py-5">
        <Button
          variant="secondary"
          className="mb-5 flex items-center justify-center gap-2"
          onClick={() => navigate('/membres/ajouter')}
        >
          <UserPlus size={16} /> Ajouter un membre
        </Button>

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}
        {error && <p className="text-danger text-sm font-medium mb-3">{error}</p>}
        {info && <p className="text-info text-sm font-medium mb-3">{info}</p>}

        {!loading && membres.length === 0 && (
          <EmptyState title="Aucun membre enregistré" />
        )}

        {!loading && membres.length > 0 && (
          <Table
            stickyFirstColumn
            columns={[
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
              {
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
              },
              {
                key: 'statut',
                label: 'Statut',
                render: (m) => (
                  <button
                    onClick={() => handleToggleActif(m.id, m.is_active)}
                    disabled={savingId === m.id}
                    className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${
                      m.is_active ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
                    }`}
                  >
                    {m.is_active ? 'Actif' : 'Désactivé'}
                  </button>
                ),
              },
            ]}
            rows={membres}
          />
        )}
      </div>
    </div>
  )
}