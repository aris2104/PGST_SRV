export default function Card({ children, className = '', onClick }) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={`w-full text-left bg-card rounded-card shadow-card p-4 ${className}`}
    >
      {children}
    </Component>
  )
}
