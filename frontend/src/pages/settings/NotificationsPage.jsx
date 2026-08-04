import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Switch from '../../components/ui/Switch'
import { userService } from '../../services/userService'

const LABELS = {
  annonces: { titre: 'Annonces', description: 'Nouvelles annonces générales et personnelles' },
  cotisations: { titre: 'Cotisations', description: 'Rappels de paiement hebdomadaire' },
  sanctions: { titre: 'Sanctions', description: "Notification en cas de sanction infligée" },
  programme: { titre: 'Programme', description: 'Changement du programme de la semaine' },
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)

  useEffect(() => {
    userService
      .getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setPrefs({ annonces: true, cotisations: true, sanctions: true, programme: true }))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
    setSavingKey(key)
    try {
      await userService.updateNotificationPreferences({ [key]: value })
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !value }))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div>
      <Header title="Notifications" showBack />

      <div className="px-5 py-5">
        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && prefs && (
          <div className="flex flex-col gap-2">
            {Object.entries(LABELS).map(([key, { titre, description }]) => (
              <div key={key} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm">{titre}</p>
                  <p className="text-xs text-neutral-500">{description}</p>
                </div>
                <Switch
                  checked={Boolean(prefs[key])}
                  disabled={savingKey === key}
                  onChange={(value) => handleToggle(key, value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}