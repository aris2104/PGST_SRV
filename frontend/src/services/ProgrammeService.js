import api from './api' // Ton instance axios qui pointe déjà sur /api

export const programmeService = {
  /**
   * Récupère la liste des messes / programmes
   */
  getProgrammes: async () => {
    const response = await api.get('calendrier/messes/')
    return response.data
  },

  /**
   * Envoie le nouveau programme de messe à Django
   */
  creerProgramme: async (programmeData) => {
    const response = await api.post('calendrier/messes/', programmeData)
    return response.data
  },

  /**
   * Récupère une messe spécifique
   */
  getProgrammeById: async (id) => {
    const response = await api.get(`calendrier/messes/${id}/`)
    return response.data
  },
}