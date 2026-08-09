/**
 * Export PDF via CSS print — zero dépendance, fonctionne sur tous les
 * navigateurs/appareils. Le navigateur génère un PDF propre et paginé
 * exactement comme la zone ciblée, avec en-tête PGST automatique.
 *
 * Usage :
 *   exportPDF('cotisation', { titre: 'Cotisations — Août 2026', soustitre: 'Aristide Kpess' })
 *   exportPDF('sanctions')
 *
 * Technique : on utilise `visibility` (pas `display`) pour masquer tout sauf
 * la zone ciblée. Contrairement à `display:none`, `visibility:hidden` laisse
 * les enfants pouvoir redevenir visibles individuellement (`visibility:visible`),
 * donc ça marche même si la zone est enfouie profondément dans l'arbre React.
 * L'en-tête PGST est inséré comme premier enfant DE LA ZONE elle-même, pour
 * suivre le même flux normal, sans jonglage de positionnement absolu.
 *
 * Style volontairement sobre : pas de couleurs, pas de zébrures, des filets
 * fins — un document imprimé classique, pas un export "dashboard coloré".
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

  const zoneEl = document.querySelector(selector)
  if (!zoneEl) return

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
      body * { visibility: hidden; }
      ${selector}, ${selector} * { visibility: visible; }

      ${selector} {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        font-family: Georgia, 'Times New Roman', serif;
        color: #1a1a1a;
      }

      #pgst-print-header {
        padding: 0 0 10px;
        margin-bottom: 22px;
        border-bottom: 1px solid #1a1a1a;
      }
      #pgst-print-header h1 {
        font-size: 15pt;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
        letter-spacing: 0.2px;
      }
      #pgst-print-header p {
        font-size: 10pt;
        color: #555;
        margin: 3px 0 0;
      }

      h2 { color: #1a1a1a !important; border-bottom-color: #1a1a1a !important; font-size: 12.5pt !important; }

      table { width: 100%; border-collapse: collapse; font-size: 11pt; }
      th {
        background: none !important;
        color: #1a1a1a !important;
        font-weight: 700;
        text-align: left;
        padding: 7px 10px;
        border-bottom: 1.5px solid #1a1a1a;
      }
      td { padding: 7px 10px; border-bottom: 0.5px solid #ccc; }
      tr:nth-child(even) td { background: none !important; }

      @page { margin: 20mm; }
    }
  `

  let header = document.getElementById('pgst-print-header')
  if (header) header.remove()
  header = document.createElement('div')
  header.id = 'pgst-print-header'
  header.innerHTML = `
    <h1>PGST — ${titre}</h1>
    <p>${soustitre ? soustitre + ' · ' : ''}Exporté le ${dateStr}</p>
  `
  zoneEl.insertBefore(header, zoneEl.firstChild)

  window.print()

  setTimeout(() => {
    style.textContent = ''
    header.remove()
  }, 1000)
}