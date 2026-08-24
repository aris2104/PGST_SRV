import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const sanctionService = {
  /** Bloc 'Sanctions' de l'écran Suivis : "Aucune sanction active" ou nombre actif */
  async getActives() {
    const { data } = await api.get('/sanctions/actives/')
    return data
  },

  /** Écran Historique des sanctions : liste complète, la plus récente en premier */
  async getHistorique(servantId = null) {
    const params = servantId ? { servant: servantId } : {}
    const { data } = await api.get('/sanctions/', { params })
    return data.results ?? data
  },

  /** Réservé au rôle Disciplinaire : infliger une sanction */
  async creer(payload) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/sanctions/',
      data: payload,
      label: `Sanction — ${payload?.motif || ''}`,
    })
  },

  /** Réservé à l'Admin : corriger une sanction déjà créée (irréversible pour le Disciplinaire) */
  async modifier(id, payload) {
    return envoyerOuMettreEnAttente({
      method: 'patch',
      url: `/sanctions/${id}/`,
      data: payload,
      label: `Modification sanction #${id}`,
    })
  },

  /** Réservé à l'Admin : annuler/supprimer une sanction */
  async supprimer(id) {
    return envoyerOuMettreEnAttente({
      method: 'delete',
      url: `/sanctions/${id}/`,
      label: `Suppression sanction #${id}`,
    })
  },

  /** Réservé au Trésorier/Admin : encaisser une amende (crée une entrée de caisse) */
  async marquerAmendePayee(id) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: `/sanctions/${id}/marquer-amende-payee/`,
      label: `Amende payée — sanction #${id}`,
    })
  },
}