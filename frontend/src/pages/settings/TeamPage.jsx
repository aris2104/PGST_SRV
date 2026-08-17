import Header from '../../components/layout/Header'
import { EQUIPE, CATEGORIES } from '../../data/teamData'

function InitialesAvatar({ nom }) {
  const initiales = nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join('')

  return (
    <div className="w-20 h-20 rounded-full bg-navy text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0">
      {initiales || '?'}
    </div>
  )
}

function MembreCard({ membre }) {
  return (
    <div className="bg-card rounded-card shadow-card p-4 flex flex-col items-center text-center">
      {membre.photo ? (
        <img
          src={membre.photo}
          alt={membre.nom}
          className="w-20 h-20 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <InitialesAvatar nom={membre.nom} />
      )}
      <p className="font-extrabold text-sm mt-3">{membre.nom}</p>
      <p className="text-xs font-semibold text-maroon mt-0.5">{membre.role}</p>
      {membre.bio && (
        <p className="text-xs text-neutral-500 mt-2 leading-snug">{membre.bio}</p>
      )}
    </div>
  )
}

export default function TeamPage() {
  const categories = Object.values(CATEGORIES).filter((cat) =>
    EQUIPE.some((m) => m.categorie === cat)
  )

  return (
    <div>
      <Header title="L'équipe" showBack />

      <div className="px-5 py-5">
        <p className="text-sm text-neutral-500 mb-6">
          Les personnes qui ont fait vivre ce projet.
        </p>

        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="font-extrabold text-base mb-3">{cat}</h2>
            <div className="grid grid-cols-2 gap-3">
              {EQUIPE.filter((m) => m.categorie === cat).map((membre) => (
                <MembreCard key={membre.id} membre={membre} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}