import { useRef } from 'react'

const COULEURS = [
  { label: 'Bleu',    value: '#1d83ea' },
  { label: 'Vert',    value: '#16a34a' },
  { label: 'Rouge',   value: '#dc2626' },
  { label: 'Orange',  value: '#ea580c' },
  { label: 'Violet',  value: '#9333ea' },
  { label: 'Rose',    value: '#db2777' },
]

function ToolBtn({ title, onClick, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors
        ${active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
      {children}
    </button>
  )
}

export default function FormatToolbar({ editorRef, onChange }) {
  const colorInputRef = useRef(null)

  const exec = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    onChange()
  }

  const queryActive = (command) => document.queryCommandState(command)

  const insererSeparateur = () => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid #d1d5db;margin:8px 0"/>')
    onChange()
  }

  const effacerFormatage = () => {
    exec('removeFormat')
    // Supprime aussi les couleurs inline
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const fragment = range.cloneContents()
    const div = document.createElement('div')
    div.appendChild(fragment)
    const texte = div.innerText
    document.execCommand('insertText', false, texte)
    onChange()
  }

  const appliquerCouleur = (couleur) => exec('foreColor', couleur)

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">

      {/* Gras / Italique / Souligné */}
      <ToolBtn title="Gras" onClick={() => exec('bold')} active={queryActive('bold')}>
        <strong>G</strong>
      </ToolBtn>
      <ToolBtn title="Italique" onClick={() => exec('italic')} active={queryActive('italic')}>
        <em>I</em>
      </ToolBtn>
      <ToolBtn title="Souligné" onClick={() => exec('underline')} active={queryActive('underline')}>
        <span className="underline">S</span>
      </ToolBtn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Taille */}
      <ToolBtn title="Petit texte" onClick={() => exec('fontSize', '1')}>
        <span className="text-xs">A</span>
      </ToolBtn>
      <ToolBtn title="Texte normal" onClick={() => exec('fontSize', '3')}>
        <span className="text-sm">A</span>
      </ToolBtn>
      <ToolBtn title="Grand texte" onClick={() => exec('fontSize', '5')}>
        <span className="text-base">A</span>
      </ToolBtn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Couleurs prédéfinies */}
      {COULEURS.map(c => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onMouseDown={e => { e.preventDefault(); appliquerCouleur(c.value) }}
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
          style={{ backgroundColor: c.value }}
        />
      ))}

      {/* Couleur libre */}
      <div className="relative">
        <button
          type="button"
          title="Couleur personnalisée"
          onMouseDown={e => { e.preventDefault(); colorInputRef.current?.click() }}
          className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 hover:border-gray-600 transition-colors flex items-center justify-center text-gray-400 text-xs"
        >+</button>
        <input
          ref={colorInputRef}
          type="color"
          className="absolute opacity-0 w-0 h-0"
          onChange={e => appliquerCouleur(e.target.value)}
        />
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Séparateur & Effacer */}
      <ToolBtn title="Insérer un séparateur" onClick={insererSeparateur}>—</ToolBtn>
      <ToolBtn title="Effacer le formatage" onClick={effacerFormatage}>✕ fmt</ToolBtn>
    </div>
  )
}
