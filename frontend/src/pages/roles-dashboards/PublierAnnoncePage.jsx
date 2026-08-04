import { useState } from 'react'

export default function PublierAnnoncePage() {
  const [annonce, setAnnonce] = useState({
    titre: '',
    categorie: 'Generale',
    contenu: '',
    urgente: false,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setAnnonce((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setAnnonce({
        titre: '',
        categorie: 'Generale',
        contenu: '',
        urgente: false,
      })
    }, 800)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Publier une Annonce Officielle
      </h1>

      {success && (
        <div className="mb-4 p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">
          L'annonce a été publiée avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l'annonce
          </label>
          <input
            type="text"
            name="titre"
            required
            value={annonce.titre}
            onChange={handleChange}
            placeholder="Ex: Réunion extraordinaire du bureau"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            name="categorie"
            value={annonce.categorie}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="Generale">Générale</option>
            <option value="Information">Information</option>
            <option value="Urgent">Urgent</option>
            <option value="Evénement">Événement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu du message
          </label>
          <textarea
            name="contenu"
            required
            rows="5"
            value={annonce.contenu}
            onChange={handleChange}
            placeholder="Rédigez le texte complet de votre annonce ici..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="urgente"
            name="urgente"
            checked={annonce.urgente}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="urgente" className="text-sm font-medium text-gray-700">
            Marquer comme annonce prioritaire / urgente
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Publication en cours...' : 'Publier l\'annonce'}
        </button>
      </form>
    </div>
  )
}