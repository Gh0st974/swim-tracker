import { useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import DayContextMenu from './DayContextMenu'
import {
  JOURS_SEMAINE, MOIS_FR,
  getSeancesDuJour, getSeancesDeLaSemaine,
  calculerSummaryHebdo, memeJour,
  WORKOUT_COLORS
} from './calendarUtils'

const NOTE_COLORS = {
  yellow: { bg: '#FEF9C3', text: '#92400E' },
  blue:   { bg: '#DBEAFE', text: '#1E40AF' },
  green:  { bg: '#DCFCE7', text: '#166534' },
  pink:   { bg: '#FCE7F3', text: '#9D174D' },
  orange: { bg: '#FFEDD5', text: '#92400E' },
}

function WeeklySummary({ seances }) {
  const s = calculerSummaryHebdo(seances)
  if (!s) return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center text-sm text-gray-300">
      Aucune séance cette semaine
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Résumé de la semaine
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric label="Distance totale" value={`${(s.totalDistance / 1000).toFixed(1)} km`} color="#1d83ea" />
        <Metric label="Temps total"     value={s.totalTemps || '—'}                          color="#10B981" />
        <Metric label="Séances"         value={s.nbSeances}                                  color="#8B5CF6" />
        <Metric label="Moy. / séance"   value={`${s.moyenneDistance} m`}                     color="#F59E0B" />
      </div>
      {s.nageDominante && (
        <p className="text-xs text-gray-400 mt-3">
          🏊 Nage dominante : <strong className="text-gray-600">{s.nageDominante}</strong>
        </p>
      )}
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function SeanceCard({ seance, onClick }) {
  const couleur = WORKOUT_COLORS[seance.type] || WORKOUT_COLORS.practice
  return (
    <div
      onClick={() => onClick(seance)}
      className="rounded-lg px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity mb-1 overflow-hidden"
      style={{ backgroundColor: couleur.bg }}
    >
      <p className="text-white text-xs font-medium truncate">
        {seance.titre || couleur.label}
      </p>
      <p className="text-white/80 text-xs">{seance.totalDistance}m</p>
    </div>
  )
}

function NoteCard({ note, onClick }) {
  const c = NOTE_COLORS[note.couleur] || NOTE_COLORS.yellow
  return (
    <div
      onClick={() => onClick(note)}
      className="rounded-lg px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity mb-1 flex items-start gap-1 overflow-hidden"
      style={{ backgroundColor: c.bg }}
    >
      <StickyNote size={10} className="flex-shrink-0 mt-0.5" style={{ color: c.text }} />
      <p className="text-xs truncate" style={{ color: c.text }}>{note.texte}</p>
    </div>
  )
}

export default function CalendarWeekView({
  jours,
  historique,
  notes = [],        // ← nouveau
  onJourClick,
  onSeanceClick,
  onNoteClick,       // ← nouveau
}) {
  const aujourd_hui    = new Date()
  const seancesSemaine = getSeancesDeLaSemaine(historique, jours)
  const [contextMenu, setContextMenu] = useState(null)

  function handleCellClick(e, jour) {
    const x = Math.min(e.clientX, window.innerWidth  - 220)
    const y = Math.min(e.clientY, window.innerHeight - 160)
    setContextMenu({ position: { x, y }, date: jour })
  }

  function handleChoix(type) {
    if (!contextMenu) return
    onJourClick(type, contextMenu.date)
    setContextMenu(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <WeeklySummary seances={seancesSemaine} />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {jours.map((jour, i) => {
            const estAujourdhui = memeJour(jour, aujourd_hui)
            return (
              <div key={i} className="text-center py-3 border-r last:border-r-0 border-gray-100">
                <p className="text-xs text-gray-400 font-medium">{JOURS_SEMAINE[i]}</p>
                <div
                  className={`mx-auto mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${
                    estAujourdhui ? 'text-white' : 'text-gray-700'
                  }`}
                  style={estAujourdhui ? { backgroundColor: '#1d83ea' } : {}}
                >
                  {jour.getDate()}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {MOIS_FR[jour.getMonth()].slice(0, 3)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Cellules */}
        <div className="grid grid-cols-7">
          {jours.map((jour, i) => {
            const seancesJour = getSeancesDuJour(historique, jour)
            const notesJour   = getSeancesDuJour(notes, jour)
            const estAujourdhui = memeJour(jour, aujourd_hui)
            const total = seancesJour.length + notesJour.length

            return (
              <div
                key={i}
                className="border-r last:border-r-0 border-gray-100 p-2 cursor-pointer hover:bg-blue-50/30 transition-colors group overflow-hidden"
                style={{
                  minHeight: '160px',
                  backgroundColor: estAujourdhui ? '#EFF6FF' : 'white'
                }}
                onClick={e => handleCellClick(e, jour)}
              >
                {seancesJour.map(s => (
                  <SeanceCard
                    key={s.id}
                    seance={s}
                    onClick={e => { onSeanceClick(s, jour) }}
                  />
                ))}

                {notesJour.map(n => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    onClick={onNoteClick}
                  />
                ))}

                {total === 0 && (
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} className="text-gray-300" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <DayContextMenu
        position={contextMenu?.position}
        date={contextMenu?.date}
        onChoix={handleChoix}
        onFermer={() => setContextMenu(null)}
      />
    </div>
  )
}
