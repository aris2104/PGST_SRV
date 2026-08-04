const VARIANTS = {
  primary: 'bg-maroon text-white hover:bg-maroon-dark active:scale-[0.99]',
  secondary: 'bg-white text-navy border border-neutral-300 hover:bg-neutral-50',
  ghost: 'bg-transparent text-navy hover:bg-black/5',
  danger: 'bg-maroon text-white hover:bg-maroon-dark',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full py-3 rounded-md font-semibold tracking-wide uppercase text-sm
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
