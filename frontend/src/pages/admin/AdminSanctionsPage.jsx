import Header from '../../components/layout/Header'
import SanctionsOverview from '../../components/features/SanctionsOverview'

export default function AdminSanctionsPage() {
  return (
    <div>
      <Header title="Sanctions" subtitle="Vue Admin" showBack />
      <div className="px-5 py-5">
        <SanctionsOverview />
      </div>
    </div>
  )
}