import { useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import DayContextMenu from './DayContextMenu'
import {
  getSemainesDuMois,
  getSeancesDuJour,
  getSeancesDeLaSemaine,
  calculerSummaryHebdo,
  memeJour,
  WORKOUT_COLORS
} from './calendarUtils'

// ── Couleurs notes ────────────────────────────────────────────────
const NOTE_COLORS = {
  yellow: { bg: '#FEF9C3', text: '#92400E' },
  blue:   { bg: '#DBEAFE', text: '#1E40AF' },
  green:  { bg: '#DCFCE7', text: '#166534' },
  pink:   { bg: '#FCE7F3', text: '#9D174D' },
  orange: { bg: '#FFEDD5', text: '#92400E' },
}

// ── Chip séance ───────────────────────────────────────────────────
function SeancePoint({ seance, onClick }) {
  const couleur = WORKOUT_COLORS[seance.type] || WORKOUT_COLORS.practice
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(seance) }}
      title={`${seance.titre || couleur.label} — ${seance.totalDistance}m`}
      className="rounded px-1.5 py-0.5 text-white text-xs truncate cursor-pointer hover:opacity-80 mb-0.5"
      style={{ backgroundColor: couleur.bg }}
    >
      {seance.titre || `${seance.totalDistance}m`}
    </div>
  )
}

// ── Chip note ─────────────────────────────────────────────────────
function NotePoint({ note, onClick }) {
  const c = NOTE_COLORS[note.couleur] || NOTE_COLORS.yellow
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(note) }}
      title={note.texte}
      className="rounded px-1.5 py-0.5 text-xs cursor-pointer hover:opacity-80 mb-0.5 flex items-center gap-1 overflow-hidden"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <StickyNote size={10} className="flex-shrink-0" />
      <span className="truncate">{note.texte}</span>
    </div>
  )
}

// ── Colonne résumé semaine ────────────────────────────────────────
function SummaryCell({ seances }) {
  const s = calculerSummaryHebdo(seances)
  return (
    <div
      className="p-2 flex flex-col justify-center gap-1.5 border-l border-gray-200 flex-shrink-0"
      style={{ backgroundColor: '#F8FAFC', width: '110px' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#1d83ea' }}>
        Totaux
      </p>
      {!s ? (
        <p className="text-xs text-gray-300 italic">—</p>
      ) : (
        <>
          <div>
            <p className="text-xs text-gray-400">Distance</p>
            <p className="text-sm font-bold text-gray-700">
              {s.totalDistance >= 1000
                ? `${(s.totalDistance / 1000).toFixed(1)} km`
                : `${s.totalDistance} m`}
            </p>
          </div>
          {s.totalTemps && (
            <div>
              <p className="text-xs text-gray-400">Durée</p>
              <p className="text-sm font-bold text-gray-700">{s.totalTemps}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Séances</p>
            <p className="text-sm font-bold text-gray-700">{s.nbSeances}</p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function CalendarMonthView({
  annee,
  mois,
  historique,
  notes = [],
  onJourClick,
  onSeanceClick,
  onNoteClick,
}) {
  const semaines    = getSemainesDuMois(annee, mois)
  const aujourd_hui = new Date()
  const [contextMenu, setContextMenu] = useState(null)

  function handleJourClick(e, jour) {
    if (jour.getMonth() !== mois) return
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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden w-full">

      {/* ── Headers ── */}
      <div className="flex border-b border-gray-100">
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j => (
          <div
            key={j}
            className="flex-1 text-center py-3 text-xs font-medium text-gray-400 border-r border-gray-100"
          >
            {j}
          </div>
        ))}
        <div
          className="text-center py-3 text-xs font-semibold border-l border-gray-200 flex-shrink-0"
          style={{ width: '110px', color: '#1d83ea', backgroundColor: '#F8FAFC' }}
        >
          Résumé semaine
        </div>
      </div>

      {/* ── Semaines ── */}
      {semaines.map((semaine, si) => {
        const seancesSemaine = getSeancesDeLaSemaine(historique, semaine)
        return (
          <div key={si} className="flex border-b last:border-b-0 border-gray-100">

            {semaine.map((jour, ji) => {
              const estMoisCourant = jour.getMonth() === mois
              const estAujourdhui  = memeJour(jour, aujourd_hui)
              const seancesJour    = getSeancesDuJour(historique, jour)
              const notesJour      = getSeancesDuJour(notes, jour)
              const total          = seancesJour.length + notesJour.length

              // ← PLUS QU'UN SEUL style ici
              const bgColor = estAujourdhui
                ? '#EFF6FF'
                : !estMoisCourant ? '#FAFAFA' : 'white'

              return (
                <div
                  key={ji}
                  onClick={e => handleJourClick(e, jour)}
                  className={`
                    flex-1 p-1.5 border-r last:border-r-0 border-gray-100
                    overflow-hidden transition-colors group
                    ${estMoisCourant ? 'cursor-pointer hover:bg-blue-50/30' : 'cursor-default'}
                  `}
                  style={{
                    height: '100px',
                    minWidth: 0,
                    backgroundColor: bgColor,
                  }}
                >
                  {/* Numéro du jour */}
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: estAujourdhui ? '#1d83ea' : 'transparent',
                        color: estAujourdhui ? 'white' : estMoisCourant ? '#374151' : '#D1D5DB',
                      }}
                    >
                      {jour.getDate()}
                    </span>
                    {estMoisCourant && (
                      <Plus
                        size={12}
                        className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      />
                    )}
                  </div>

                  {/* Séances (max 2) */}
                  {seancesJour.slice(0, 2).map(s => (
                    <SeancePoint key={s.id} seance={s} onClick={onSeanceClick} />
                  ))}

                  {/* Notes (max 2, dans la limite des 4 au total) */}
                  {notesJour.slice(0, Math.max(0, 4 - seancesJour.length)).map(n => (
                    <NotePoint key={n.id} note={n} onClick={onNoteClick} />
                  ))}

                  {/* Overflow */}
                  {total > 4 && (
                    <p className="text-xs text-gray-400 pl-1">+{total - 4} autres</p>
                  )}
                </div>
              )
            })}

            <SummaryCell seances={seancesSemaine} />
          </div>
        )
      })}

      {/* Menu contextuel */}
      <DayContextMenu
        position={contextMenu?.position}
        date={contextMenu?.date}
        onChoix={handleChoix}
        onFermer={() => setContextMenu(null)}
      />
    </div>
  )
}
