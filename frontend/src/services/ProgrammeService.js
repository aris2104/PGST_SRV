import api from './api' // Ton instance axios qui pointe déjà sur /api
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const programmeService = {
  /**
   * Récupère la liste des messes / programmes
   */
  getProgrammes: async () => {
    const response = await api.get('calendrier/messes/')
    return response.data
  },

  /**
   * Envoie le nouveau programme de messe à Django.
   * Fonctionne aussi hors-ligne (mis en attente puis envoyé automatiquement
   * au retour du réseau) : le résultat contient { queued: true } dans ce cas.
   */
  creerProgramme: async (programmeData, label = '') => {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: 'calendrier/messes/',
      data: programmeData,
      label: label || 'Nouveau programme de messe',
    })
  },

  /**
   * Récupère une messe spécifique
   */
  getProgrammeById: async (id) => {
    const response = await api.get(`calendrier/messes/${id}/`)
    return response.data
  },
}