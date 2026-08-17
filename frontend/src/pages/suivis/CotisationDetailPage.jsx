import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'
import { exportPDF } from '../../utils/exportPDF'
import { cotisationService } from '../../services/cotisationService'
import { MOIS_FR } from '../../utils/constants'

const ANNEE_COURANTE = new Date().getFullYear()
const ANNEES_DISPONIBLES = [ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1]

// Libellé compact d'une colonne, ex: "12/08" — même format que Présences.
function libelleColonne(dateDebutSemaine) {
  return new Date(dateDebutSemaine).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function CotisationDetailPage() {
  const today = new Date()
  // Par défaut : plage d'un seul mois (le mois en cours), mais l'utilisateur
  // peut étendre "Au" jusqu'à l'année suivante pour couvrir par exemple une
  // année scolaire (sept N -> juin N+1).
  const [anneeDebut, setAnneeDebut] = useState(today.getFullYear())
  const [moisDebut, setMoisDebut] = useState(today.getMonth() + 1)
  const [anneeFin, setAnneeFin] = useState(today.getFullYear())
  const [moisFin, setMoisFin] = useState(today.getMonth() + 1)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreurPlage, setErreurPlage] = useState('')

  const plageValide = anneeFin > anneeDebut || (anneeFin === anneeDebut && moisFin >= moisDebut)

  useEffect(() => {
    if (!plageValide) {
      setErreurPlage('La borne "Au" doit être après ou égale à la borne "Du".')
      setRecords([])
      setLoading(false)
      return
    }
    setErreurPlage('')
    setLoading(true)
    cotisationService
      .getDetailPeriode(anneeDebut, moisDebut, anneeFin, moisFin)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [anneeDebut, moisDebut, anneeFin, moisFin, plageValide])

  // Colonnes = toutes les dates de début de semaine réellement présentes
  // dans la plage sélectionnée, triées chronologiquement (même logique que
  // les colonnes-dates de la page Présences, pour rester cohérent).
  const colonnes = [...new Set(records.map((r) => r.date_debut_semaine))].sort()

  // On regroupe par servant : si l'API a renvoyé un seul servant (compte perso,
  // le backend filtre déjà pour un Servant simple), on a une vue individuelle ;
  // si elle en a renvoyé plusieurs (Trésorier/Admin), c'est la vue globale.
  const servantsMap = new Map()
  records.forEach((r) => {
    if (!servantsMap.has(r.servant)) {
      servantsMap.set(r.servant, { id: r.servant, nom: r.servant_nom, cellules: {} })
    }
    servantsMap.get(r.servant).cellules[r.date_debut_semaine] = r.statut
  })
  const lignes = [...servantsMap.values()]
  const vueGlobale = lignes.length > 1

  const totalSemaines = records.length
  const payees = records.filter((r) => r.statut === 'PAYE').length
  const impayees = records.filter((r) => r.statut === 'IMPAYE').length
  const tauxPaiement = totalSemaines > 0 ? Math.round((payees / totalSemaines) * 100) : 0

  const periodeLabel = anneeDebut === anneeFin && moisDebut === moisFin
    ? `${MOIS_FR[moisDebut - 1]} ${anneeDebut}`
    : `${MOIS_FR[moisDebut - 1]} ${anneeDebut} → ${MOIS_FR[moisFin - 1]} ${anneeFin}`

  const StatutBadge = ({ statut }) => {
    if (!statut) return <span className="text-neutral-300 font-bold text-[10px]">—</span>
    const payé = statut === 'PAYE'
    return (
      <span
        className={`inline-block px-2 py-0.5 text-[10px] font-black rounded ${
          payé ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}
      >
        {payé ? 'Payé' : 'Impayé'}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-10">
      <Header
        title={vueGlobale ? 'Caisse — Cotisations' : 'Ma cotisation'}
        subtitle={periodeLabel}
        showBack
      />

      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="font-extrabold text-lg">
          {vueGlobale ? 'Suivi des cotisations' : 'Mes cotisations'}
        </h2>
        {!loading && vueGlobale && lignes.length > 0 && (
          <button
            onClick={() => exportPDF('cotisation', { titre: 'Caisse — Cotisations', soustitre: periodeLabel })}
            className="print:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            PDF
          </button>
        )}
      </div>

      <div id="pdf-zone-cotisation" className="px-4 py-3 space-y-4 max-w-5xl mx-auto">
        {/* --- Filtres période : plage Du / Au, pouvant chevaucher 2 années --- */}
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <div>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase mb-1">Du</p>
            <div className="flex gap-1.5">
              <select
                value={moisDebut} onChange={(e) => setMoisDebut(Number(e.target.value))}
                className="px-2 py-2 rounded-md border border-neutral-300 text-sm bg-white flex-1 min-w-0"
              >
                {MOIS_FR.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={anneeDebut} onChange={(e) => setAnneeDebut(Number(e.target.value))}
                className="px-2 py-2 rounded-md border border-neutral-300 text-sm bg-white"
              >
                {ANNEES_DISPONIBLES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase mb-1">Au</p>
            <div className="flex gap-1.5">
              <select
                value={moisFin} onChange={(e) => setMoisFin(Number(e.target.value))}
                className="px-2 py-2 rounded-md border border-neutral-300 text-sm bg-white flex-1 min-w-0"
              >
                {MOIS_FR.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={anneeFin} onChange={(e) => setAnneeFin(Number(e.target.value))}
                className="px-2 py-2 rounded-md border border-neutral-300 text-sm bg-white"
              >
                {ANNEES_DISPONIBLES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {erreurPlage && (
          <p className="text-danger text-xs font-semibold print:hidden">{erreurPlage}</p>
        )}

        {loading && <p className="text-neutral-400 text-sm">Chargement...</p>}

        {!loading && !erreurPlage && lignes.length === 0 && (
          <EmptyState title="Aucune cotisation enregistrée pour cette période" />
        )}

        {!loading && lignes.length > 0 && (
          <>
            {/* --- SYNTHÈSE : cartes de stats --- */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 bg-white border border-neutral-200">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">
                  Semaines sur la période
                </p>
                <p className="text-xl font-black text-neutral-800 mt-1">{totalSemaines}</p>
              </Card>
              <Card className="p-3 bg-white border border-neutral-200">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Payées</p>
                <p className="text-xl font-black text-emerald-600 mt-1">{payees}</p>
              </Card>
              <Card className="p-3 bg-white border border-neutral-200">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Impayées</p>
                <p className="text-xl font-black text-rose-600 mt-1">{impayees}</p>
              </Card>
              <Card className="p-3 bg-white border border-neutral-200">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Taux de paiement</p>
                <p className={`text-xl font-black mt-1 ${tauxPaiement >= 75 ? 'text-emerald-600' : tauxPaiement >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {tauxPaiement}%
                </p>
              </Card>
            </div>

            {/* --- TABLEAU --- */}
            <Card className="p-0 overflow-hidden border border-neutral-200 shadow-sm bg-white">
              <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-neutral-800">
                  {vueGlobale ? `Détail par servant (${lignes.length})` : 'Détail par semaine'}
                </h3>
                {vueGlobale && (
                  <span className="print:hidden text-xs font-bold text-info bg-info/10 px-2.5 py-1 rounded-full">
                    Mode Gestionnaire
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-200 text-[10px] font-extrabold text-neutral-500 uppercase">
                      {vueGlobale && (
                        <th className="sticky left-0 bg-neutral-100 p-3 z-20 min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          Servant
                        </th>
                      )}
                      {colonnes.map((d) => (
                        <th key={d} className="p-2 text-center min-w-[68px] whitespace-nowrap">
                          {libelleColonne(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {lignes.map((l) => (
                      <tr key={l.id} className="hover:bg-neutral-50/80 transition">
                        {vueGlobale && (
                          <td className="sticky left-0 bg-white p-3 font-bold text-neutral-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap">
                            {l.nom}
                          </td>
                        )}
                        {colonnes.map((d) => (
                          <td key={d} className="p-2 text-center">
                            <StatutBadge statut={l.cellules[d]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- LÉGENDE --- */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">Payé</span>
                  Cotisation réglée
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[9px]">Impayé</span>
                  Cotisation en attente
                </span>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}