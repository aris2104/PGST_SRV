import Header from '../../components/layout/Header'
import SanctionsOverview from '../../components/features/SanctionsOverview'

export default function DisciplinaireSanctionsPage() {
  return (
    <div>
      <Header title="Sanctions" subtitle="Vue Disciplinaire" showBack />
      <div className="px-5 py-5">
        <SanctionsOverview />
      </div>
    </div>
  )
}