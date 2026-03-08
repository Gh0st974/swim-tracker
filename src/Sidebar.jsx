import { Waves, PenSquare, History, BarChart2, Settings, Star, Folder } from 'lucide-react'
import { CalendarDays } from 'lucide-react'

const navItems = [
  { id: 'saisie',     label: 'Create',       icon: PenSquare },
  { id: 'historique', label: 'My Workouts',   icon: Folder },
  { id: 'calendrier', label: 'Calendrier', icon: CalendarDays },
  { id: 'stats',      label: 'Training', icon: BarChart2 },
  { id: 'favoris',    label: 'Favoris',      icon: Star },
  { id: 'parametres', label: 'Paramètres',   icon: Settings },
]

export default function Sidebar({ isOpen, activePage, onNavigate }) {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => onNavigate(activePage)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#2e3e50ff' }}
        className={`
          fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-40
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-60' : 'w-0 md:w-16'}
          overflow-hidden
          shadow-xl
        `}
      >
        {/* Nav items */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                style={isActive ? { backgroundColor: '#86dfd3' } : {}}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 cursor-pointer w-full text-left
                  ${isActive
                    ? 'text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-[#313131]'
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap
                    transition-opacity duration-200
                    ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'}
                  `}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className={`flex items-center gap-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <Waves size={16} color="#1d83ea" />
            <span className="text-white/30 text-xs">SwimTracker v1.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}
