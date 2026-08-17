import api from './api'

// Génère la liste chronologique de (année, mois) entre deux bornes
// incluses, en gérant le passage d'une année à l'autre.
// Ex: (2025, 9) -> (2026, 6) donne sept 2025, oct 2025, ... juin 2026.
function moisEntre(anneeDebut, moisDebut, anneeFin, moisFin) {
  const liste = []
  let a = anneeDebut
  let m = moisDebut
  // Garde-fou : on ne construit jamais plus de 24 mois d'un coup, pour
  // éviter une explosion de requêtes en cas de bornes inversées ou de
  // saisie erronée.
  let securite = 0
  while ((a < anneeFin || (a === anneeFin && m <= moisFin)) && securite < 24) {
    liste.push({ annee: a, mois: m })
    m += 1
    if (m > 12) { m = 1; a += 1 }
    securite += 1
  }
  return liste
}

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

  /**
   * Détail sur une PLAGE de mois, pouvant chevaucher deux années civiles
   * (ex: année scolaire septembre 2025 -> juin 2026).
   * Le backend ne filtre que sur un couple (année, mois) exact ; on agrège
   * donc côté frontend un appel par mois de la plage.
   */
  async getDetailPeriode(anneeDebut, moisDebut, anneeFin, moisFin) {
    const mois = moisEntre(anneeDebut, moisDebut, anneeFin, moisFin)
    const resultats = await Promise.allSettled(
      mois.map(({ annee, mois: m }) => this.getDetailMois(annee, m))
    )
    return resultats
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value)
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