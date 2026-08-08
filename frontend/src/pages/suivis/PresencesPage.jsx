import { useEffect, useState, useMemo, useCallback } from 'react'
import BoutonPDF from '../../components/ui/BoutonPDF'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import { calendarService } from '../../services/calendarService'
import { presenceService } from '../../services/presenceService'
import { useAuth } from '../../context/AuthContext'

// Configuration des statuts
const STATUTS = {
  PRESENT: { id: 'PRESENT', label: 'P', full: 'Présent', badge: 'bg-emerald-100 text-emerald-800' },
  RETARD: { id: 'RETARD', label: 'R', full: 'Retard', badge: 'bg-amber-100 text-amber-800' },
  PERMISSION: { id: 'PERMISSION', label: 'PERM', full: 'Permission', badge: 'bg-blue-100 text-blue-800' },
  ABSENT: { id: 'ABSENT', label: 'A', full: 'Absent', badge: 'bg-rose-100 text-rose-800' },
}

const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const cleanStr = dateStr.split('T')[0]
  const [year, month, day] = cleanStr.split('-')
  return `${day}/${month}`
}

export default function PresencesPage() {
  const { user } = useAuth()
  const [ordresDuJour, setOrdresDuJour] = useState([])
  const [presences, setPresences] = useState([])
  const [servants, setServants] = useState([])
  const [loading, setLoading] = useState(true)

  // Droits accès bureau (Président / Secrétaire / Admin)
  const isBureau = useMemo(() => {
    if (!user) return false
    if (user.is_superuser || user.is_staff) return true
    const roleCode = String(user.role_code || user.role?.code || user.role || '').toUpperCase().trim()
    return ['PRESIDENT', 'PRESI', 'SECRETAIRE', 'SECRETARY', 'ADMIN', 'SUPERADMIN'].includes(roleCode)
  }, [user])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      calendarService.getOrdresDuJour().catch(() => []),
      presenceService.getPresences().catch(() => []),
      presenceService.getServants().catch(() => []),
    ]).then(([odj, pres, servs]) => {
      setOrdresDuJour(Array.isArray(odj) ? odj : odj.results ?? [])
      setPresences(Array.isArray(pres) ? pres : pres.results ?? [])
      setServants(Array.isArray(servs) ? servs : servs.results ?? [])
      setLoading(false)
    })
  }, [])

  // Map indexée O(1) pour l'accès immédiat aux présences (servantId_odjId)
  const presenceMap = useMemo(() => {
    const map = new Map()
    presences.forEach((item) => {
      const pOdjId = typeof item.ordre_du_jour === 'object' ? item.ordre_du_jour?.id : item.ordre_du_jour
      const pServantId = typeof item.servant === 'object' ? item.servant?.id : item.servant
      if (pServantId && pOdjId) {
        map.set(`${pServantId}_${pOdjId}`, item)
      }
    })
    return map
  }, [presences])

  // Helper O(1) pour obtenir le statut d'un membre à une réunion
  const getStatusFor = useCallback((servantId, odjId) => {
    const p = presenceMap.get(`${servantId}_${odjId}`)
    if (!p) return null
    if (p.statut && STATUTS[p.statut.toUpperCase()]) return STATUTS[p.statut.toUpperCase()]
    if (p.present === true) return STATUTS.PRESENT
    if (p.present === false) return STATUTS.ABSENT
    return null
  }, [presenceMap])

  // Map de calcul pré-agrégé des stats par membre
  const statsMap = useMemo(() => {
    const map = new Map()
    const total = ordresDuJour.length

    servants.forEach((s) => {
      let p = 0, r = 0, perm = 0, a = 0
      ordresDuJour.forEach((odj) => {
        const st = getStatusFor(s.id, odj.id)
        if (st?.id === 'PRESENT') p++
        else if (st?.id === 'RETARD') r++
        else if (st?.id === 'PERMISSION') perm++
        else if (st?.id === 'ABSENT') a++
      })
      const percent = total > 0 ? Math.round(((p + r) / total) * 100) : 0
      map.set(Number(s.id), { percent, p, r, perm, a, total })
    })

    return map
  }, [servants, ordresDuJour, getStatusFor])

  // Stats perso pour les cartes synthétiques
  const myStats = useMemo(() => {
    if (!user) return { percent: 0, total: 0, p: 0, r: 0, perm: 0, a: 0 }
    return statsMap.get(Number(user.id)) || { percent: 0, total: ordresDuJour.length, p: 0, r: 0, perm: 0, a: 0 }
  }, [user, statsMap, ordresDuJour.length])

  // Filtrage des membres selon le rôle (Bureau ou Membre unique)
  const displayedServants = useMemo(() => {
    if (isBureau) return servants
    return servants.filter((s) => Number(s.id) === Number(user?.id))
  }, [servants, isBureau, user])

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-10">
      <Header subtitle="Registre annuel" title="Présences aux réunions" showBack />

      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="font-extrabold text-lg">Registre des présences</h2>
        {!loading && (
          <BoutonPDF zone="presences" titre="Présences aux réunions" />
        )}
      </div>

      <div id="pdf-zone-presences" className="px-4 py-3 space-y-4 max-w-4xl mx-auto">
        {/* SYNTHÈSE PERSO / GLOBALE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-white border border-neutral-200">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Assiduité Globale</p>
            <p className="text-xl font-black text-emerald-600 mt-1">
              {myStats.p + myStats.r}/{myStats.total}
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Présences / Retards</p>
            <p className="text-xl font-black text-neutral-800 mt-1">
              {myStats.p} <span className="text-xs text-amber-500 font-bold">({myStats.r} ret.)</span>
            </p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Permissions</p>
            <p className="text-xl font-black text-blue-600 mt-1">{myStats.perm}</p>
          </Card>
          <Card className="p-3 bg-white border border-neutral-200">
            <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Absences</p>
            <p className="text-xl font-black text-rose-600 mt-1">{myStats.a}</p>
          </Card>
        </div>

        {/* REGISTRE - TABLEAU MATRICIEL */}
        <Card className="p-0 overflow-hidden border border-neutral-200 shadow-sm bg-white">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-neutral-800">
              Matrice du registre ({ordresDuJour.length} réunions)
            </h3>
            {isBureau && (
              <span className="text-xs font-bold text-info bg-info/10 px-2.5 py-1 rounded-full">
                Mode Gestionnaire
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-neutral-400 text-xs animate-pulse">
              Chargement du registre en cours...
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-extrabold text-neutral-500 uppercase">
                      <th className="sticky left-0 bg-neutral-100 p-3 z-20 min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Membres
                      </th>

                      {ordresDuJour.map((odj) => (
                        <th key={odj.id} className="p-3 text-center min-w-[80px] whitespace-nowrap">
                          <span className="block text-neutral-800">{formatDateShort(odj.date)}</span>
                          <span className="block text-[9px] font-normal text-neutral-400 truncate max-w-[70px]" title={odj.titre}>
                            {odj.titre}
                          </span>
                        </th>
                      ))}

                      <th className="p-3 text-center min-w-[70px] bg-neutral-100 text-neutral-700">
                        Taux
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {displayedServants.map((s) => {
                      const stats = statsMap.get(Number(s.id)) || { percent: 0, p: 0, r: 0, total: ordresDuJour.length }
                      return (
                        <tr key={s.id} className="hover:bg-neutral-50/80 transition">
                          <td className="sticky left-0 bg-white p-3 font-bold text-neutral-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap">
                            {s.nom_complet || s.username}
                          </td>

                          {ordresDuJour.map((odj) => {
                            const st = getStatusFor(s.id, odj.id)
                            return (
                              <td key={odj.id} className="p-2 text-center">
                                {st ? (
                                  <span
                                    className={`inline-block px-2 py-0.5 text-[10px] font-black rounded ${st.badge}`}
                                    title={`${st.full} - ${odj.titre}`}
                                  >
                                    {st.label}
                                  </span>
                                ) : (
                                  <span className="text-neutral-300 font-bold text-[10px]">-</span>
                                )}
                              </td>
                            )
                          })}

                          <td className="p-2 text-center font-black bg-neutral-50/50">
                            <span className={stats.percent >= 75 ? 'text-emerald-600' : stats.percent >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                              {stats.p + stats.r}/{stats.total}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* LÉGENDE */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">P</span> Présent
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[9px]">R</span> Retard
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[9px]">PERM</span> Permission
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[9px]">A</span> Absent
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}