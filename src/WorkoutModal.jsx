import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { parseSeance } from './parser'
import { WORKOUT_COLORS, formatDateFR } from './calendarUtils'
import FormatToolbar from './FormatToolbar'

export default function WorkoutModal({
  date,
  seance,
  nages, materiel, intensite, typeExo,
  tempsDefaut,
  onSauvegarder,
  onSupprimer,
  onFermer,
}) {
  const [titre,      setTitre]      = useState(seance?.titre || '')
  const [texte,      setTexte]      = useState(seance?.texte || '')
  const [type,       setType]       = useState(seance?.type  || 'practice')
  const [dateSeance, setDateSeance] = useState(() => {
    if (seance?.date) return new Date(seance.date).toISOString().slice(0, 16)
    const d = new Date(date)
    d.setHours(8, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })

  const editorRef = useRef(null)

  const resultat = texte.trim()
    ? parseSeance(
        texte,
        { nages, materiel, intensite, typeExo, blocs: [] },
        tempsDefaut || {}
      )
    : null

  useEffect(() => {
    if (!editorRef.current) return
    if (seance?.html) {
      editorRef.current.innerHTML = seance.html
    } else if (seance?.texte) {
      editorRef.current.innerHTML = seance.texte.replace(/\n/g, '<br/>')
    }
  }, [])

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) setTexte(editorRef.current.innerText)
  }, [])

  const handleSauvegarder = () => {
    if (!resultat || resultat.totalDistance === 0) return
    const payload = {
      id:             seance?.id || Date.now(),
      date:           dateSeance
                        ? new Date(dateSeance).toISOString()
                        : new Date(date).toISOString(),
      titre:          titre.trim() || '',
      type,
      texte,
      html:           editorRef.current?.innerHTML || '',
      totalDistance:  resultat.totalDistance,
      totalTemps:     resultat.totalTemps,
      statsNages:     resultat.statsNages,
      statsMateriel:  resultat.statsMateriel,
      statsIntensite: resultat.statsIntensite,
      statsTypeExo:   resultat.statsTypeExo,
    }
    onSauvegarder(payload, !!seance)
    onFermer()
  }

  const couleur = WORKOUT_COLORS[type] || WORKOUT_COLORS.practice

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onFermer() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 capitalize">{formatDateFR(date)}</p>
            <h2 className="text-base font-semibold text-gray-800">
              {seance ? 'Modifier la séance' : 'Nouvelle séance'}
            </h2>
          </div>
          <button
            onClick={onFermer}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Type */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(WORKOUT_COLORS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: type === key ? val.bg : '#F3F4F6',
                  color:           type === key ? '#fff'  : '#6B7280',
                  outline:         type === key ? `2px solid ${val.bg}` : 'none',
                  outlineOffset:   '2px',
                }}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Titre + date */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Titre de la séance"
              value={titre}
              onChange={e => setTitre(e.target.value)}
            />
            <input
              type="datetime-local"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              value={dateSeance}
              onChange={e => setDateSeance(e.target.value)}
            />
          </div>

          {/* Éditeur */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <FormatToolbar editorRef={editorRef} onChange={handleEditorInput} />
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={handleEditorInput}
              data-placeholder={"Echauffement:\n    400 nl a1\n\nCorps:\n    8x100 nl a2 @1:30\n\nCorps:\n    200 nl souple"}
              className="w-full p-4 font-mono text-sm outline-none leading-relaxed min-h-[180px]"
            />
          </div>

          {/* Preview résultat */}
          {resultat && resultat.totalDistance > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap gap-6 items-center"
              style={{
                backgroundColor: couleur.bg + '15',
                borderLeft: `4px solid ${couleur.bg}`,
              }}
            >
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Distance</p>
                <p className="text-2xl font-bold" style={{ color: couleur.bg }}>
                  {resultat.totalDistance}m
                </p>
              </div>
              {resultat.totalTemps && resultat.totalTemps !== '0:00' && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Temps estimé</p>
                  <p className="text-2xl font-bold text-green-600">{resultat.totalTemps}</p>
                </div>
              )}
              {Object.keys(resultat.statsNages || {}).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nages</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(resultat.statsNages).map(([nom, dist]) => (
                      <span
                        key={nom}
                        className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-600 shadow-sm"
                      >
                        {nom} <strong>{dist}m</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {seance && onSupprimer ? (
            <button
              onClick={() => { onSupprimer(seance.id); onFermer() }}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={15} /> Supprimer
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onFermer}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSauvegarder}
              disabled={!resultat || resultat.totalDistance === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: couleur.bg }}
            >
              <Save size={15} /> Sauvegarder
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
