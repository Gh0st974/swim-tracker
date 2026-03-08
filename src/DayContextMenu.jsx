import { Dumbbell, StickyNote, X } from 'lucide-react'

export default function DayContextMenu({ position, date, onChoix, onFermer }) {
  if (!position) return null

  return (
    <>
      {/* Overlay invisible pour fermer au clic extérieur */}
      <div className="fixed inset-0 z-40" onClick={onFermer} />

      {/* Menu */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden w-52"
        style={{ top: position.y, left: position.x }}
      >
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-400">
            {date?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <button
          onClick={() => onChoix('seance')}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700
                     hover:bg-blue-50 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: '#DBEAFE' }}>
            <Dumbbell size={14} style={{ color: '#1d83ea' }} />
          </div>
          <span className="font-medium">Nouvel entraînement</span>
        </button>

        <button
          onClick={() => onChoix('note')}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700
                     hover:bg-yellow-50 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: '#FEF9C3' }}>
            <StickyNote size={14} style={{ color: '#CA8A04' }} />
          </div>
          <span className="font-medium">Nouvelle note</span>
        </button>
      </div>
    </>
  )
}
