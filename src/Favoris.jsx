import { useState } from 'react'
import FavoriForm from './FavoriForm'

export default function Favoris({ favoris, nages, materiel, intensite, onSupprimer, onCharger, onSauvegarder }) {
  const [ongletFav, setOngletFav] = useState('seances')
  const [formOuvert, setFormOuvert]   = useState(false)   // true = nouveau
  const [enEdition, setEnEdition]     = useState(null)     // objet favori à modifier

  const seances = favoris.filter(f => f.type === 'seance')
  const series  = favoris.filter(f => f.type === 'serie')

  const handleSave = (favori) => {
    onSauvegarder(favori)
    setFormOuvert(false)
    setEnEdition(null)
  }

  const handleCancel = () => {
    setFormOuvert(false)
    setEnEdition(null)
  }

  const handleModifier = (fav) => {
    setEnEdition(fav)
    setFormOuvert(false)
    // scroll haut
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">⭐ Favoris</h2>
        {!formOuvert && !enEdition && (
          <button
            onClick={() => setFormOuvert(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          >
            + Nouveau favori
          </button>
        )}
      </div>

      {/* Formulaire ajout */}
      {formOuvert && (
        <FavoriForm
          nages={nages}
          materiel={materiel}
          intensite={intensite}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Formulaire modification */}
      {enEdition && (
        <FavoriForm
          initial={enEdition}
          nages={nages}
          materiel={materiel}
          intensite={intensite}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Onglets */}
      <div className="flex gap-4 mb-5 border-b border-gray-200">
        {[['seances','🏊 Séances'], ['series','📋 Séries']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setOngletFav(key)}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              ongletFav === key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Liste séances */}
      {ongletFav === 'seances' && (
        seances.length === 0
          ? <p className="text-gray-400">Aucune séance en favori.</p>
          : <div className="flex flex-col gap-3">
              {seances.map(f => (
                <div key={f.id} className={`bg-white border rounded-xl shadow-sm p-4 transition ${
                  enEdition?.id === f.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-yellow-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800">{f.titre || 'Séance sans titre'}</div>
                      <div className="text-sm text-blue-600 font-bold mt-0.5">{f.totalDistance}m</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Sauvegardé le {new Date(f.dateSauvegarde).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => onCharger(f)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm px-3 py-1.5 rounded-lg font-medium"
                      >Charger</button>
                      <button
                        onClick={() => handleModifier(f)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm px-3 py-1.5 rounded-lg"
                        title="Modifier"
                      >✏️</button>
                      <button
                        onClick={() => onSupprimer(f.id)}
                        className="text-red-300 hover:text-red-500 font-bold text-lg px-1"
                      >✕</button>
                    </div>
                  </div>
                  <pre className="text-xs font-mono text-gray-500 mt-3 whitespace-pre-wrap bg-gray-50 rounded p-2">
                    {f.texte}
                  </pre>
                </div>
              ))}
            </div>
      )}

      {/* Liste séries */}
      {ongletFav === 'series' && (
        series.length === 0
          ? <p className="text-gray-400">Aucune série en favori.</p>
          : <div className="flex flex-col gap-3">
              {series.map(f => (
                <div key={f.id} className={`bg-white border rounded-xl shadow-sm p-4 transition ${
                  enEdition?.id === f.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-yellow-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm text-gray-800 font-medium">{f.texte}</div>
                      <div className="text-xs text-blue-600 mt-1">{f.totalDistance}m</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => navigator.clipboard.writeText(f.texte)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm px-3 py-1.5 rounded-lg"
                      >📋 Copier</button>
                      <button
                        onClick={() => handleModifier(f)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm px-3 py-1.5 rounded-lg"
                        title="Modifier"
                      >✏️</button>
                      <button
                        onClick={() => onSupprimer(f.id)}
                        className="text-red-300 hover:text-red-500 font-bold text-lg px-1"
                      >✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  )
}
