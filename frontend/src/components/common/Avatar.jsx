export default function Avatar({ initials, size = 56 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-neutral-300 text-neutral-700 font-bold flex items-center justify-center flex-shrink-0"
    >
      {initials}
    </div>
  )
}
