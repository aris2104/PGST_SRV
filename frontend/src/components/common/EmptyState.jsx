export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-neutral-500">
      {Icon && <Icon size={40} className="mb-3 text-neutral-300" />}
      <p className="font-semibold text-neutral-600">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  )
}
