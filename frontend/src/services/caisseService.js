import api from './api'
import { envoyerOuMettreEnAttente } from './offlineQueue'

export const caisseService = {
  async getMouvements() {
    const { data } = await api.get('/caisse/mouvements/')
    return data.results ?? data
  },

  async creerMouvement(payload) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: '/caisse/mouvements/',
      data: payload,
      label: `Mouvement de caisse — ${payload?.montant ?? ''}`,
    })
  },

  async getMesConfirmations() {
    const { data } = await api.get('/caisse/mouvements/mes_confirmations/')
    return data
  },

  async statuer(mouvementId, decision) {
    return envoyerOuMettreEnAttente({
      method: 'post',
      url: `/caisse/mouvements/${mouvementId}/statuer/`,
      data: { decision },
      label: `Confirmation de caisse #${mouvementId}`,
    })
  },

  /**
   * Source de vérité unique pour le solde de la caisse : entrées (mouvements
   * + cotisations payées) moins sorties confirmées. À utiliser partout au
   * lieu de recalculer localement — évite qu'un écran oublie une source
   * d'argent (ex: les cotisations, qui étaient ignorées avant ce correctif).
   */
  async getSolde() {
    const { data } = await api.get('/caisse/mouvements/solde/')
    return data
  },
}