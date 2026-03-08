import { useState, useEffect } from 'react'
import { X, StickyNote, Save, Trash2 } from 'lucide-react'
import { formatDateFR } from './calendarUtils'

export default function NoteModal({ date, note, onSauvegarder, onSupprimer, onFermer }) {
  const [texte,   setTexte]   = useState(note?.texte   || '')
  const [couleur, setCouleur] = useState(note?.couleur || 'yellow')

  useEffect(() => {
    setTexte(note?.texte     || '')
    setCouleur(note?.couleur || 'yellow')
  }, [note])

  const COULEURS = [
    { id: 'yellow', bg: '#FEF9C3', border: '#FDE047', label: 'Jaune'  },
    { id: 'blue',   bg: '#DBEAFE', border: '#93C5FD', label: 'Bleu'   },
    { id: 'green',  bg: '#DCFCE7', border: '#86EFAC', label: 'Vert'   },
    { id: 'pink',   bg: '#FCE7F3', border: '#F9A8D4', label: 'Rose'   },
    { id: 'orange', bg: '#FFEDD5', border: '#FDBA74', label: 'Orange' },
  ]

  const couleurActuelle = COULEURS.find(c => c.id === couleur) || COULEURS[0]

  function handleSauvegarder() {
    if (!texte.trim()) return
    onSauvegarder({
      id:      note?.id || `note_${Date.now()}`,
      type:    'note',
      date:    date.toISOString(),
      texte:   texte.trim(),
      couleur,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onFermer}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: couleurActuelle.bg, border: `2px solid ${couleurActuelle.border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote size={18} className="text-gray-500" />
            <div>
              <p className="font-semibold text-gray-700 text-sm">
                {note ? 'Modifier la note' : 'Nouvelle note'}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {formatDateFR(date)}
              </p>
            </div>
          </div>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Sélecteur couleur */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Couleur :</span>
          <div className="flex gap-1.5">
            {COULEURS.map(c => (
              <button
                key={c.id}
                onClick={() => setCouleur(c.id)}
                title={c.label}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.bg,
                  border: `2px solid ${couleur === c.id ? '#374151' : c.border}`,
                  transform: couleur === c.id ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Zone de texte */}
        <textarea
          autoFocus
          value={texte}
          onChange={e => setTexte(e.target.value)}
          placeholder="Écrivez votre note ici..."
          rows={5}
          className="w-full rounded-lg p-3 text-sm text-gray-700 resize-none outline-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.6)',
            border: `1px solid ${couleurActuelle.border}`,
          }}
        />

        {/* Actions */}
        <div className="flex justify-between items-center">
          {note ? (
            <button
              onClick={() => onSupprimer(note.id)}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onFermer}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSauvegarder}
              disabled={!texte.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#1d83ea' }}
            >
              <Save size={14} /> Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
