/**
 * Export PDF via CSS print — zero dépendance, fonctionne sur tous les
 * navigateurs/appareils. Le navigateur génère un PDF propre et paginé
 * exactement comme la zone ciblée, avec en-tête PGST automatique.
 *
 * Usage :
 *   exportPDF('cotisation', { titre: 'Cotisations — Août 2026', soustitre: 'Aristide Kpess' })
 *   exportPDF('sanctions')
 *
 * La fonction injecte temporairement une feuille de style dédiée print,
 * lance window.print(), puis nettoie immédiatement — la page ne change pas.
 */

export const ZONES_PDF = {
  cotisation: '#pdf-zone-cotisation',
  sanctions: '#pdf-zone-sanctions',
  presences: '#pdf-zone-presences',
  mouvements: '#pdf-zone-mouvements',
  activite: '#pdf-zone-activite',
  rapport: '#pdf-zone-rapport',
}

export function exportPDF(zone, meta = {}) {
  const selector = ZONES_PDF[zone]
  if (!selector) return

  const titre = meta.titre ?? 'PGST — Rapport'
  const soustitre = meta.soustitre ?? ''
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const styleId = 'pgst-print-style'
  let style = document.getElementById(styleId)
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }

  style.textContent = `
    @media print {
      /* Masque tout sauf la zone ciblée + les en-têtes pdf */
      body > * { display: none !important; }
      #pgst-print-header,
      ${selector} { display: block !important; }

      #pgst-print-header {
        padding: 12px 0 8px;
        border-bottom: 2px solid #3F4A77;
        margin-bottom: 16px;
      }
      #pgst-print-header h1 {
        font-size: 16pt;
        font-weight: 900;
        color: #3F4A77;
        margin: 0;
      }
      #pgst-print-header p {
        font-size: 9pt;
        color: #666;
        margin: 2px 0 0;
      }

      ${selector} { width: 100%; }
      table { width: 100%; border-collapse: collapse; font-size: 9pt; }
      th { background: #3F4A77 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 6px 8px; text-align: left; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) td { background: #f8f8f8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      @page { margin: 15mm; }
    }
  `

  // Injecte un en-tête temporaire dans le DOM (retiré après impression)
  let header = document.getElementById('pgst-print-header')
  if (!header) {
    header = document.createElement('div')
    header.id = 'pgst-print-header'
    header.style.display = 'none'
    document.body.appendChild(header)
  }
  header.innerHTML = `
    <h1>PGST — ${titre}</h1>
    <p>${soustitre ? soustitre + ' · ' : ''}Exporté le ${dateStr}</p>
  `

  window.print()

  // Nettoyage après fermeture de la boîte d'impression
  setTimeout(() => {
    style.textContent = ''
    header.remove()
  }, 1000)
}