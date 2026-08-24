// Équipe qui a travaillé sur PGST — page "À propos".
//
// COMMENT AJOUTER TON ÉQUIPE :
// 1. Dépose la photo de chaque personne dans /public/team/ (ex: /public/team/aristide.jpg)
// 2. Remplace les entrées ci-dessous par les vraies infos.
// 3. `role` est libre (ex: "Développeur", "Testeur", "Cheffe de projet"...).
// 4. `photo` : chemin vers l'image dans /public/team/, ou laisse `null`
//    pour afficher un avatar avec les initiales à la place.
//
// Les entrées ci-dessous sont des exemples à remplacer.

export const CATEGORIES = {
  DEV: 'Développement',
  TEST: 'Tests & qualité',
  AUTRE: 'Autres contributions',
}

export const EQUIPE = [
  {
    id: 1,
    nom: 'Bimam KPESSOU',
    role: 'Développeur',
    categorie: CATEGORIES.DEV,
    photo: null, // ex: '/team/prenom-nom.jpg'
    bio: 'Biologiste, ingénieur cyber-sécurité et membre du groupe des servants de messe de togblé, Bimam a développé l\'application pour faciliter la gestion des activités du groupe et améliorer la communication entre les servants.',
  },
  {
    id: 2,
    nom: 'Ignace AGBO TCHAA',
    role: 'Développeur ',
    categorie: CATEGORIES.DEV,
    photo: null,
    bio: 'Ingénieur Cyber-Sécurité et membre du groupe des servants de messe de togblé, Ignace a développé l\'application pour faciliter la gestion des activités du groupe et améliorer la communication entre les servants.',
  },

  {
    id: 3,
    nom: 'Clives AGBO',
    role: 'Testeur & Conformité',
    categorie: CATEGORIES.TEST,
    photo: null,
    bio: 'Médecin et membre du groupe des servants de messe de togblé, Clives a testé l\'application pour s\’assurer qu\’elle répond aux besoins des servants et qu\’elle est conforme aux règles de confidentialité.',
  },
]