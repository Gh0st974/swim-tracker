import { useState } from 'react'
import { DEFAULT_NAGES, DEFAULT_MATERIEL, DEFAULT_INTENSITE, DEFAULT_TYPE } from './defaultDictionaries'

const CATEGORY_LABELS = {
  nages:    { label: 'Nages',           emoji: '🏊' },
  materiel: { label: 'Matériel',        emoji: '🥽' },
  intensite:{ label: 'Intensité',       emoji: '⚡' },
  typeExo:  { label: "Type d'exercice", emoji: '🎯' },
}

export default function Settings({
  nages, materiel, intensite, typeExo,
  tempsDefaut, onSaveTempsDefaut,
  onUpdate, historique, onImport,
}) {
  const dictionaries = { nages, materiel, intensite, typeExo }

  const [newItems, setNewItems] = useState({
    nages:    { abrev: '', nom: '' },
    materiel: { abrev: '', nom: '' },
    intensite:{ abrev: '', nom: '' },
    typeExo:  { abrev: '', nom: '' },
  })
  const [editingItem, setEditingItem] = useState(null)
  const [saved, setSaved] = useState(false)

  const triggerSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const updateCategory = (category, items) => {
    onUpdate(category, items)
    triggerSaved()
  }

  const addItem = (category) => {
    const item = newItems[category]
    if (!item.abrev.trim() || !item.nom.trim()) return
    const updated = [
      ...dictionaries[category],
      { abrev: item.abrev.trim().toLowerCase(), nom: item.nom.trim() },
    ]
    updateCategory(category, updated)
    setNewItems({ ...newItems, [category]: { abrev: '', nom: '' } })
  }

  const removeItem = (category, index) => {
    const updated = dictionaries[category].filter((_, i) => i !== index)
    updateCategory(category, updated)
  }

  const saveEdit = () => {
    if (!editingItem) return
    const updated = [...dictionaries[editingItem.category]]
    updated[editingItem.index] = {
      abrev: editingItem.abrev.trim().toLowerCase(),
      nom:   editingItem.nom.trim(),
    }
    updateCategory(editingItem.category, updated)
    setEditingItem(null)
  }

  const resetToDefaults = () => {
    if (window.confirm('Remettre tous les dictionnaires par défaut ?')) {
      onUpdate('nages',     DEFAULT_NAGES)
      onUpdate('materiel',  DEFAULT_MATERIEL)
      onUpdate('intensite', DEFAULT_INTENSITE)
      onUpdate('typeExo',   DEFAULT_TYPE)
      triggerSaved()
    }
  }

  const handleExport = () => {
    const data = JSON.stringify(historique || [], null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `swim-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data)) throw new Error()
        onImport(data)
        alert(`✓ ${data.length} séances importées.`)
      } catch {
        alert('Fichier invalide')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Paramètres</h2>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-500 text-sm font-medium">✓ Sauvegardé</span>
          )}
          <button
            onClick={resetToDefaults}
            className="text-sm text-gray-400 hover:text-red-500 underline"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tables dictionnaires */}
      {Object.entries(CATEGORY_LABELS).map(([category, { label, emoji }]) => (
        <section key={category}>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            {emoji} {label}
          </h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase border-b">
                <th className="pb-2 w-28">Abréviation</th>
                <th className="pb-2">Nom affiché</th>
                <th className="pb-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {dictionaries[category].map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  {editingItem?.category === category && editingItem?.index === index ? (
                    <>
                      <td className="py-2 pr-3">
                        <input
                          className="border rounded px-2 py-1 w-full text-sm font-mono"
                          value={editingItem.abrev}
                          onChange={e => setEditingItem({ ...editingItem, abrev: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveEdit()
                            if (e.key === 'Escape') setEditingItem(null)
                          }}
                          autoFocus
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          className="border rounded px-2 py-1 w-full text-sm"
                          value={editingItem.nom}
                          onChange={e => setEditingItem({ ...editingItem, nom: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveEdit()
                            if (e.key === 'Escape') setEditingItem(null)
                          }}
                        />
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="text-green-500 hover:text-green-700 text-lg font-bold"
                          >✓</button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                          >✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 pr-3 font-mono text-blue-600">{item.abrev}</td>
                      <td className="py-2 pr-3 text-gray-700">{item.nom}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem({ category, index, abrev: item.abrev, nom: item.nom })}
                            className="text-blue-400 hover:text-blue-600 text-base"
                            title="Modifier"
                          >✎</button>
                          <button
                            onClick={() => removeItem(category, index)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                            title="Supprimer"
                          >×</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ligne d'ajout */}
          <div className="flex gap-2 mt-3">
            <input
              className="border rounded px-3 py-2 text-sm w-28 font-mono"
              placeholder="abrev"
              value={newItems[category].abrev}
              onChange={e => setNewItems({
                ...newItems,
                [category]: { ...newItems[category], abrev: e.target.value },
              })}
              onKeyDown={e => e.key === 'Enter' && addItem(category)}
            />
            <input
              className="border rounded px-3 py-2 text-sm flex-1"
              placeholder="Nom affiché"
              value={newItems[category].nom}
              onChange={e => setNewItems({
                ...newItems,
                [category]: { ...newItems[category], nom: e.target.value },
              })}
              onKeyDown={e => e.key === 'Enter' && addItem(category)}
            />
            <button
              onClick={() => addItem(category)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Ajouter
            </button>
          </div>
        </section>
      ))}

      {/* ── Temps par défaut ────────────────────────────────── */}
      <section className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">⏱ Temps par défaut (pour 100m)</h3>
        <p className="text-xs text-gray-400 mb-3">
          Utilisé pour estimer la durée quand aucun intervalle n'est précisé
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Nage</th>
              <th className="pb-2">Temps / 100m</th>
            </tr>
          </thead>
          <tbody>
            {nages.map(nage => (
              <tr key={nage.abrev} className="border-b">
                <td className="py-2 font-medium text-gray-700">{nage.nom}</td>
                <td className="py-2">
                  <input
                    className="border rounded px-2 py-1 text-sm font-mono w-24"
                    placeholder="1:45"
                    value={tempsDefaut?.[nage.abrev] || ''}
                    onChange={e => onSaveTempsDefaut({
                      ...tempsDefaut,
                      [nage.abrev]: e.target.value,
                    })}
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-2 text-gray-400 italic">Défaut (toutes nages)</td>
              <td className="py-2">
                <input
                  className="border rounded px-2 py-1 text-sm font-mono w-24"
                  placeholder="2:00"
                  value={tempsDefaut?.['_defaut'] || ''}
                  onChange={e => onSaveTempsDefaut({
                    ...tempsDefaut,
                    _defaut: e.target.value,
                  })}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Export / Import ──────────────────────────────────── */}
      <section className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">💾 Données</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
          >
            📤 Exporter les séances
          </button>
          <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm cursor-pointer">
            📥 Importer
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      </section>

    </div>
  )
}
