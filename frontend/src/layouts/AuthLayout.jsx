import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    // 1. Bloque le fond sur 100% de la hauteur visible sans aucun scroll
    <div className="fixed inset-0 bg-navy flex justify-center items-center overflow-hidden">
      <div
        className="w-full max-w-md h-[100dvh] relative flex flex-col justify-between py-8 px-8 overflow-hidden"
        style={{
          paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(2rem, env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Cercles décoratifs d'arrière-plan */}
        <div className="absolute -top-10 -right-16 w-56 h-56 rounded-full bg-olive/90 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-olive/90 pointer-events-none" />

        {/* Marge supérieure invisible pour équilibrer le centrage */}
        <div className="h-4 pointer-events-none" />

        {/* Contenu central dynamique (WelcomePage ou LoginPage) */}
        <div className="relative z-10 my-auto w-full">
          <Outlet />
        </div>

        {/* Devise ancrée proprement en bas */}
        <p className="relative z-10 text-center text-white/90 text-xs font-semibold tracking-wide flex-shrink-0 pt-4">
          NOTRE SECOURS EST<br />DANS LE NOM DU SEIGNEUR
        </p>
      </div>
    </div>
  )
}