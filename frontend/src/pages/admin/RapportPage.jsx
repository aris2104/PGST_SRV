import { useEffect, useState, useRef } from 'react'
import { Bell, Download } from 'lucide-react'
import Header from '../../components/layout/Header'
import { exportPDF } from '../../utils/exportPDF'
import api from '../../services/api'

function Section({ titre, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-extrabold text-base text-navy mb-3 pb-1 border-b-2 border-navy/20">
        {titre}
      </h2>
      {children}
    </div>
  )
}

function Tableau({ colonnes, lignes }) {
  if (!lignes.length) return <p className="text-sm text-neutral-400 italic">Aucune donnée.</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-neutral-100">
            {colonnes.map((c) => (
              <th key={c.key} className="px-3 py-2 text-[11px] font-extrabold uppercase text-neutral-500">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i} className="border-t border-neutral-100">
              {colonnes.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {c.render ? c.render(l) : l[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function RapportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const zoneRef = useRef(null)
  const autoImprime = useRef(false)
  const [envoiNotif, setEnvoiNotif] = useState(false)
  const [notifEnvoyee, setNotifEnvoyee] = useState(false)

  useEffect(() => {
    api.get('/activite/rapport/')
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  // Si l'utilisateur arrive depuis une notification push (app qui vient de
  // s'ouvrir), on déclenche l'impression automatiquement une fois les données chargées.
  useEffect(() => {
    if (!data || autoImprime.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('auto') === '1') {
      autoImprime.current = true
      setTimeout(() => exportPDF('rapport', { titre: 'Rapport complet PGST' }), 600)
    }
  }, [data])

  const handleDemanderNotification = async () => {
    setEnvoiNotif(true)
    try {
      await api.post('/activite/rapport/notifier/')
      setNotifEnvoyee(true)
    } catch {
      // silencieux, le bouton reste cliquable pour réessayer
    } finally {
      setEnvoiNotif(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Rapport complet" showBack />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] border-navy/25 border-t-navy animate-spin" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <Header title="Rapport complet" showBack />
        <p className="px-5 py-10 text-center text-neutral-400 text-sm">
          Impossible de charger le rapport. Vérifie ta connexion.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Header title="Rapport complet" showBack />
      <div className="px-5 py-5">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-neutral-400">Généré le {new Date(data.genere_le).toLocaleDateString('fr-FR')}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDemanderNotification}
              disabled={envoiNotif || notifEnvoyee}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-600 disabled:opacity-60"
              title="Recevoir une notification pour télécharger ce rapport plus tard, même app fermée"
            >
              <Bell size={14} />
              {notifEnvoyee ? 'Notification envoyée' : envoiNotif ? 'Envoi...' : 'M\'envoyer une notif'}
            </button>
            <button
              onClick={() => exportPDF('rapport', { titre: 'Rapport complet PGST' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold"
            >
              <Download size={14} />
              Télécharger PDF
            </button>
          </div>
        </div>

        <div id="pdf-zone-rapport" ref={zoneRef}>
          <Section titre="Cotisations du mois">
            <Tableau
              colonnes={[
                { key: 'nom', label: 'Nom', render: (l) => `${l['servant__prenom']} ${l['servant__nom']}` },
                { key: 'semaine', label: 'Semaine', render: (l) => `Sem. ${l.numero_semaine}` },
                { key: 'statut', label: 'Statut', render: (l) => l.statut === 'PAYE' ? '✓ Payé' : '✗ Impayé' },
                { key: 'montant', label: 'Montant', render: (l) => l.montant ? `${l.montant} FCFA` : '—' },
              ]}
              lignes={data.cotisations}
            />
          </Section>

          <Section titre="Sanctions actives">
            <Tableau
              colonnes={[
                { key: 'servant', label: 'Servant', render: (l) => `${l['servant__prenom']} ${l['servant__nom']}` },
                { key: 'type', label: 'Type', render: (l) => l.type_sanction },
                { key: 'motif', label: 'Motif', render: (l) => l.motif },
                { key: 'date', label: 'Date', render: (l) => new Date(l.date_decision).toLocaleDateString('fr-FR') },
              ]}
              lignes={data.sanctions_actives}
            />
          </Section>

          <Section titre="Présences (année en cours)">
            <Tableau
              colonnes={[
                { key: 'servant', label: 'Servant', render: (l) => `${l['servant__prenom']} ${l['servant__nom']}` },
                { key: 'date', label: 'Réunion', render: (l) => new Date(l['ordre_du_jour__date']).toLocaleDateString('fr-FR') },
                { key: 'statut', label: 'Statut', render: (l) => l.statut },
              ]}
              lignes={data.presences}
            />
          </Section>

          <Section titre="Mouvements de caisse">
            <Tableau
              colonnes={[
                { key: 'type', label: 'Type', render: (l) => l.type_mouvement },
                { key: 'motif', label: 'Motif', render: (l) => l.motif },
                { key: 'montant', label: 'Montant', render: (l) => `${l.montant} FCFA` },
                { key: 'date', label: 'Date', render: (l) => new Date(l.date).toLocaleDateString('fr-FR') },
                { key: 'par', label: 'Par', render: (l) => `${l['initiee_par__prenom'] ?? ''} ${l['initiee_par__nom'] ?? ''}`.trim() },
              ]}
              lignes={data.mouvements}
            />
          </Section>
        </div>
      </div>
    </div>
  )
}