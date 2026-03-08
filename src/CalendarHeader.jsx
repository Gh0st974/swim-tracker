import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { MOIS_FR } from './calendarUtils'

export default function CalendarHeader({
  vue, setVue,
  annee, mois, lundiSemaine,
  onPrev, onNext, onAujourdhui,
  onNouvelleSeance,
}) {
  const titreVueMois  = `${MOIS_FR[mois]} ${annee}`

  const getLundiLabel = () => {
    const fin = new Date(lundiSemaine)
    fin.setDate(fin.getDate() + 6)
    const debutJour = lundiSemaine.getDate()
    const debutMois = MOIS_FR[lundiSemaine.getMonth()]
    const finJour   = fin.getDate()
    const finMois   = MOIS_FR[fin.getMonth()]
    const finAnnee  = fin.getFullYear()
    if (lundiSemaine.getMonth() === fin.getMonth()) {
      return `${debutJour} – ${finJour} ${finMois} ${finAnnee}`
    }
    return `${debutJour} ${debutMois} – ${finJour} ${finMois} ${finAnnee}`
  }

  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">

      {/* Titre + navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAujourdhui}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          Aujourd'hui
        </button>
        <button onClick={onPrev}  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft  size={18}/></button>
        <button onClick={onNext}  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronRight size={18}/></button>
        <h2 className="text-lg font-semibold text-gray-800 ml-1 capitalize">
          {vue === 'mois' ? titreVueMois : getLundiLabel()}
        </h2>
      </div>

      {/* Contrôles droite */}
      <div className="flex items-center gap-2">
        {/* Toggle vue */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          {['semaine','mois'].map(v => (
            <button
              key={v}
              onClick={() => setVue(v)}
              className="px-3 py-1.5 capitalize transition-colors"
              style={{
                backgroundColor: vue === v ? '#1d83ea' : 'white',
                color:           vue === v ? 'white'   : '#6B7280',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Nouvelle séance */}
        <button
          onClick={onNouvelleSeance}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: '#1d83ea' }}
        >
          <Plus size={14}/> Séance
        </button>
      </div>

    </div>
  )
}
