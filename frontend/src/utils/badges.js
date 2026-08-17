// Calcul des badges d'un servant, à partir des données déjà chargées par
// SuivisDashboard (résumés cotisations/présences + sanctions actives).
// Aucun appel réseau supplémentaire : tout part de ce que l'écran a déjà.

export function calculerBadges({ cotisationResume, presenceResume, sanctionsActives, membreDepuis }) {
  const badges = []

  const pourcentageMois = cotisationResume?.mois_en_cours?.pourcentage ?? 0
  const cumulAnnuelCotis = cotisationResume?.cumul_annuel
  const dernieresReunions = presenceResume?.dernieres_reunions
  const cumulPresenceAnnuel = presenceResume?.cumul_annuel

  if (sanctionsActives && !sanctionsActives.a_une_sanction_active) {
    badges.push({
      id: 'sans-accroc',
      emoji: '🕊️',
      label: 'Sans accroc',
      description: 'Aucune sanction active',
    })
  }

  if (pourcentageMois === 100) {
    badges.push({
      id: 'a-jour',
      emoji: '💰',
      label: 'À jour',
      description: 'Cotisation du mois payée en entier',
    })
  }

  if (cumulAnnuelCotis && cumulAnnuelCotis.total_attendu > 0) {
    const ratio = cumulAnnuelCotis.payees / cumulAnnuelCotis.total_attendu
    if (ratio >= 0.8) {
      badges.push({
        id: 'genereux',
        emoji: '🌟',
        label: 'Généreux',
        description: `${cumulAnnuelCotis.payees}/${cumulAnnuelCotis.total_attendu} semaines payées cette année`,
      })
    }
  }

  if (dernieresReunions && dernieresReunions.total >= 3 && dernieresReunions.presentes === dernieresReunions.total) {
    badges.push({
      id: 'ponctuel',
      emoji: '⏱️',
      label: 'Ponctuel',
      description: `Présent aux ${dernieresReunions.total} dernières réunions`,
    })
  }

  if (cumulPresenceAnnuel && cumulPresenceAnnuel.total > 0) {
    const ratio = cumulPresenceAnnuel.presentes / cumulPresenceAnnuel.total
    if (ratio >= 0.8) {
      badges.push({
        id: 'regulier',
        emoji: '🔥',
        label: 'Régulier',
        description: `${cumulPresenceAnnuel.presentes}/${cumulPresenceAnnuel.total} réunions cette année`,
      })
    }
  }

  if (membreDepuis) {
    const annees = new Date().getFullYear() - new Date(membreDepuis).getFullYear()
    if (annees >= 1) {
      badges.push({
        id: 'fidele',
        emoji: '🏵️',
        label: annees >= 5 ? 'Vétéran' : 'Fidèle',
        description: `Membre depuis ${annees} an${annees > 1 ? 's' : ''}`,
      })
    }
  }

  return badges
}