import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// Petite sélection de versets (Bible Segond 1910, domaine public).
// On en tire un au hasard, stable pour la durée de la session (useMemo),
// pour ne pas qu'il change à chaque re-render du dashboard.
const VERSETS = [
  {
    texte: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.",
    reference: 'Proverbes 3:5',
  },
  {
    texte: "Que tout ce que vous faites se fasse avec charité.",
    reference: '1 Corinthiens 16:14',
  },
  {
    texte: "L'Éternel est ma force et mon bouclier ; en lui mon cœur se confie, et je suis secouru.",
    reference: 'Psaume 28:7',
  },
  {
    texte: "Servez-vous les uns les autres, chacun selon le don qu'il a reçu.",
    reference: '1 Pierre 4:10',
  },
  {
    texte: "Je puis tout par celui qui me fortifie.",
    reference: 'Philippiens 4:13',
  },
  {
    texte: "Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières.",
    reference: 'Philippiens 4:6',
  },
  {
    texte: "Aimez-vous les uns les autres, comme je vous ai aimés.",
    reference: 'Jean 13:34',
  },
  {
    texte: "Persévérez dans la prière, veillez-y avec actions de grâces.",
    reference: 'Colossiens 4:2',
  },
]

export default function WelcomeVerset({ prenom }) {
  const navigate = useNavigate()
  const verset = useMemo(() => VERSETS[Math.floor(Math.random() * VERSETS.length)], [])

  return (
    <div className="w-full bg-card rounded-card shadow-card p-4 mb-6">
      <p className="text-sm font-semibold text-neutral-500 mb-3">
        {prenom ? `Content de te revoir, ${prenom}.` : 'Content de te revoir.'}
      </p>
      <p className="text-sm font-medium text-neutral-700 italic leading-snug">
        « {verset.texte} »
      </p>
      <p className="text-xs font-bold text-neutral-400 mt-2 text-right">
        {verset.reference}
      </p>
      <button
        onClick={() => navigate('/chapelet')}
        className="w-full mt-4 pt-3 border-t border-neutral-200 text-xs font-extrabold text-maroon uppercase tracking-wide text-center"
      >
        Prier le chapelet
      </button>
    </div>
  )
}