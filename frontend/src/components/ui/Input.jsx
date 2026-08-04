export default function Input({ label, className = '', ...props }) {
  return (
    <label className="block mb-4">
      {label && (
        <span className="block mb-1.5 font-semibold text-white text-sm">{label}</span>
      )}
      <input
        className={`w-full px-4 py-3 rounded-md bg-white text-neutral-800 placeholder:text-neutral-400
          border border-transparent focus:outline-none focus:ring-2 focus:ring-olive
          ${className}`}
        {...props}
      />
    </label>
  )
}
