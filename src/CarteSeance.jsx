// CarteSeance.jsx
import { COULEURS_NAGES, COULEURS_MAT, COULEURS_INT, COULEURS_TYPE } from './constants'

// ── Helpers couleur ──────────────────────────────────────────────────────────
function getCouleur(label, map) {
  if (!map) return { bg: 'bg-gray-100', text: 'text-gray-600' }
  const hex = map[label]
  if (!hex) return { bg: 'bg-gray-100', text: 'text-gray-600' }
  return { bg: '', text: '', hex }
}

// ── Pill colorée ─────────────────────────────────────────────────────────────
function Pill({ label, distance, hex }) {
  // On génère un bg très léger à partir de la couleur hex
  const style = hex
    ? { backgroundColor: hex + '22', color: hex, borderColor: hex + '55' }
    : {}
  const base = hex
    ? 'border'
    : 'bg-gray-100 text-gray-500'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${base}`}
      style={style}
    >
      {label}
      <span className="opacity-60 font-normal">
        {(distance || 0).toLocaleString('fr-FR')}m
      </span>
    </span>
  )
}

// ── Groupe de pills avec séparateur vertical ──────────────────────────────────
function PillGroup({ items, couleurs }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map(({ label, distance }) => {
        const hex = couleurs?.[label]
        return <Pill key={label} label={label} distance={distance} hex={hex} />
      })}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CarteSeance({
  s,
  modifierSeance,
  dupliquerSeance,
  supprimerSeance,
  seanceOuverte,
  setSeanceOuverte,
}) {
  const isOpen = seanceOuverte === s.id

  // Construire les listes de pills depuis les stats sauvegardées
  const nageItems = Object.entries(s.statsNages    || {}).map(([label, distance]) => ({ label, distance }))
  const matItems  = Object.entries(s.statsMateriel || {}).map(([label, distance]) => ({ label, distance }))
  const intItems  = Object.entries(s.statsIntensite|| {}).map(([label, distance]) => ({ label, distance }))
  const typeItems = Object.entries(s.statsTypeExo  || {}).map(([label, distance]) => ({ label, distance }))

  const hasPills = nageItems.length || matItems.length || intItems.length || typeItems.length

  // Format date compact : "jeu. 12 mars 2026 · 10:00"
  const dateFormatee = new Date(s.date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

      {/* ── Ligne principale ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setSeanceOuverte(isOpen ? null : s.id)}
      >
        {/* Chevron */}
        <span className={`text-gray-300 text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>

        {/* Titre + date */}
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="font-semibold text-sm text-gray-800 truncate">
            {s.titre || 'Séance sans titre'}
          </span>
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
            {dateFormatee}
          </span>
        </div>

        {/* Distance */}
        <span className="text-sm font-bold text-[#1d83ea] whitespace-nowrap">
          {(s.totalDistance || 0).toLocaleString('fr-FR')}m
        </span>

        {/* Boutons action */}
        <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => modifierSeance(s)}
            title="Modifier"
            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={() => dupliquerSeance(s)}
            title="Dupliquer"
            className="p-1.5 rounded-lg text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors"
          >
            📋
          </button>
          <button
            onClick={() => supprimerSeance(s.id)}
            title="Supprimer"
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* ── Bande de pills stats ─────────────────────────────────────── */}
      {hasPills && (
        <div className="px-4 pb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">

          {/* Séparateur visuel léger entre groupes */}
          <PillGroup items={nageItems} couleurs={COULEURS_NAGES} />

          {matItems.length > 0 && nageItems.length > 0 && (
            <span className="w-px h-3 bg-gray-200 self-center" />
          )}
          <PillGroup items={matItems} couleurs={COULEURS_MAT} />

          {intItems.length > 0 && (matItems.length > 0 || nageItems.length > 0) && (
            <span className="w-px h-3 bg-gray-200 self-center" />
          )}
          <PillGroup items={intItems} couleurs={COULEURS_INT} />

          {typeItems.length > 0 && (intItems.length > 0 || matItems.length > 0 || nageItems.length > 0) && (
            <span className="w-px h-3 bg-gray-200 self-center" />
          )}
          <PillGroup items={typeItems} couleurs={COULEURS_TYPE} />

        </div>
      )}

      {/* ── Texte dépliable ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
            {s.texte}
          </pre>
        </div>
      )}

    </div>
  )
}
