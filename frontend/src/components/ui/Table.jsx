/**
 * Tableau générique réutilisable pour toute liste multi-lignes
 * (impayés, sanctions, présences...). Une seule colonne peut être
 * épinglée à gauche (sticky) pour rester lisible en scroll horizontal
 * sur petit écran — voir `stickyFirstColumn`.
 *
 * columns: [{ key, label, render?: (row) => ReactNode }]
 * rows: tableau d'objets (chaque objet doit avoir un `id`)
 */
export default function Table({ columns, rows, stickyFirstColumn = false }) {
  return (
    <div className="rounded-card shadow-card overflow-hidden border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-extrabold text-neutral-500 uppercase">
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`p-3 whitespace-nowrap ${
                    stickyFirstColumn && i === 0
                      ? 'sticky left-0 bg-neutral-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                      : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex} className="border-b border-neutral-100 last:border-0">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={`p-3 text-sm ${
                      stickyFirstColumn && i === 0
                        ? 'sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                        : ''
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}