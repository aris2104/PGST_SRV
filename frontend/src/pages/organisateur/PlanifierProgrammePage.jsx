import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Header from '../../components/layout/Header'
import { adminService } from '../../services/adminService'
import { programmeService } from '../../services/programmeService'

// État initial aligné sur les champs exacts de MesseSerializer
const initialFormState = {
  type_messe: '',
  date: '',
  heure: '',
  lieu: '',
  servants: [''], // Au moins un sélecteur de servant par défaut
}

export default function PlanifierProgrammePage() {
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [loadingMembres, setLoadingMembres] = useState(true)

  const [form, setForm] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Charger la liste des membres (servants) depuis la BDD
  useEffect(() => {
    adminService
      .getMembres()
      .then((data) => {
        setMembres(data || [])
        setLoadingMembres(false)
      })
      .catch((err) => {
        console.error('Erreur chargement membres:', err)
        setLoadingMembres(false)
      })
  }, [])

  // Champs texte / date / heure / lieu
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  // Changer la sélection d'un servant spécifique par son index
  const handleServantChange = (index, value) => {
    setForm((prev) => {
      const updatedServants = [...prev.servants]
      updatedServants[index] = value
      return { ...prev, servants: updatedServants }
    })
  }

  // Ajouter un nouveau champ de sélection de servant
  const handleAddServantField = () => {
    setForm((prev) => ({
      ...prev,
      servants: [...prev.servants, ''],
    }))
  }

  // Supprimer un champ de servant
  const handleRemoveServantField = (index) => {
    setForm((prev) => ({
      ...prev,
      servants: prev.servants.filter((_, i) => i !== index),
    }))
  }

  // Soumission et enregistrement
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMsg('')

    // 1. Filtrer les sélecteurs vides ET convertir les IDs string en Entiers (pour Django)
    const servantsFiltres = form.servants
      .filter((id) => id !== '')
      .map((id) => parseInt(id, 10))

    if (servantsFiltres.length === 0) {
      setError('Veuillez sélectionner au moins un servant de messe.')
      setSaving(false)
      return
    }

    // 2. Payload parfaitement conforme à MesseSerializer
    const payload = {
      type_messe: form.type_messe,
      date: form.date,
      heure: form.heure,
      lieu: form.lieu,
      servants: servantsFiltres,
    }

    try {
      // 3. Envoi à la base de données via Django REST API
      await programmeService.creerProgramme(payload)

      // 4. Réinitialisation complète du formulaire
      setForm(initialFormState)

      // 5. Notification de succès
      setSuccessMsg(' Le programme a été publié avec succès !')

      // Masquer le message après 4 secondes
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Erreur publication programme :', err.response?.data || err.message)
      
      const serverError = err.response?.data
        ? typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response.data
        : "Impossible de publier le programme. Vérifiez le serveur API Backend."

      setError(`Erreur backend : ${serverError}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      <Header title="Planifier un Service de Messe" showBack />

      <div className="max-w-xl mx-auto p-4">
        

        {/* Message de confirmation */}
        {successMsg && (
          <div className="mb-4 p-4 text-green-800 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-xl font-medium break-words">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 space-y-5">
          {/* Type / Intitulé de la Messe */}
          <div>
            <label htmlFor="type_messe" className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Type de Messe
            </label>
            <select
              id="type_messe"
              name="type_messe"
              required
              value={form.type_messe}
              onChange={handleChange('type_messe')}
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Sélectionner un type --</option>
              <option value="MATINALE">Messe matinale</option>
              <option value="SOIR">Messe du soir</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          {/* Date & Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={form.date}
                onChange={handleChange('date')}
                className="w-full px-3 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label htmlFor="heure" className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Heure
              </label>
              <input
                id="heure"
                name="heure"
                type="time"
                required
                value={form.heure}
                onChange={handleChange('heure')}
                className="w-full px-3 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Lieu de la Messe */}
          <div>
            <label htmlFor="lieu" className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Lieu de la Messe
            </label>
            <input
              id="lieu"
              name="lieu"
              type="text"
              placeholder="Ex: Église Principale, Chapelle, Cathédrale..."
              value={form.lieu}
              onChange={handleChange('lieu')}
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* SECTION DYNAMIQUE : SERVANTS DE MESSE */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-sm text-neutral-800">
                Servants désignés ({form.servants.length})
              </h3>
            </div>

            {loadingMembres ? (
              <p className="text-xs text-neutral-500 py-2">Chargement des membres...</p>
            ) : (
              <div className="space-y-2.5">
                {form.servants.map((servantId, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <label
                      htmlFor={`servant-select-${index}`}
                      className="text-xs font-bold text-neutral-400 w-5 text-right cursor-pointer"
                    >
                      {index + 1}.
                    </label>
                    <select
                      id={`servant-select-${index}`}
                      name={`servant_${index}`}
                      value={servantId}
                      onChange={(e) => handleServantChange(index, e.target.value)}
                      required
                      className="flex-1 px-3 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">-- Sélectionner un servant --</option>
                      {membres.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom_complet || `${m.prenom} ${m.nom}`} ({m.matricule || 'N/A'})
                        </option>
                      ))}
                    </select>

                    {/* Bouton pour supprimer une ligne si > 1 */}
                    {form.servants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveServantField(index)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition"
                        title="Retirer ce servant"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bouton d'ajout d'un servant */}
            <button
              type="button"
              onClick={handleAddServantField}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-dashed border-blue-400 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition"
            >
              <Plus size={16} /> Ajouter un servant
            </button>
          </div>

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-50"
          >
            {saving ? 'Publication en cours...' : 'Publier le programme'}
          </button>
        </form>
      </div>
    </div>
  )
}