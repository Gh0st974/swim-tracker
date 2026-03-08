// src/DateRangeSelector.jsx
import { useState, useCallback, useEffect } from 'react'

const PRESETS = [
  { label: '7j',    days: 7   },
  { label: '14j',   days: 14  },
  { label: '21j',   days: 21  },
  { label: '30j',   days: 30  },
  { label: '3m',    days: 90  },
  { label: '6m',    days: 180 },
  { label: 'Année', days: 365 },
]

const GRANULARITIES = [
  { label: 'Jour',    value: 'day'   },
  { label: 'Semaine', value: 'week'  },
  { label: 'Mois',    value: 'month' },
]

function toInputDate(date) {
  return date.toISOString().slice(0, 10)
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export default function DateRangeSelector({ onChange }) {
  const today = new Date()

  const [activePreset, setActivePreset] = useState('30j')
  const [isCustom,     setIsCustom]     = useState(false)
  const [customFrom,   setCustomFrom]   = useState(toInputDate(new Date(today - 30 * 86400000)))
  const [customTo,     setCustomTo]     = useState(toInputDate(today))
  const [granularity,  setGranularity]  = useState('week')

  const emit = useCallback((from, to, gran) => {
    onChange({ from: startOfDay(from), to: endOfDay(to), granularity: gran })
  }, [onChange])

  // ── Init : émet une fois après le montage ✅
  useEffect(() => {
    const preset = PRESETS.find(p => p.label === '30j')
    emit(new Date(today - preset.days * 86400000), today, 'week')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Preset click ──────────────────────────────────────
  function selectPreset(preset) {
    setIsCustom(false)
    setActivePreset(preset.label)
    const from = new Date(today - preset.days * 86400000)
    emit(from, today, granularity)
  }

  // ── Custom dates ──────────────────────────────────────
  function handleCustomFrom(val) {
    setCustomFrom(val)
    if (val && customTo && val <= customTo) {
      emit(new Date(val), new Date(customTo), granularity)
    }
  }

  function handleCustomTo(val) {
    setCustomTo(val)
    if (customFrom && val && customFrom <= val) {
      emit(new Date(customFrom), new Date(val), granularity)
    }
  }

  // ── Granularity ───────────────────────────────────────
  function selectGranularity(val) {
    setGranularity(val)
    if (isCustom) {
      if (customFrom && customTo) emit(new Date(customFrom), new Date(customTo), val)
    } else {
      const preset = PRESETS.find(p => p.label === activePreset)
      if (preset) emit(new Date(today - preset.days * 86400000), today, val)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm space-y-3">

      {/* Ligne 1 — Presets + Custom */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 font-medium mr-1">Période</span>

        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => selectPreset(preset)}
            className={`text-xs px-3 py-1 rounded-full border transition
              ${!isCustom && activePreset === preset.label
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-500'
              }`}
          >
            {preset.label}
          </button>
        ))}

        <button
          onClick={() => {
            setIsCustom(true)
            setActivePreset(null)
            if (customFrom && customTo) {
              emit(new Date(customFrom), new Date(customTo), granularity)
            }
          }}
          className={`text-xs px-3 py-1 rounded-full border transition
            ${isCustom
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-500'
            }`}
        >
          Custom
        </button>
      </div>

      {/* Ligne 2 — Pickers custom (conditionnelle) */}
      {isCustom && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Du</span>
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={e => handleCustomFrom(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1
                       focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <span className="text-xs text-gray-400 font-medium">au</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            max={toInputDate(today)}
            onChange={e => handleCustomTo(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1
                       focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {customFrom > customTo && (
            <span className="text-xs text-red-400">⚠ Date de début après la fin</span>
          )}
        </div>
      )}

      {/* Ligne 3 — Granularité */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium mr-1">Grouper par</span>
        {GRANULARITIES.map(g => (
          <button
            key={g.value}
            onClick={() => selectGranularity(g.value)}
            className={`text-xs px-3 py-1 rounded-full border transition
              ${granularity === g.value
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-500'
              }`}
          >
            {g.label}
          </button>
        ))}
      </div>

    </div>
  )
}
