import { useEffect, useState, useRef } from 'react'
import { Bell, Download, Filter } from 'lucide-react'
import Header from '../../components/layout/Header'
import { exportPDF } from '../../utils/exportPDF'
import api from '../../services/api'
import { adminService } from '../../services/adminService'

const SECTIONS_DISPONIBLES = [
  { key: 'cotisations', label: 'Cotisations' },
  { key: 'sanctions', label: 'Sanctions' },
  { key: 'presences', label: 'Présences' },
  { key: 'mouvements', label: 'Mouvements de caisse' },
]

function premierDuMois() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
function aujourdHui() {
  return new Date().toISOString().split('T')[0]
}

function Section({ titre, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-bold text-base mb-2 pb-1 border-b border-neutral-300">
        {titre}
      </h2>
      {children}
    </div>
  )
}

function Tableau({ colonnes, lignes }) {
  if (!lignes.length) return <p className="text-sm text-neutral-400 italic">Aucune donnée pour cette période.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr>
            {colonnes.map((c) => (
              <th key={c.key} className="px-2 py-1.5 text-xs font-bold border-b-2 border-neutral-800">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i}>
              {colonnes.map((c) => (
                <td key={c.key} className="px-2 py-1.5 border-b border-neutral-200">
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
  const [genererEnCours, setGenererEnCours] = useState(false)
  const zoneRef = useRef(null)
  const autoImprime = useRef(false)
  const [envoiNotif, setEnvoiNotif] = useState(false)
  const [notifEnvoyee, setNotifEnvoyee] = useState(false)
  const [membres, setMembres] = useState([])

  // --- Filtres ---
  const [dateDebut, setDateDebut] = useState(premierDuMois())
  const [dateFin, setDateFin] = useState(aujourdHui())
  const [servant, setServant] = useState('')
  const [sections, setSections] = useState(new Set(SECTIONS_DISPONIBLES.map((s) => s.key)))

  const chargerRapport = (params = {}) => {
    const query = {
      date_debut: dateDebut,
      date_fin: dateFin,
      ...(servant ? { servant } : {}),
      sections: [...sections].join(','),
      ...params,
    }
    return api.get('/activite/rapport/', { params: query }).then((r) => setData(r.data))
  }

  useEffect(() => {
    adminService.getMembres().then(setMembres).catch(() => setMembres([]))
    chargerRapport().catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  // Si l'utilisateur arrive depuis une notification push (app qui vient de
  // s'ouvrir), on déclenche l'impression automatiquement une fois les données chargées.
  useEffect(() => {
    if (!data || autoImprime.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('auto') === '1') {
      autoImprime.current = true
      setTimeout(() => exportPDF('rapport', { titre: 'Rapport PGST' }), 600)
    }
  }, [data])

  const toggleSection = (key) => {
    setSections((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleGenerer = async () => {
    setGenererEnCours(true)
    try {
      await chargerRapport()
    } catch {
      setData(null)
    } finally {
      setGenererEnCours(false)
    }
  }

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
        <Header title="Rapport" showBack />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-[3px] border-navy/25 border-t-navy animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Rapport" showBack />
      <div className="px-5 py-5">

        {/* --- Panneau de filtres --- */}
        <div className="bg-white rounded-card shadow-card p-4 mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <Filter size={14} className="text-neutral-400" />
            <p className="text-xs font-bold uppercase text-neutral-500">Filtres</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="block mb-1 text-[11px] font-semibold text-neutral-500">Du</span>
              <input
                type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md border border-neutral-300 text-sm"
              />
            </label>
            <label className="block">
              <span className="block mb-1 text-[11px] font-semibold text-neutral-500">Au</span>
              <input
                type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md border border-neutral-300 text-sm"
              />
            </label>
          </div>

          <label className="block mb-3">
            <span className="block mb-1 text-[11px] font-semibold text-neutral-500">Servant (optionnel)</span>
            <select
              value={servant} onChange={(e) => setServant(e.target.value)}
              className="w-full px-2.5 py-2 rounded-md border border-neutral-300 text-sm"
            >
              <option value="">Tout le monde</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>{m.nom_complet}</option>
              ))}
            </select>
          </label>

          <div className="mb-4">
            <span className="block mb-1.5 text-[11px] font-semibold text-neutral-500">Sections à inclure</span>
            <div className="flex flex-wrap gap-2">
              {SECTIONS_DISPONIBLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSection(s.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    sections.has(s.key)
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-neutral-500 border-neutral-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerer}
            disabled={genererEnCours || sections.size === 0}
            className="w-full py-2.5 rounded-md bg-navy text-white text-sm font-bold disabled:opacity-60"
          >
            {genererEnCours ? 'Génération...' : 'Appliquer les filtres'}
          </button>
        </div>

        {!data && (
          <p className="text-center text-neutral-400 text-sm py-10">
            Impossible de charger le rapport. Vérifie ta connexion.
          </p>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-neutral-400">
                {new Date(data.filtres.date_debut).toLocaleDateString('fr-FR')} → {new Date(data.filtres.date_fin).toLocaleDateString('fr-FR')}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDemanderNotification}
                  disabled={envoiNotif || notifEnvoyee}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-600 disabled:opacity-60"
                  title="Recevoir une notification pour télécharger ce rapport plus tard, même app fermée"
                >
                  <Bell size={14} />
                  {notifEnvoyee ? 'Notification envoyée' : envoiNotif ? 'Envoi...' : "M'envoyer une notif"}
                </button>
                <button
                  onClick={() => exportPDF('rapport', { titre: 'Rapport PGST' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold"
                >
                  <Download size={14} />
                  Télécharger PDF
                </button>
              </div>
            </div>

            <div id="pdf-zone-rapport" ref={zoneRef}>
              {sections.has('cotisations') && (
                <Section titre="Cotisations">
                  <Tableau
                    colonnes={[
                      { key: 'nom', label: 'Nom', render: (l) => `${l['servant__prenom']} ${l['servant__nom']}` },
                      { key: 'semaine', label: 'Semaine', render: (l) => `Sem. ${l.numero_semaine}` },
                      { key: 'statut', label: 'Statut', render: (l) => l.statut === 'PAYE' ? 'Payé' : 'Impayé' },
                      { key: 'montant', label: 'Montant', render: (l) => l.montant ? `${l.montant} FCFA` : '—' },
                    ]}
                    lignes={data.cotisations}
                  />
                </Section>
              )}

              {sections.has('sanctions') && (
                <Section titre="Sanctions">
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
              )}

              {sections.has('presences') && (
                <Section titre="Présences">
                  <Tableau
                    colonnes={[
                      { key: 'servant', label: 'Servant', render: (l) => `${l['servant__prenom']} ${l['servant__nom']}` },
                      { key: 'date', label: 'Réunion', render: (l) => new Date(l['ordre_du_jour__date']).toLocaleDateString('fr-FR') },
                      { key: 'statut', label: 'Statut', render: (l) => l.statut },
                    ]}
                    lignes={data.presences}
                  />
                </Section>
              )}

              {sections.has('mouvements') && (
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}