import { Download } from 'lucide-react'
import { exportPDF } from '../../utils/exportPDF'

export default function BoutonPDF({ zone, titre, soustitre }) {
  return (
    <button
      onClick={() => exportPDF(zone, { titre, soustitre })}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
    >
      <Download size={14} />
      PDF
    </button>
  )
}