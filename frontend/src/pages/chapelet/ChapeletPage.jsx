import { useMemo, useState } from 'react'
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import Header from '../../components/layout/Header'
import { MYSTERES, buildSequence, getMystereDuJour } from '../../data/chapeletData'

// Icône simple pour un grain, selon son type. Pas de son, juste du visuel :
// le grain "actif" est mis en avant, les grains passés restent marqués,
// les grains à venir restent en attente.
function Grain({ type, statut, onClick }) {
  const tailleClass = type === 'PATER' ? 'w-4 h-4' : type === 'AVE' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const formeClass = type === 'GLOIRE' || type === 'FATIMA' ? 'rotate-45 rounded-sm' : 'rounded-full'

  const couleurClass =
    statut === 'fait'
      ? 'bg-olive'
      : statut === 'actif'
      ? 'bg-maroon scale-125'
      : 'bg-neutral-300'

  return (
    <button
      onClick={onClick}
      aria-label={type}
      className={`flex-shrink-0 transition-all duration-200 ${tailleClass} ${formeClass} ${couleurClass}`}
    />
  )
}

export default function ChapeletPage() {
  const mystereJour = useMemo(() => getMystereDuJour(), [])
  const [mystereKey, setMystereKey] = useState(mystereJour.cle)
  const sequence = useMemo(() => buildSequence(mystereKey), [mystereKey])
  const [index, setIndex] = useState(0)

  const etape = sequence[index]
  const termine = index >= sequence.length

  const grainsCourants = useMemo(() => {
    if (termine) return []
    // On regroupe les grains de la même "section" (intro, ou dizaine N)
    // pour n'afficher que le chapelet du groupe en cours à l'écran.
    const cleGroupe = etape.dizaine ?? 'intro'
    const debut = sequence.findIndex((g) => (g.dizaine ?? 'intro') === cleGroupe)
    const items = []
    for (let i = debut; i < sequence.length; i++) {
      if ((sequence[i].dizaine ?? 'intro') !== cleGroupe) break
      items.push({ ...sequence[i], globalIndex: i })
    }
    return items
  }, [etape, sequence, termine])

  const suivant = () => setIndex((i) => Math.min(i + 1, sequence.length))
  const precedent = () => setIndex((i) => Math.max(i - 1, 0))
  const recommencer = () => setIndex(0)
  const changerMystere = (cle) => {
    setMystereKey(cle)
    setIndex(0)
  }

  const progression = Math.round((Math.min(index, sequence.length) / sequence.length) * 100)

  return (
    <div>
      <Header title="Chapelet" showBack />

      <div className="px-5 py-5">
        {/* Sélecteur de mystère */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {Object.entries(MYSTERES).map(([cle, m]) => (
            <button
              key={cle}
              onClick={() => changerMystere(cle)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                mystereKey === cle
                  ? 'bg-maroon text-white'
                  : 'bg-card text-neutral-600'
              }`}
            >
              {m.nom}
            </button>
          ))}
        </div>
        {mystereKey === mystereJour.cle && (
          <p className="text-[11px] font-semibold text-neutral-400 mb-4 -mt-2">
            mystère du jour
          </p>
        )}

        {/* Barre de progression globale */}
        <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden mb-6">
          <div
            className="h-full bg-olive rounded-full transition-all duration-300"
            style={{ width: `${progression}%` }}
          />
        </div>

        {termine ? (
          <div className="bg-card rounded-card shadow-card p-6 text-center">
            <p className="font-extrabold text-lg mb-2">Chapelet terminé</p>
            <p className="text-sm text-neutral-600 mb-5">
              Merci pour ce temps de prière.
            </p>
            <button
              onClick={recommencer}
              className="inline-flex items-center gap-2 bg-maroon text-white font-bold text-sm px-5 py-2.5 rounded-card"
            >
              <RotateCcw size={16} />
              Recommencer
            </button>
          </div>
        ) : (
          <>
            {/* Titre de la dizaine en cours, le cas échéant */}
            {etape.titreDizaine && (
              <p className="text-center text-xs font-extrabold text-neutral-400 uppercase mb-2">
                {mystereKey && MYSTERES[mystereKey].nom} · {etape.dizaine}
                {etape.dizaine === 1 ? 'ère' : 'ème'} dizaine — {etape.titreDizaine}
              </p>
            )}

            {/* Chapelet visuel : les grains de la section en cours */}
            <div className="flex flex-wrap gap-2 justify-center mb-6 bg-white rounded-card shadow-card p-4">
              {grainsCourants.map((g) => (
                <Grain
                  key={g.globalIndex}
                  type={g.type}
                  statut={
                    g.globalIndex < index ? 'fait' : g.globalIndex === index ? 'actif' : 'attente'
                  }
                  onClick={() => setIndex(g.globalIndex)}
                />
              ))}
            </div>

            {/* Prière en cours */}
            <button
              onClick={suivant}
              className="w-full text-left bg-card rounded-card shadow-card p-5 mb-6"
            >
              <p className="text-xs font-extrabold text-maroon uppercase mb-2">
                {etape.label}
              </p>
              <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                {etape.texte}
              </p>
              <p className="text-[11px] font-semibold text-neutral-400 mt-3 text-center">
                touchez pour continuer
              </p>
            </button>

            {/* Navigation manuelle */}
            <div className="flex items-center justify-between">
              <button
                onClick={precedent}
                disabled={index === 0}
                className="flex items-center gap-1 text-sm font-bold text-neutral-500 disabled:opacity-30 px-3 py-2"
              >
                <ChevronLeft size={18} />
                Précédent
              </button>
              <p className="text-xs font-semibold text-neutral-400">
                {index + 1} / {sequence.length}
              </p>
              <button
                onClick={suivant}
                className="flex items-center gap-1 text-sm font-bold text-neutral-500 px-3 py-2"
              >
                Suivant
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}