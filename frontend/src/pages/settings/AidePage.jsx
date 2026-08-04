import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Header from '../../components/layout/Header'

const FAQ = [
  {
    question: "J'ai oublié mon mot de passe, que faire ?",
    reponse: "Contacte le Président, le Secrétaire ou l'Administrateur du groupe : "
      + "eux seuls peuvent réinitialiser ton mot de passe depuis l'espace d'administration.",
  },
  {
    question: 'Comment savoir si ma cotisation de la semaine est enregistrée ?',
    reponse: "Va dans Suivis > Cotisations, puis clique sur la barre de progression "
      + "pour voir le détail semaine par semaine du mois en cours.",
  },
  {
    question: 'Une sanction me semble injustifiée, que faire ?',
    reponse: "Utilise 'Contacter l'admin' ci-dessous pour expliquer ta situation. "
      + "Le motif complet de la sanction est visible dans Suivis > Sanctions.",
  },
  {
    question: "L'application ne se charge pas / écran blanc",
    reponse: 'Vérifie ta connexion internet, puis ferme et rouvre l\'application. '
      + "Si le problème persiste, contacte l'admin en précisant le modèle de ton téléphone.",
  },
]

export default function AidePage() {
  const [ouvert, setOuvert] = useState(null)

  return (
    <div>
      <Header title="Aide" showBack />

      <div className="px-5 py-5">
        <div className="flex flex-col gap-2">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-card shadow-card overflow-hidden">
              <button
                onClick={() => setOuvert(ouvert === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-bold text-sm pr-3">{item.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-neutral-400 flex-shrink-0 transition-transform ${ouvert === i ? 'rotate-180' : ''}`}
                />
              </button>
              {ouvert === i && (
                <p className="px-4 pb-4 text-sm text-neutral-600 leading-relaxed">{item.reponse}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}