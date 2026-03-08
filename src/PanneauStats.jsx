import { COULEURS_NAGES, COULEURS_MAT, COULEURS_INT, COULEURS_TYPE } from './constants'

function StatBlock({ label, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-[110px]">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      {children}
    </div>
  )
}

function ColLabel({ children }) {
  return (
    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
      {children}
    </div>
  )
}

export { StatBlock }

export default function PanneauStats({ data, statsNages, statsMateriel, statsIntensite, statsTypeExo }) {
  if (!data) return null

  const sections = [
    { label: 'Nages',     data: statsNages,     couleurs: COULEURS_NAGES },
    { label: 'Matériel',  data: statsMateriel,  couleurs: COULEURS_MAT   },
    { label: 'Intensité', data: statsIntensite, couleurs: COULEURS_INT   },
    { label: 'Type',      data: statsTypeExo,   couleurs: COULEURS_TYPE  },
  ]

  const visibles = sections.filter(s => Object.keys(s.data || {}).length > 0)

    return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

      {/* ── Titre + distance/temps ── */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">📊 Statistiques de la séance</span>
        <div className="flex items-center gap-3">
          {data.totalDistance > 0 && (
            <span className="text-sm font-bold text-[#1d83ea]">{data.totalDistance}m</span>
          )}
          {data.totalTemps && data.totalTemps !== '0:00' && (
            <span className="text-sm font-semibold text-green-600">{data.totalTemps}</span>
          )}
        </div>
      </div>

      {/* ── Sections ── */}
      {visibles.map(({ label, data: sData, couleurs }, idx) => {
        const entries = Object.entries(sData || {})
        const isLast  = idx === visibles.length - 1
        return (
          <div key={label} className={`px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
            <ColLabel>{label}</ColLabel>
            <div className="flex flex-col gap-1">
              {entries.map(([nom, dist], i) => (
                <div key={nom} className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${couleurs[i % couleurs.length]}`}>{nom}</span>
                  <span className="text-gray-500">{dist}m</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}