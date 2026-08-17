// Données du chapelet catholique : textes des prières (domaine public,
// prières traditionnelles) + mystères du jour + construction de la
// séquence complète grain par grain.

export const PRIERES = {
  CROIX: {
    label: 'Signe de croix',
    texte: 'Au nom du Père, et du Fils, et du Saint-Esprit. Amen.',
  },
  CREDO: {
    label: 'Je crois en Dieu',
    texte:
      "Je crois en Dieu, le Père tout-puissant, Créateur du ciel et de la terre. " +
      "Et en Jésus-Christ, son Fils unique, notre Seigneur, qui a été conçu du Saint-Esprit, " +
      "est né de la Vierge Marie, a souffert sous Ponce Pilate, a été crucifié, est mort et a été enseveli, " +
      "est descendu aux enfers, le troisième jour est ressuscité des morts, est monté aux cieux, " +
      "est assis à la droite de Dieu le Père tout-puissant, d'où il viendra juger les vivants et les morts. " +
      "Je crois en l'Esprit Saint, à la sainte Église catholique, à la communion des saints, " +
      "à la rémission des péchés, à la résurrection de la chair, à la vie éternelle. Amen.",
  },
  PATER: {
    label: 'Notre Père',
    texte:
      "Notre Père, qui es aux cieux, que ton nom soit sanctifié, que ton règne vienne, " +
      "que ta volonté soit faite sur la terre comme au ciel. Donne-nous aujourd'hui notre pain de ce jour. " +
      "Pardonne-nous nos offenses, comme nous pardonnons aussi à ceux qui nous ont offensés. " +
      "Et ne nous laisse pas entrer en tentation, mais délivre-nous du mal. Amen.",
  },
  AVE: {
    label: 'Je vous salue Marie',
    texte:
      "Je vous salue Marie, pleine de grâce, le Seigneur est avec vous. " +
      "Vous êtes bénie entre toutes les femmes, et Jésus, le fruit de vos entrailles, est béni. " +
      "Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l'heure de notre mort. Amen.",
  },
  GLOIRE: {
    label: 'Gloire au Père',
    texte:
      "Gloire au Père, et au Fils, et au Saint-Esprit. Comme il était au commencement, " +
      "maintenant et toujours, et dans les siècles des siècles. Amen.",
  },
  FATIMA: {
    label: 'Prière de Fatima',
    texte:
      "Ô mon Jésus, pardonnez-nous nos péchés, préservez-nous du feu de l'enfer, " +
      "conduisez au Ciel toutes les âmes, surtout celles qui ont le plus besoin de votre miséricorde. Amen.",
  },
}

// Les 4 séries de mystères, chacune avec ses 5 thèmes de méditation.
export const MYSTERES = {
  JOYEUX: {
    nom: 'Mystères joyeux',
    theme: ['Annonciation', 'Visitation', 'Nativité', 'Présentation au Temple', 'Recouvrement au Temple'],
  },
  LUMINEUX: {
    nom: 'Mystères lumineux',
    theme: ['Baptême de Jésus', 'Noces de Cana', "Annonce du Royaume", 'Transfiguration', "Institution de l'Eucharistie"],
  },
  DOULOUREUX: {
    nom: 'Mystères douloureux',
    theme: ['Agonie à Gethsémani', 'Flagellation', "Couronnement d'épines", 'Portement de la croix', 'Crucifixion'],
  },
  GLORIEUX: {
    nom: 'Mystères glorieux',
    theme: ['Résurrection', 'Ascension', 'Pentecôte', 'Assomption', 'Couronnement de Marie'],
  },
}

// Tradition : le mystère du jour dépend du jour de la semaine.
// getDay() -> 0 = dimanche, 1 = lundi, ... 6 = samedi
const MYSTERE_DU_JOUR = ['GLORIEUX', 'JOYEUX', 'DOULOUREUX', 'GLORIEUX', 'LUMINEUX', 'DOULOUREUX', 'JOYEUX']

export function getMystereDuJour(date = new Date()) {
  const cle = MYSTERE_DU_JOUR[date.getDay()]
  return { cle, ...MYSTERES[cle] }
}

// Construit la séquence complète des grains, dans l'ordre :
// croix -> credo -> pater -> 3x ave -> gloire -> 5 dizaines
// (chaque dizaine = pater + 10x ave + gloire + prière de Fatima)
export function buildSequence(mystereKey) {
  const mystere = MYSTERES[mystereKey] ?? MYSTERES.JOYEUX
  const sequence = []

  sequence.push({ type: 'CROIX', ...PRIERES.CROIX })
  sequence.push({ type: 'CREDO', ...PRIERES.CREDO })
  sequence.push({ type: 'PATER', ...PRIERES.PATER, intro: true })
  for (let i = 0; i < 3; i++) {
    sequence.push({ type: 'AVE', ...PRIERES.AVE, intro: true, indexAve: i + 1 })
  }
  sequence.push({ type: 'GLOIRE', ...PRIERES.GLOIRE, intro: true })

  for (let d = 0; d < 5; d++) {
    const titreDizaine = mystere.theme[d]
    sequence.push({
      type: 'PATER',
      ...PRIERES.PATER,
      dizaine: d + 1,
      titreDizaine,
    })
    for (let i = 0; i < 10; i++) {
      sequence.push({
        type: 'AVE',
        ...PRIERES.AVE,
        dizaine: d + 1,
        titreDizaine,
        indexAve: i + 1,
      })
    }
    sequence.push({ type: 'GLOIRE', ...PRIERES.GLOIRE, dizaine: d + 1, titreDizaine })
    sequence.push({ type: 'FATIMA', ...PRIERES.FATIMA, dizaine: d + 1, titreDizaine })
  }

  return sequence
}