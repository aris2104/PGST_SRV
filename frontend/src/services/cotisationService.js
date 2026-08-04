import api from './api'

export const cotisationService = {
  /** Bloc 'Cotisations' de l'écran Suivis : progression du mois + cumul annuel */
  async getResume() {
    const { data } = await api.get('/cotisations/resume/')
    return data
  },

  /** Écran 'Ma cotisation' : détail semaine par semaine d'un mois donné */
  async getDetailMois(annee, mois) {
    const { data } = await api.get('/cotisations/', { params: { annee, mois } })
    return data.results ?? data
  },

  /** Réservé au rôle Trésorier */
  async marquerPaye(cotisationId) {
    const { data } = await api.patch(`/cotisations/${cotisationId}/`, { statut: 'PAYE' })
    return data
  },

  /** Réservé au rôle Trésorier : enregistrer un nouveau paiement (semaine pas encore créée) */
  async enregistrerPaiement(payload) {
    const { data } = await api.post('/cotisations/', payload)
    return data
  },
}