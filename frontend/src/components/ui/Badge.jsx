const TONES = {
  info: 'text-info',
  accent: 'text-accent',
  success: 'text-success',
  danger: 'text-danger',
  neutral: 'text-neutral-500',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`text-xs font-bold uppercase tracking-wide ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
