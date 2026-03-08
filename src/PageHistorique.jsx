import { useState } from 'react'
import CarteSeance from './CarteSeance'

export default function PageHistorique({ historique, modifierSeance, dupliquerSeance, supprimerSeance }) {
  const [seanceOuverte, setSeanceOuverte] = useState(null)
  const [ordre,         setOrdre]         = useState('desc')
  const [filtreDu,      setFiltreDu]      = useState('')
  const [filtreAu,      setFiltreAu]      = useState('')
  const [search,        setSearch]        = useState('')

  const liste = historique
    .filter(s => {
      if (filtreDu) { const d = new Date(filtreDu); d.setHours(0,0,0,0); if (new Date(s.date) < d) return false }
      if (filtreAu) { const d = new Date(filtreAu); d.setHours(23,59,59,999); if (new Date(s.date) > d) return false }
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!(s.texte||'').toLowerCase().includes(q) && !(s.titre||'').toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => ordre === 'desc'
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
    )

  const totalDist = liste.reduce((acc, s) => acc + (s.totalDistance || 0), 0)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1d83ea]"
        />
        <input
          type="date"
          value={filtreDu}
          onChange={e => setFiltreDu(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1d83ea]"
        />
        <span className="text-gray-400 text-sm">→</span>
        <input
          type="date"
          value={filtreAu}
          onChange={e => setFiltreAu(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1d83ea]"
        />
        <select
          value={ordre}
          onChange={e => setOrdre(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1d83ea]"
        >
          <option value="desc">Plus récent d'abord</option>
          <option value="asc">Plus ancien d'abord</option>
        </select>
        {(search || filtreDu || filtreAu) && (
          <button
            onClick={() => { setSearch(''); setFiltreDu(''); setFiltreAu('') }}
            className="text-xs text-gray-400 hover:text-red-400 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Résumé */}
      {liste.length > 0 && (
        <div className="text-sm text-gray-400 px-1">
          {liste.length} séance{liste.length > 1 ? 's' : ''} · {totalDist.toLocaleString('fr-FR')}m au total
        </div>
      )}

      {/* Liste */}
      {liste.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <div className="text-4xl mb-3">🏊</div>
          <div className="text-sm">Aucune séance trouvée</div>
        </div>
      ) : (
        liste.map(s => (
          <CarteSeance
            key={s.id}
            s={s}
            modifierSeance={modifierSeance}
            dupliquerSeance={dupliquerSeance}
            supprimerSeance={supprimerSeance}
            seanceOuverte={seanceOuverte}
            setSeanceOuverte={setSeanceOuverte}
          />
        ))
      )}
    </div>
  )
}
