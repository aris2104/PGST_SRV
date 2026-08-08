import { forwardRef } from 'react'

const Card = forwardRef(function Card({ children, className = '', onClick }, ref) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={`w-full text-left bg-card rounded-card shadow-card p-4 ${className}`}
    >
      {children}
    </Component>
  )
})

export default Card