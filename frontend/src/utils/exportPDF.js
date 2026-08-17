/**
 * PGST — Export PDF professionnel
 * ------------------------------------------------------------
 * Technique :
 *   - Impression native du navigateur
 *   - Aucun package externe
 *   - Compatible Chrome / Edge / Firefox / Safari / Mobile
 *   - Conservation de l'interface originale après impression
 *   - Header PGST généré dynamiquement
 *   - Nettoyage automatique après window.print()
 *
 * DÉCISION PRODUIT (à respecter partout, ne pas réintroduire de toggle) :
 *   - Toujours PORTRAIT. L'option `orientation` passée par un appelant est
 *     ignorée volontairement (voir normalizeOptions) — un seul format pour
 *     tous les documents PGST, cohérent d'une page à l'autre.
 *   - Grille complète façon Excel/formulaire papier : bordure NOIRE sur
 *     CHAQUE cellule (voir PGST.colors.border).
 */

export const ZONES_PDF = {
    cotisation: '#pdf-zone-cotisation',
    sanctions: '#pdf-zone-sanctions',
    presences: '#pdf-zone-presences',
    mouvements: '#pdf-zone-mouvements',
    activite: '#pdf-zone-activite',
    rapport: '#pdf-zone-rapport',
}


// ============================================================
// CONFIGURATION PGST
// ============================================================

const PGST = {
    name: 'PGST',

    colors: {
        navy: '#24365A',
        text: '#1F2430',
        muted: '#6B7280',
        border: '#000000',           // grille complète, bordure noire
        headerBackground: '#E9E9E9', // en-tête de tableau, gris clair
        white: '#FFFFFF',
    },

    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', " +
        "Roboto, Helvetica, Arial, sans-serif",
}


// ============================================================
// OUTILS INTERNES
// ============================================================

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}


function getDateFR() {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date())
}


function normalizeOptions(options = {}) {
    return {
        // Orientation volontairement figée : voir note en tête de fichier.
        // On accepte toujours 'options.orientation' en entrée sans erreur
        // (pour ne pas casser les appels existants) mais on l'ignore.
        orientation: 'portrait',

        format:
            options.format || 'A4',

        showHeader:
            options.showHeader !== false,

        showFooter:
            options.showFooter !== false,

        includeDate:
            options.includeDate !== false,

        preserveColors:
            options.preserveColors === true,

        openPrintDialog:
            options.openPrintDialog !== false,
    }
}


// ============================================================
// STYLE D'IMPRESSION
// ============================================================

function createPrintStyle({
    selector,
    orientation,
    format,
    showFooter,
    preserveColors,
}) {
    const {
        navy,
        text,
        muted,
        border,
        headerBackground,
        white,
    } = PGST.colors

    const colorsRule = preserveColors
        ? `
            ${selector} * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        `
        : `
            ${selector} * {
                color: ${text} !important;
                background: transparent !important;
                box-shadow: none !important;
            }

            ${selector} th {
                color: #000 !important;
                background: ${headerBackground} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            #pgst-print-header .pgst-logo {
                background: ${navy} !important;
                color: ${white} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        `

    const footerRule = showFooter
        ? `
            @page {
                @bottom-center {
                    content:
                        "Document généré par PGST — Page "
                        counter(page)
                        " / "
                        counter(pages);

                    font-size: 8pt;
                    color: ${muted};
                }
            }
        `
        : ''

    return `
        @media print {

            /* ==================================================
               RESET GLOBAL & FORCE PRINT COLOR
               ================================================== */

            html,
            body {
                margin: 0 !important;
                padding: 0 !important;
                background: ${white} !important;
            }

            /* Le conteneur racine de l'appli (cadre "téléphone", w-full
               max-w-md + position:relative dans AppLayout.jsx) limitait la
               zone imprimée à ~448px et servait de repère de positionnement
               à ${selector} (position:absolute) au lieu de toute la page.
               On le neutralise entièrement pendant l'impression. */
            #pgst-app-shell {
                max-width: none !important;
                width: 100% !important;
                min-height: 0 !important;
                padding-bottom: 0 !important;
                position: static !important;
            }

            body * {
                visibility: hidden !important;
            }

            ${selector},
            ${selector} * {
                visibility: visible !important;
            }


            /* ==================================================
               ZONE À IMPRIMER
               ================================================== */

            ${selector} {
                position: absolute !important;

                top: 0 !important;
                left: 0 !important;

                width: 100% !important;
                max-width: none !important;

                margin: 0 !important;
                padding: 0 !important;

                font-family: ${PGST.fontFamily} !important;
                font-size: 10pt !important;

                color: ${text} !important;

                background: ${white} !important;

                overflow: visible !important;
            }


            /* ==================================================
               ÉLÉMENTS NON IMPRIMABLES
               ================================================== */

            ${selector} button,
            ${selector} input,
            ${selector} select,
            ${selector} textarea,
            ${selector} [role="button"],
            ${selector} .no-print,
            ${selector} [data-no-print="true"] {
                display: none !important;
            }


            /* ==================================================
               HEADER PGST
               ================================================== */

            #pgst-print-header {
                display: flex !important;

                align-items: flex-start;
                justify-content: space-between;

                width: 100%;

                box-sizing: border-box;

                padding: 0 0 12px;
                margin: 0 0 20px;

                border-bottom: 2px solid ${navy};

                color: ${text} !important;

                page-break-after: avoid;
                break-after: avoid;
            }

            #pgst-print-header .pgst-brand {
                display: flex !important;

                align-items: center;

                gap: 10px;
            }

            #pgst-print-header .pgst-logo {
                display: flex !important;

                align-items: center;
                justify-content: center;

                width: 34px;
                height: 34px;

                flex: 0 0 34px;

                border-radius: 8px;

                background: ${navy} !important;
                color: ${white} !important;

                font-size: 14pt;
                font-weight: 800;

                line-height: 1;

                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            #pgst-print-header .pgst-brand-name {
                margin: 0;

                color: ${muted} !important;

                font-size: 8pt;
                font-weight: 700;

                letter-spacing: 1.5px;
                text-transform: uppercase;
            }

            #pgst-print-header h1 {
                margin: 2px 0 0;

                color: ${text} !important;

                font-size: 17pt;
                font-weight: 800;

                line-height: 1.2;

                letter-spacing: -0.2px;
            }

            #pgst-print-header .pgst-meta {
                text-align: right;

                margin-left: 20px;
            }

            #pgst-print-header .pgst-meta p {
                margin: 0;

                color: ${muted} !important;

                font-size: 8.5pt;
                line-height: 1.45;
            }

            #pgst-print-header .pgst-meta .pgst-subtitle {
                margin-bottom: 2px;

                color: ${text} !important;

                font-size: 9.5pt;
                font-weight: 700;
            }


            /* ==================================================
               TITRES
               ================================================== */

            ${selector} h1,
            ${selector} h2,
            ${selector} h3 {
                color: ${text} !important;

                page-break-after: avoid;
                break-after: avoid;
            }

            ${selector} h2 {
                margin: 18px 0 10px !important;

                font-size: 12pt !important;
                font-weight: 700 !important;
            }


            /* ==================================================
               TABLEAUX — grille complète, bordure noire sur
               chaque cellule (façon Excel / formulaire papier)
               ================================================== */

            ${selector} table {
                width: 100% !important;

                max-width: 100% !important;

                margin: 0 0 12px !important;

                border-collapse: collapse !important;
                border: 1.5px solid ${border} !important;

                table-layout: auto !important;

                font-size: 9pt !important;

                color: ${text} !important;

                page-break-inside: auto;
                break-inside: auto;
            }

            ${selector} thead {
                display: table-header-group !important;
            }

            ${selector} tfoot {
                display: table-footer-group !important;
            }

            ${selector} tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }

            ${selector} th {
                padding: 7px 8px !important;

                border: 1px solid ${border} !important;

                background: ${headerBackground} !important;

                color: #000 !important;

                font-size: 8.5pt !important;
                font-weight: 700 !important;

                text-align: center;

                vertical-align: middle;

                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            ${selector} td {
                padding: 6px 8px !important;

                border: 1px solid ${border} !important;

                color: ${text} !important;

                font-size: 9pt !important;

                text-align: center;

                vertical-align: middle;

                overflow-wrap: anywhere;
                word-break: normal;
            }

            ${selector} td:first-child {
                text-align: left;

                font-weight: 600;
            }


            /* ==================================================
               ÉVITER LES PROBLÈMES DE SCROLL
               ================================================== */

            ${selector},
            ${selector} * {
                overflow: visible !important;
            }

            ${selector} th,
            ${selector} td,
            ${selector} tr {
                position: static !important;

                top: auto !important;
                right: auto !important;
                bottom: auto !important;
                left: auto !important;

                float: none !important;
            }


            /* ==================================================
               BADGES (statuts Payé/Impayé, Présent/Absent, etc.)
               ================================================== */

            ${selector} .badge,
            ${selector} [class*="badge"],
            ${selector} [class*="chip"],
            ${selector} [role="status"] {
                display: inline-block !important;

                padding: 2px 6px !important;

                border: 1px solid ${border} !important;

                border-radius: 4px !important;

                background: #F3F4F6 !important;

                color: ${text} !important;

                font-size: 8pt !important;
                font-weight: 600 !important;
            }


            /* ==================================================
               LIENS
               ================================================== */

            ${selector} a {
                color: ${text} !important;

                text-decoration: none !important;
            }


            /* ==================================================
               IMAGES
               ================================================== */

            ${selector} img {
                max-width: 100% !important;

                height: auto !important;

                break-inside: avoid;
            }


            /* ==================================================
               BLOCS
               ================================================== */

            ${selector} .card,
            ${selector} .section,
            ${selector} [data-pdf-block] {
                break-inside: avoid;
                page-break-inside: avoid;
            }


            /* ==================================================
               IMPRESSION — toujours portrait (voir en-tête fichier).
               Marge gauche/droite quasi nulle (0,2cm), demandée
               explicitement pour que le contenu occupe toute la
               largeur de la page. Le haut/bas garde un peu de marge
               pour laisser respirer l'en-tête PGST et la pagination.
               ================================================== */

            @page {
                size: ${format} ${orientation};

                margin: 8mm 2mm;

                ${footerRule}
            }


            /* ==================================================
               COULEURS & UTILITAIRES
               ================================================== */

            ${colorsRule}

            .print-only {
                display: block !important;
            }

            .no-print {
                display: none !important;
            }
        }
    `
}


// ============================================================
// CRÉATION DU HEADER
// ============================================================

function createPrintHeader({
    titre,
    soustitre,
    includeDate,
}) {
    const header = document.createElement('div')

    header.id = 'pgst-print-header'

    const dateHTML = includeDate
        ? `
            <p>
                Exporté le ${escapeHTML(getDateFR())}
            </p>
        `
        : ''

    header.innerHTML = `
        <div class="pgst-brand">

            <div
                class="pgst-logo"
                aria-hidden="true"
            >
                P
            </div>

            <div>
                <p class="pgst-brand-name">
                    ${escapeHTML(PGST.name)}
                </p>

                <h1>
                    ${escapeHTML(titre || 'Rapport')}
                </h1>
            </div>

        </div>

        <div class="pgst-meta">

            ${
                soustitre
                    ? `
                        <p class="pgst-subtitle">
                            ${escapeHTML(soustitre)}
                        </p>
                    `
                    : ''
            }

            ${dateHTML}

        </div>
    `

    return header
}


// ============================================================
// EXPORT PRINCIPAL
// ============================================================

export function exportPDF(
    zone,
    meta = {},
    options = {},
) {
    const selector = ZONES_PDF[zone]

    if (!selector) {
        console.warn(
            `[PGST PDF] Zone inconnue : "${zone}".`,
        )

        return false
    }

    const zoneEl = document.querySelector(selector)

    if (!zoneEl) {
        console.warn(
            `[PGST PDF] Élément introuvable : ${selector}`,
        )

        return false
    }

    // ---------------------------------------------------------
    // Éviter deux exports simultanés
    // ---------------------------------------------------------

    if (document.body.dataset.pgstPrinting === 'true') {
        return false
    }

    document.body.dataset.pgstPrinting = 'true'

    const config = normalizeOptions(options)

    const {
        orientation,
        format,
        showHeader,
        showFooter,
        includeDate,
        preserveColors,
        openPrintDialog,
    } = config


    // ---------------------------------------------------------
    // Style d'impression
    // ---------------------------------------------------------

    const styleId = 'pgst-print-style'

    let style = document.getElementById(styleId)

    if (!style) {
        style = document.createElement('style')
        style.id = styleId

        document.head.appendChild(style)
    }

    style.textContent = createPrintStyle({
        selector,
        orientation,
        format,
        showFooter,
        preserveColors,
    })


    // ---------------------------------------------------------
    // Header
    // ---------------------------------------------------------

    let header = null

    if (showHeader) {
        header = createPrintHeader({
            titre: meta.titre,
            soustitre: meta.soustitre,
            includeDate,
        })

        zoneEl.insertBefore(
            header,
            zoneEl.firstChild,
        )
    }


    // ---------------------------------------------------------
    // Préparation
    // ---------------------------------------------------------

    const previousTitle = document.title

    if (meta.titre) {
        document.title = `PGST — ${meta.titre}`
    }


    // ---------------------------------------------------------
    // Nettoyage sécurisé
    // ---------------------------------------------------------

    let cleanedUp = false

    const cleanup = () => {
        if (cleanedUp) return
        cleanedUp = true

        if (header && header.parentNode) {
            header.remove()
        }

        if (style) {
            style.textContent = ''
        }

        document.title = previousTitle

        delete document.body.dataset.pgstPrinting

        window.removeEventListener(
            'afterprint',
            cleanup,
        )
    }


    // Si on ne demande pas l'ouverture de la boîte de dialogue,
    // on renvoie la fonction de nettoyage sans bloquer le script.
    if (!openPrintDialog) {
        return cleanup
    }


    window.addEventListener(
        'afterprint',
        cleanup,
        { once: true },
    )


    // ---------------------------------------------------------
    // Impression
    // ---------------------------------------------------------

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            try {
                window.print()
            } catch (err) {
                console.error(
                    '[PGST PDF] Erreur lors de window.print() :',
                    err,
                )
                cleanup()
            }
        })
    })

    return true
}