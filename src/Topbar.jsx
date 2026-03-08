import { Menu, Settings, Waves } from 'lucide-react'

export default function Topbar({ onToggleSidebar, onOpenSettings }) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Capitalise le premier caractère
  const dateStr = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header
      style={{ backgroundColor: '#258a7cff' }}
      className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 shadow-lg"
    >
      {/* Gauche : hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-white hover:text-[#1d83ea] transition-colors p-1 rounded"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Waves size={22} color="#ffffff" />
          <span className="text-white font-bold text-lg tracking-wide">
            Swim<span style={{ color: '#fafafa' }}>Tracker</span>
          </span>
        </div>
      </div>

      {/* Centre : date */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="text-white/70 text-sm font-medium">{dateStr}</span>
      </div>

      {/* Droite : settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="text-white hover:text-[#1d83ea] transition-colors p-2 rounded-lg hover:bg-white/10"
          title="Paramètres"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}
