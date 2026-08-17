import { useEffect, useRef, useState } from 'react'

/**
 * Anime un nombre de 0 (ou de sa valeur précédente) jusqu'à `value`.
 * Usage : <AnimatedNumber value={42} suffix="%" />
 */
export default function AnimatedNumber({ value, suffix = '', duration = 600, className = '' }) {
  const [affiche, setAffiche] = useState(0)
  const depart = useRef(0)
  const debutRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const cible = Number.isFinite(value) ? value : 0
    depart.current = affiche
    debutRef.current = null

    cancelAnimationFrame(frameRef.current)

    const step = (timestamp) => {
      if (debutRef.current === null) debutRef.current = timestamp
      const progres = Math.min((timestamp - debutRef.current) / duration, 1)
      // easeOutCubic : démarre vite, ralentit en douceur à l'arrivée
      const eased = 1 - Math.pow(1 - progres, 3)
      const valeurCourante = depart.current + (cible - depart.current) * eased
      setAffiche(valeurCourante)
      if (progres < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setAffiche(cible)
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  const estEntier = Number.isInteger(value)

  return (
    <span className={className}>
      {estEntier ? Math.round(affiche) : affiche.toFixed(1)}
      {suffix}
    </span>
  )
}