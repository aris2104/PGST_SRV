import { useEffect, useState } from 'react'
import { calendarService } from '../services/calendarService'
import { supportService } from '../services/supportService'
import { caisseService } from '../services/caisseService'
import { useAuth } from '../context/AuthContext'

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000
const CACHE_DUREE_MS = 60 * 1000 // évite de re-fetch à chaque changement de page

let cache = { valeur: null, expireA: 0, cleUtilisateur: null }

async function chargerNotifications(estAdmin) {
  const maintenant = Date.now()

  const [annonces, ordresDuJour, messages, confirmations] = await Promise.all([
    calendarService.getAnnonces().catch(() => []),
    calendarService.getOrdresDuJour().catch(() => []),
    supportService.getMesMessages().catch(() => []),
    caisseService.getMesConfirmations().catch(() => []),
  ])

  // Sorties en attente de confirmation (pour les membres du bureau)
  const itemsConfirmations = confirmations.map((m) => ({
    type: 'confirmation',
    id: m.id,
    titre: `Sortie à approuver : ${m.motif}`,
    date: m.created_at,
  }))

  // Une annonce compte tant qu'elle a moins de 7 jours.
  const itemsAnnonces = annonces
    .filter((a) => maintenant - new Date(a.date_publication).getTime() <= SEPT_JOURS_MS)
    .map((a) => ({
      type: 'annonce',
      id: a.id,
      titre: a.titre || a.contenu?.slice(0, 60) || 'Annonce',
      date: a.date_publication,
    }))

  // Un ordre du jour compte tant que sa date de réunion tombe dans les 7 prochains jours.
  const itemsOdj = ordresDuJour
    .filter((o) => {
      const dateReunion = new Date(o.date).getTime()
      return dateReunion >= maintenant && dateReunion - maintenant <= SEPT_JOURS_MS
    })
    .map((o) => ({
      type: 'odj',
      id: o.id,
      titre: o.titre,
      date: o.date,
    }))

  // Messages : pour l'admin, ceux pas encore traités (peu importe l'âge, il faut y répondre) ;
  // pour tout le monde, une réponse fraîche (< 7 jours) reçue de l'admin.
  const itemsMessages = estAdmin
    ? messages
        .filter((m) => !m.traite)
        .map((m) => ({ type: 'message', id: m.id, titre: `${m.auteur_nom} : ${m.sujet}`, date: m.created_at }))
    : messages
        .filter((m) => m.reponse && maintenant - new Date(m.updated_at).getTime() <= SEPT_JOURS_MS)
        .map((m) => ({ type: 'message', id: m.id, titre: `Réponse : ${m.sujet}`, date: m.updated_at }))

  const items = [...itemsAnnonces, ...itemsOdj, ...itemsMessages, ...itemsConfirmations].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  return items
}

/** Retourne { count, items } pour la cloche : le chiffre du badge + le détail à afficher dans le panneau. */
export function useNotifications() {
  const { user } = useAuth()
  const estAdmin = user?.role?.code === 'ADMIN'
  const [items, setItems] = useState(cache.valeur ?? [])

  useEffect(() => {
    let annule = false

    const charger = async () => {
      const cleUtilisateur = user?.id ?? null
      if (
        cache.valeur !== null &&
        cache.cleUtilisateur === cleUtilisateur &&
        Date.now() < cache.expireA
      ) {
        setItems(cache.valeur)
        return
      }
      try {
        const resultat = await chargerNotifications(estAdmin)
        if (!annule) {
          cache = { valeur: resultat, expireA: Date.now() + CACHE_DUREE_MS, cleUtilisateur }
          setItems(resultat)
          // Badge icône PWA — Android Chrome/Edge uniquement, silencieux ailleurs
          if ('setAppBadge' in navigator) {
            resultat.length > 0
              ? navigator.setAppBadge(resultat.length).catch(() => {})
              : navigator.clearAppBadge().catch(() => {})
          }
        }
      } catch {
        // Silencieux : pas de badge/panneau si l'appel échoue, on ne bloque jamais le header.
      }
    }

    charger()
    return () => { annule = true }
  }, [user?.id, estAdmin])

  return { count: items.length, items }
}