import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/userService'

export default function EditProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: user?.nom ?? '',
    prenom: user?.prenom ?? '',
    telephone: user?.telephone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await userService.updateMe(form)
      updateUser(updated)
      navigate('/parametres')
    } catch {
      setError("La mise à jour a échoué. Vérifie les champs et réessaie.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Modifier mes infos" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-5">
        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Prénom</span>
          <input
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            value={form.prenom}
            onChange={handleChange('prenom')}
            required
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Nom</span>
          <input
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            value={form.nom}
            onChange={handleChange('nom')}
            required
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1.5 font-semibold text-sm text-neutral-700">Téléphone</span>
          <input
            className="w-full px-4 py-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-navy"
            value={form.telephone}
            onChange={handleChange('telephone')}
            type="tel"
          />
        </label>

        {error && <p className="text-danger text-sm font-medium mb-4">{error}</p>}

        <Button type="submit" disabled={saving} className="mt-4">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  )
}
