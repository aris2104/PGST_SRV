import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
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

        {!loading && membres.length === 0 && (
          <EmptyState title="Aucun membre enregistré" />
        )}

        <div className="flex flex-col gap-3">
          {membres.map((m) => (
            <div key={m.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center font-bold text-sm text-neutral-700 flex-shrink-0">
                    {m.initiales}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{m.nom_complet}</p>
                    <p className="text-xs text-neutral-500">{m.matricule}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActif(m.id, m.is_active)}
                  disabled={savingId === m.id}
                  className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full flex-shrink-0 ${
                    m.is_active ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
                  }`}
                >
                  {m.is_active ? 'Actif' : 'Désactivé'}
                </button>
              </div>

              <label className="block">
                <span className="block mb-1 text-xs font-semibold text-neutral-500">Rôle</span>
                <select
                  value={m.role?.id ?? ''}
                  disabled={savingId === m.id}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-navy"
                >
                  <option value="">Aucun rôle</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.libelle}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}