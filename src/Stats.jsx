// src/Stats.jsx
import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2'
import DateRangeSelector from './DateRangeSelector'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
)

// ── Constantes ────────────────────────────────────────────
const STORAGE_CHARTS = 'swim_charts'
const STORAGE_FIXED  = 'swim_kpis_visible'

const PALETTE = [
  '#88b3e7ff','#434347ff','#a5ea89ff','#eaa668ff',
  '#8185e2ff','#df6681ff','#e1d369ff','#468b8bff'
]

// ── Helpers date ──────────────────────────────────────────
function getWeekKey(dateStr) {
  const d   = new Date(dateStr)
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  const mon = new Date(d)
  mon.setDate(d.getDate() - day)
  return mon.toISOString().slice(0, 10)
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getDayKey(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10)
}

function filterByRange(historique, dateRange) {
  if (!dateRange) return historique
  const { from, to } = dateRange
  return historique.filter(s => {
    if (!s.date) return false
    const d = new Date(s.date)
    return d >= from && d <= to
  })
}

function groupBy(historique, granularity) {
  const key = granularity === 'day'   ? getDayKey
            : granularity === 'month' ? getMonthKey
            : getWeekKey
  const map = {}
  for (const s of historique) {
    if (!s.date || !s.totalDistance) continue
    const k = key(s.date)
    map[k] = (map[k] || 0) + s.totalDistance
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

function formatKey(k, granularity) {
  if (granularity === 'month') {
    const [y, m] = k.split('-')
    return `${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][+m - 1]} ${y}`
  }
  const d = new Date(k)
  if (granularity === 'day') return `${d.getDate()}/${d.getMonth() + 1}`
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// ── Options Chart.js ──────────────────────────────────────
const BAR_LINE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend:  { display: false },
    tooltip: { titleFont: { size: 11 }, bodyFont: { size: 11 } },
  },
  scales: {
    y: {
      ticks: { font: { size: 10 }, callback: v => v >= 1000 ? `${v/1000}k` : v },
      grid:  { color: '#f3f4f6' }
    },
    x: { ticks: { font: { size: 10 } } }
  }
}

const STACKED_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { font: { size: 10 }, boxWidth: 10, padding: 8 }
    },
    tooltip: { titleFont: { size: 11 }, bodyFont: { size: 11 } },
  },
  scales: {
    y: {
      stacked: true,
      ticks: { font: { size: 10 }, callback: v => v >= 1000 ? `${v/1000}k` : v },
      grid:  { color: '#f3f4f6' }
    },
    x: { stacked: true, ticks: { font: { size: 10 } } }
  }
}

const DOUGHNUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}m` } }
  }
}

const RADAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { titleFont: { size: 11 }, bodyFont: { size: 11 } },
  },
  scales: {
    r: {
      ticks: { font: { size: 9 }, backdropColor: 'transparent' },
      grid:  { color: '#e5e7eb' },
      pointLabels: { font: { size: 10 } }
    }
  }
}

// ── Sources de données ────────────────────────────────────
const DATA_SOURCES = {
  volumeParPeriode: {
    label: 'Volume par période',
    compatibleTypes: ['bar', 'line'],
    build: (historique, { granularity = 'week' } = {}) => {
      const entries = groupBy(historique, granularity)
      return {
        labels: entries.map(([k]) => formatKey(k, granularity)),
        values: entries.map(([, v]) => v),
      }
    }
  },

  repartitionNages: {
    label: 'Répartition des nages (total)',
    compatibleTypes: ['doughnut', 'bar', 'radar'],
    build: (historique) => {
      const totals = {}
      for (const s of historique)
        for (const [k, v] of Object.entries(s.statsNages || {}))
          totals[k] = (totals[k] || 0) + v
      const entries = Object.entries(totals).sort(([, a], [, b]) => b - a)
      return {
        labels: entries.map(([k]) => k),
        values: entries.map(([, v]) => v),
      }
    }
  },

  repartitionMateriel: {
    label: 'Répartition du matériel (total)',
    compatibleTypes: ['doughnut', 'bar'],
    build: (historique) => {
      const totals = {}
      for (const s of historique)
        for (const [k, v] of Object.entries(s.statsMateriel || {}))
          totals[k] = (totals[k] || 0) + v
      const entries = Object.entries(totals).sort(([, a], [, b]) => b - a)
      return {
        labels: entries.map(([k]) => k),
        values: entries.map(([, v]) => v),
      }
    }
  },

  repartitionIntensite: {
    label: "Répartition de l'intensité (total)",
    compatibleTypes: ['doughnut', 'bar'],
    build: (historique) => {
      const totals = {}
      for (const s of historique)
        for (const [k, v] of Object.entries(s.statsIntensite || {}))
          totals[k] = (totals[k] || 0) + v
      const entries = Object.entries(totals).sort(([, a], [, b]) => b - a)
      return {
        labels: entries.map(([k]) => k),
        values: entries.map(([, v]) => v),
      }
    }
  },

  // ── NOUVEAU : Répartition type d'exercice (donut/bar) ──
  repartitionType: {
    label: "Répartition par type d'exercice (total)",
    compatibleTypes: ['doughnut', 'bar', 'radar'],
    build: (historique) => {
      const totals = {}
      for (const s of historique)
        for (const [k, v] of Object.entries(s.statsTypeExo || {}))
          totals[k] = (totals[k] || 0) + v
      const entries = Object.entries(totals).sort(([, a], [, b]) => b - a)
      return {
        labels: entries.map(([k]) => k),
        values: entries.map(([, v]) => v),
      }
    }
  },

  // ── NOUVEAU : Types empilés par période ────────────────
  airesTypeParPeriode: {
    label: "Types d'exercice empilés par période",
    compatibleTypes: ['stackedBar'],
    build: (historique, { granularity = 'week' } = {}) => {
      const keyFn = granularity === 'day'   ? getDayKey
                  : granularity === 'month' ? getMonthKey
                  : getWeekKey

      const periodsSet = new Set()
      const typesSet   = new Set()
      const map = {}

      for (const s of historique) {
        if (!s.date) continue
        const pk = keyFn(s.date)
        periodsSet.add(pk)
        for (const [type, dist] of Object.entries(s.statsTypeExo || {})) {
          typesSet.add(type)
          if (!map[pk]) map[pk] = {}
          map[pk][type] = (map[pk][type] || 0) + dist
        }
      }

      const periods = [...periodsSet].sort()
      const types   = [...typesSet]

      return {
        labels: periods.map(k => formatKey(k, granularity)),
        values: null,
        _stacked: true,
        _datasets: types.map((type, i) => ({
          label: type,
          data: periods.map(pk => map[pk]?.[type] || 0),
          backgroundColor: PALETTE[i % PALETTE.length] + 'cc',
          borderColor:     PALETTE[i % PALETTE.length],
          borderWidth: 1,
          borderRadius: 2,
        }))
      }
    }
  },

  airesNagesParPeriode: {
    label: 'Nages empilées par période',
    compatibleTypes: ['stackedBar'],
    build: (historique, { granularity = 'week' } = {}) => {
      const keyFn = granularity === 'day'   ? getDayKey
                  : granularity === 'month' ? getMonthKey
                  : getWeekKey

      const periodsSet = new Set()
      const nagesSet   = new Set()
      const map = {}

      for (const s of historique) {
        if (!s.date) continue
        const pk = keyFn(s.date)
        periodsSet.add(pk)
        for (const [nage, dist] of Object.entries(s.statsNages || {})) {
          nagesSet.add(nage)
          if (!map[pk]) map[pk] = {}
          map[pk][nage] = (map[pk][nage] || 0) + dist
        }
      }

      const periods = [...periodsSet].sort()
      const nages   = [...nagesSet]

      return {
        labels: periods.map(k => formatKey(k, granularity)),
        values: null,
        _stacked: true,
        _datasets: nages.map((nage, i) => ({
          label: nage,
          data: periods.map(pk => map[pk]?.[nage] || 0),
          backgroundColor: PALETTE[i % PALETTE.length] + 'cc',
          borderColor:     PALETTE[i % PALETTE.length],
          borderWidth: 1,
          borderRadius: 2,
        }))
      }
    }
  },

  radarNages: {
    label: 'Radar des nages',
    compatibleTypes: ['radar'],
    build: (historique) => {
      const totals = {}
      for (const s of historique)
        for (const [k, v] of Object.entries(s.statsNages || {}))
          totals[k] = (totals[k] || 0) + v
      const entries = Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 8)
      return {
        labels: entries.map(([k]) => k),
        values: entries.map(([, v]) => v)
      }
    }
  },
}

// ── Config UI ─────────────────────────────────────────────
const CHART_TYPES = [
  { value: 'bar',        label: '📊 Barres'   },
  { value: 'line',       label: '📈 Courbe'   },
  { value: 'doughnut',   label: '🍩 Donut'    },
  { value: 'stackedBar', label: '📚 Empilé'   },
  { value: 'radar',      label: '🕸️ Radar'   },
  { value: 'heatmap',    label: '🗓️ Heatmap' },
]

const SIZES = [
  { value: 'full',  label: 'Pleine largeur' },
  { value: 'half',  label: '½ largeur'      },
  { value: 'third', label: '⅓ largeur'      },
  { value: 'quarter', label: '¼ largeur'      },
]

const SIZE_CLASSES = {
  full:  'col-span-12',
  half:  'col-span-12 lg:col-span-6',
  third: 'col-span-12 lg:col-span-4',
  quarter: 'col-span-12 lg:col-span-3',
}

// ── Heatmap calendrier (canvas custom) ───────────────────
function HeatmapCalendar({ historique }) {
  const canvasRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const dailyMap = useMemo(() => {
    const map = {}
    for (const s of historique) {
      if (!s.date || !s.totalDistance) continue
      const k = new Date(s.date).toISOString().slice(0, 10)
      map[k] = (map[k] || 0) + s.totalDistance
    }
    return map
  }, [historique])

  const maxVal = useMemo(() => Math.max(1, ...Object.values(dailyMap)), [dailyMap])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const today    = new Date()
    const WEEKS    = 26
    const CELL     = 14
    const PAD      = { top: 24, left: 28, right: 8, bottom: 8 }
    const W        = PAD.left + WEEKS * CELL + PAD.right
    const H        = PAD.top  + 7 * CELL     + PAD.bottom

    canvas.width  = W
    canvas.height = H
    canvas._cells = []

    ctx.clearRect(0, 0, W, H)

    // Labels jours
    const days = ['L','M','M','J','V','S','D']
    days.forEach((d, i) => {
      ctx.fillStyle = '#9ca3af'
      ctx.font = `${Math.max(8, CELL - 4)}px system-ui`
      ctx.fillText(d, 4, PAD.top + i * CELL + CELL - 3)
    })

    // Début : lundi il y a WEEKS semaines
    const startMon = new Date(today)
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1
    startMon.setDate(today.getDate() - dow - (WEEKS - 1) * 7)

    // Labels mois
    let lastMonth = -1
    for (let w = 0; w < WEEKS; w++) {
      const d = new Date(startMon)
      d.setDate(startMon.getDate() + w * 7)
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth()
        const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
        ctx.fillStyle = '#6b7280'
        ctx.font = `${Math.max(9, CELL - 2)}px system-ui`
        ctx.fillText(months[d.getMonth()], PAD.left + w * CELL, PAD.top - 6)
      }
    }

    // Cellules
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(startMon)
        date.setDate(startMon.getDate() + w * 7 + d)
        if (date > today) continue

        const k   = date.toISOString().slice(0, 10)
        const val = dailyMap[k] || 0
        const t   = val / maxVal

        const x = PAD.left + w * CELL
        const y = PAD.top  + d * CELL
        const r = Math.max(2, CELL * 0.15)
        const s = CELL - 2

        const alpha = val === 0 ? 0 : 0.15 + t * 0.85
        ctx.fillStyle = val === 0 ? '#f3f4f6' : `rgba(29,131,234,${alpha.toFixed(2)})`

        ctx.beginPath()
        ctx.roundRect(x, y, s, s, r)
        ctx.fill()

        canvas._cells.push({ x, y, s, k, val })
      }
    }
  }, [dailyMap, maxVal])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left)  * scaleX
    const my = (e.clientY - rect.top)   * scaleY

    const cell = (canvas._cells || []).find(c =>
      mx >= c.x && mx <= c.x + c.s && my >= c.y && my <= c.y + c.s
    )
    setTooltip(cell ? { ...cell, x: e.clientX, y: e.clientY } : null)
  }, [])

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          📅 {new Date(tooltip.k).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}
          <span className="ml-2 font-bold text-blue-300">{tooltip.val}m</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-xs text-gray-400">Moins</span>
        {[0, 0.2, 0.4, 0.65, 1].map((t, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: t === 0 ? '#f3f4f6' : `rgba(29,131,234,${(0.15 + t * 0.85).toFixed(2)})`
            }}
          />
        ))}
        <span className="text-xs text-gray-400">Plus</span>
      </div>
    </div>
  )
}

// ── Header widget ─────────────────────────────────────────
function Header({ chart, onEdit, onRemove, onMove, isFirst, isLast }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold truncate mr-2">
        {chart.title}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onMove(-1)} disabled={isFirst}
          className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs px-1">◀</button>
        <button onClick={() => onMove(1)} disabled={isLast}
          className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs px-1">▶</button>
        <button onClick={onEdit}   className="text-gray-300 hover:text-blue-500 text-xs px-1">✏️</button>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500  text-xs px-1">✕</button>
      </div>
    </div>
  )
}

// ── Widget graphique ──────────────────────────────────────
function ChartWidget({ chart, historique, granularity, onEdit, onRemove, onMove, isFirst, isLast }) {
  const source = DATA_SOURCES[chart.source]

  const built = useMemo(
    () => source?.build(historique, { granularity }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historique, chart.source, granularity]
  )

  if (chart.source === '__heatmap__' || chart.type === 'heatmap') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col">
        <Header {...{ chart, onEdit, onRemove, onMove, isFirst, isLast }} />
        <HeatmapCalendar historique={historique} />
      </div>
    )
  }

  if (!source || !built) return null

  const isStacked  = chart.type === 'stackedBar'
  const isDoughnut = chart.type === 'doughnut'
  const isRadar    = chart.type === 'radar'

  const hasData = isStacked
    ? built._datasets?.some(ds => ds.data.some(v => v > 0))
    : built.values?.some(v => v > 0)

  if (!hasData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col">
        <Header {...{ chart, onEdit, onRemove, onMove, isFirst, isLast }} />
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm py-8">
          Pas de données sur cette période
        </div>
      </div>
    )
  }

  // Données Chart.js
  let chartData
  if (isStacked && built._stacked) {
    chartData = { labels: built.labels, datasets: built._datasets }
  } else if (isDoughnut) {
    chartData = {
      labels: built.labels,
      datasets: [{ data: built.values, backgroundColor: PALETTE, borderWidth: 1, hoverOffset: 6 }]
    }
  } else if (isRadar) {
    chartData = {
      labels: built.labels,
      datasets: [{
        data: built.values,
        backgroundColor: chart.color + '33',
        borderColor:     chart.color,
        borderWidth: 2,
        pointBackgroundColor: chart.color,
        pointRadius: 4,
      }]
    }
  } else {
    chartData = {
      labels: built.labels,
      datasets: [{
        data: built.values,
        backgroundColor: chart.color + '33',
        borderColor:     chart.color,
        borderWidth: 2,
        borderRadius: 4,
        tension: 0.35,
        fill: chart.type === 'line',
        pointBackgroundColor: chart.color,
        pointRadius: 3,
      }]
    }
  }

  const chartHeight = isDoughnut ? '220px' : isRadar ? '240px' : '190px'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col">
      <Header {...{ chart, onEdit, onRemove, onMove, isFirst, isLast }} />

      {/* Légende inline pour donut */}
      {isDoughnut && built.labels?.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          {built.labels.map((l, i) => (
            <span key={l} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
              {l}
            </span>
          ))}
        </div>
      )}

      <div style={{ height: chartHeight }}>
        {isStacked  && <Bar    data={chartData} options={STACKED_OPTS}  />}
        {isDoughnut && <Doughnut data={chartData} options={DOUGHNUT_OPTS} />}
        {isRadar    && <Radar  data={chartData} options={RADAR_OPTS}    />}
        {!isStacked && !isDoughnut && !isRadar && chart.type === 'bar'  && (
          <Bar  data={chartData} options={BAR_LINE_OPTS} />
        )}
        {!isStacked && !isDoughnut && !isRadar && chart.type !== 'bar'  && (
          <Line data={chartData} options={BAR_LINE_OPTS} />
        )}
      </div>
    </div>
  )
}

// ── Modal création / édition ──────────────────────────────
const DEFAULT_NEW = { title: '', source: 'volumeParPeriode', type: 'bar', size: 'half', color: '#6366f1' }

function ChartModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || DEFAULT_NEW)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const srcDef      = DATA_SOURCES[form.source]
  const compatTypes = srcDef?.compatibleTypes || []
  const type        = compatTypes.includes(form.type) ? form.type : compatTypes[0]
  const valid       = form.title.trim() && form.source && type

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg">{initial ? 'Modifier le graphique' : 'Nouveau graphique'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>

        <div className="flex flex-col gap-4">

          {/* Titre */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Titre</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Ex : Mes types d'exercice"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Données</label>
            <select value={form.source} onChange={e => set('source', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-300">
              {Object.entries(DATA_SOURCES).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
              <option value="__heatmap__">🗓️ Heatmap calendrier</option>
            </select>
          </div>

          {/* Type de graphique */}
          {form.source !== '__heatmap__' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Type de graphique</label>
              <div className="flex gap-2 flex-wrap">
                {CHART_TYPES.filter(ct => compatTypes.includes(ct.value)).map(ct => (
                  <button key={ct.value} onClick={() => set('type', ct.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      type === ct.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Taille */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Largeur</label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(s => (
                <button key={s.value} onClick={() => set('size', s.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    form.size === s.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          {type !== 'doughnut' && type !== 'stackedBar' && type !== 'radar' &&
           form.source !== '__heatmap__' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Couleur</label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => set('color', c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
            Annuler
          </button>
          <button disabled={!valid && form.source !== '__heatmap__'}
            onClick={() => onSave({ ...form, type: form.source === '__heatmap__' ? 'heatmap' : type })}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600
                       disabled:opacity-40 transition-colors">
            {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KPIs ──────────────────────────────────────────────────
function KPIs({ historique, historiqueFiltre, visible, dateRange }) {
  const total   = historiqueFiltre.reduce((a, s) => a + (s.totalDistance || 0), 0)
  const seances = historiqueFiltre.length
  const avg     = seances ? Math.round(total / seances) : 0

  const best = historiqueFiltre.reduce((max, s) =>
    (s.totalDistance || 0) > (max?.totalDistance || 0) ? s : max, null)

  if (!visible) return null

  const isFiltered = dateRange !== null

  return (
    <div className="col-span-12">
      {isFiltered && (
        <div className="text-xs text-blue-500 font-medium mb-2 flex items-center gap-1">
          <span>📅</span>
          <span>
            {new Date(dateRange.from).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
            {' → '}
            {new Date(dateRange.to).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
          </span>
          <span className="text-gray-400 ml-1">({seances} séance{seances > 1 ? 's' : ''})</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Volume total',    value: total >= 1000 ? `${(total/1000).toFixed(1)} km` : `${total}m`, color: 'text-blue-600',   icon: '🏊' },
          { label: 'Séances',         value: seances,                                                        color: 'text-purple-600', icon: '📅' },
          { label: 'Moy. / séance',   value: `${avg}m`,                                                      color: 'text-green-600',  icon: '📊' },
          { label: 'Meilleure séance',value: best ? `${best.totalDistance}m` : '—',                          color: 'text-orange-500', icon: '🏆' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────
export default function Stats({ historique }) {

  const [charts, setCharts] = useState(() => {
    try   { return JSON.parse(localStorage.getItem(STORAGE_CHARTS)) || [] }
    catch { return [] }
  })

  const [showKPIs, setShowKPIs] = useState(() => {
    try   { return JSON.parse(localStorage.getItem(STORAGE_FIXED)) ?? true }
    catch { return true }
  })

  const [modal, setModal]         = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [granularity, setGranularity] = useState('week')

  const historiqueFiltre = useMemo(() => filterByRange(historique, dateRange), [historique, dateRange])

  const save = useCallback((next) => {
    setCharts(next)
    localStorage.setItem(STORAGE_CHARTS, JSON.stringify(next))
  }, [])

  const toggleKPIs = () => {
    const next = !showKPIs
    setShowKPIs(next)
    localStorage.setItem(STORAGE_FIXED, JSON.stringify(next))
  }

  const addChart    = (form) => { save([...charts, { ...form, id: Date.now() }]); setModal(null) }
  const editChart   = (form) => {
    const next = [...charts]
    next[modal.idx] = { ...form, id: charts[modal.idx].id }
    save(next); setModal(null)
  }
  const removeChart = (idx) => save(charts.filter((_, i) => i !== idx))
  const moveChart   = (idx, dir) => {
    const next = [...charts]
    const t    = idx + dir
    if (t < 0 || t >= next.length) return
    ;[next[idx], next[t]] = [next[t], next[idx]]
    save(next)
  }

  if (historique.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="text-5xl mb-3">📊</div>
        <div className="text-sm">Enregistre des séances pour voir tes stats !</div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-screen-xl mx-auto">

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold">Statistiques</h2>
        <div className="flex gap-2">
          <button onClick={toggleKPIs}
            className={`text-sm border rounded-lg px-3 py-1.5 shadow-sm transition ${
              showKPIs
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            📌 KPIs
          </button>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-1 text-sm bg-blue-500 text-white
                       rounded-lg px-3 py-1.5 shadow-sm hover:bg-blue-600 transition">
            + Graphique
          </button>
        </div>
      </div>

      <DateRangeSelector
        onChange={({ from, to, granularity: g }) => {
          setDateRange(from && to ? { from, to } : null)
          setGranularity(g)
        }}
      />

      <div className="grid grid-cols-12 gap-4 mt-4">

        <KPIs
          historique={historique}
          historiqueFiltre={historiqueFiltre}
          visible={showKPIs}
          dateRange={dateRange}
        />

        {charts.map((chart, idx) => (
          <div key={chart.id} className={SIZE_CLASSES[chart.size] || SIZE_CLASSES.half}>
            <ChartWidget
              chart={chart}
              historique={historiqueFiltre}
              granularity={granularity}
              onEdit={()   => setModal({ idx, chart })}
              onRemove={()  => removeChart(idx)}
              onMove={dir  => moveChart(idx, dir)}
              isFirst={idx === 0}
              isLast={idx === charts.length - 1}
            />
          </div>
        ))}

        {charts.length === 0 && (
          <div className="col-span-12 flex flex-col items-center justify-center py-16 text-gray-300">
            <div className="text-5xl mb-3">📊</div>
            <div className="text-sm">
              Aucun graphique — clique sur{' '}
              <strong className="text-gray-400">+ Graphique</strong> pour commencer.
            </div>
          </div>
        )}
      </div>

      {modal === 'new' && (
        <ChartModal onSave={addChart} onClose={() => setModal(null)} />
      )}
      {modal && modal.idx !== undefined && (
        <ChartModal initial={modal.chart} onSave={editChart} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
