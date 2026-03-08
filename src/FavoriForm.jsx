import { useRef, useEffect, useState } from 'react'
import FormatToolbar from './FormatToolbar'
import { parseSeance } from './parser'

export default function FavoriForm({ initial = null, nages, materiel, intensite, onSave, onCancel }) {
  const editorRef = useRef(null)
  const [nom, setNom]     = useState(initial?.titre || '')
  const [type, setType]   = useState(initial?.type  || 'seance')
  const [texte, setTexte] = useState(initial?.texte || '')

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initial?.html || (initial?.texte?.replace(/\n/g, '<br/>') ?? '')
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) setTexte(editorRef.current.innerText)
  }

  const resultat = texte.trim() ? parseSeance(texte, nages, materiel, intensite) : null

  const handleSave = () => {
    if (!texte.trim()) return
    onSave({
      id:             initial?.id || Date.now(),
      type,
      titre:          nom.trim() || 'Favori sans titre',
      texte,
      html:           editorRef.current?.innerHTML || '',
      totalDistance:  resultat?.totalDistance || 0,
      dateSauvegarde: initial?.dateSauvegarde || new Date().toISOString(),
    })
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden mb-4">

      {/* En-tête formulaire */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
        <span className="font-semibold text-blue-700 text-sm">
          {initial ? '✏️ Modifier le favori' : '➕ Nouveau favori'}
        </span>

        {/* Toggle type */}
        <div className="flex rounded-lg overflow-hidden border border-blue-200 ml-auto">
          {[['seance','🏊 Séance'], ['serie','📋 Série']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setType(val)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                type === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-blue-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nom */}
      <div className="px-4 pt-3">
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Nom du favori (ex: Pyramide endurance)"
          value={nom}
          onChange={e => setNom(e.target.value)}
        />
      </div>

      {/* Éditeur */}
      <div className="mx-4 mt-3 border border-gray-200 rounded-xl overflow-hidden">
        <FormatToolbar editorRef={editorRef} onChange={handleInput} />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={handleInput}
          data-placeholder="Saisir la séance ou série..."
          className="w-full p-4 font-mono text-sm outline-none leading-relaxed min-h-[140px]"
        />

        {/* Distance calculée */}
        {resultat && resultat.totalDistance > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-500">{resultat.totalDistance}m</span>
            {resultat.totalTemps !== '0:00' && (
              <span className="text-green-600 font-semibold">{resultat.totalTemps}</span>
            )}
            <span className="text-xs text-gray-400">calculé</span>
          </div>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={handleSave}
          disabled={!texte.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2 rounded-lg text-sm transition"
        >
          {initial ? '✏️ Mettre à jour' : '⭐ Enregistrer en favori'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
