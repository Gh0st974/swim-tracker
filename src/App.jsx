import { useState, useEffect, useRef, useCallback } from 'react'
import Settings from './Settings'
import Stats from './Stats'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import FormatToolbar from './FormatToolbar'
import { DEFAULT_NAGES, DEFAULT_MATERIEL, DEFAULT_INTENSITE, DEFAULT_TYPE } from './defaultDictionaries'
import { parseSeance } from './parser'
import BandeauLigneActive from './BandeauLigneActive'
import Favoris from './Favoris'
import Calendar from './Calendar'
import PageHistorique from './PageHistorique'
import PanneauStats from './PanneauStats'

function statsLigne(ligne) {
  if (!ligne) return null
  return {
    distance: ligne.distanceTotale,
    repetitions: ligne.repetitions,
    distanceUnitaire: ligne.distanceUnitaire,
  }
}

// Hook pour détecter la taille d'écran
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()

  const [onglet, setOnglet]               = useState('saisie')
  // Sur mobile : sidebar fermée par défaut
  const [sidebarOpen, setSidebarOpen]     = useState(() => window.innerWidth >= 768)
  const [texte, setTexte]                 = useState('')
  const [titre, setTitre]                 = useState('')
  const [dateSeance, setDateSeance]       = useState(() => new Date().toISOString().slice(0, 16))
  const [nages, setNages]                 = useState(() => JSON.parse(localStorage.getItem('nages'))      || DEFAULT_NAGES)
  const [materiel, setMateriel]           = useState(() => JSON.parse(localStorage.getItem('materiel'))   || DEFAULT_MATERIEL)
  const [intensite, setIntensite]         = useState(() => JSON.parse(localStorage.getItem('intensite'))  || DEFAULT_INTENSITE)
  const [typeExo, setTypeExo]             = useState(() => JSON.parse(localStorage.getItem('typeExo'))    || DEFAULT_TYPE)
  const [historique, setHistorique]       = useState(() => JSON.parse(localStorage.getItem('historique')) || [])
  const [favoris, setFavoris]             = useState(() => JSON.parse(localStorage.getItem('favoris'))    || [])
  const [ligneCurseur, setLigneCurseur]   = useState(null)
  const [seanceEnEdition, setSeanceEnEdition] = useState(null)
  const [tempsDefaut, setTempsDefaut]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('swim_tempsDefaut')) || { _defaut: '2:00' } }
    catch { return { _defaut: '2:00' } }
  })
  const editorRef = useRef(null)

  const resultat = texte.trim()
    ? parseSeance(texte, { nages, materiel, intensite, typeExo }, tempsDefaut)
    : null

  const ligneActive   = resultat?.lignesParsees?.[ligneCurseur] ?? null
  const statsActive   = statsLigne(ligneActive)
  const statsGlobales = resultat
    ? { totalDistance: resultat.totalDistance, totalTemps: resultat.totalTemps }
    : null

  // Fermer sidebar auto sur mobile quand on change d'onglet
  const handleNavigate = (page) => {
    setOnglet(page)
    if (isMobile) setSidebarOpen(false)
  }

  // Fermer sidebar sur mobile quand on clique toggle
  const handleToggleSidebar = () => {
    setSidebarOpen(o => !o)
  }

  useEffect(() => { localStorage.setItem('historique',        JSON.stringify(historique))  }, [historique])
  useEffect(() => { localStorage.setItem('favoris',           JSON.stringify(favoris))     }, [favoris])
  useEffect(() => { localStorage.setItem('nages',             JSON.stringify(nages))       }, [nages])
  useEffect(() => { localStorage.setItem('materiel',          JSON.stringify(materiel))    }, [materiel])
  useEffect(() => { localStorage.setItem('intensite',         JSON.stringify(intensite))   }, [intensite])
  useEffect(() => { localStorage.setItem('typeExo',           JSON.stringify(typeExo))     }, [typeExo])
  useEffect(() => { localStorage.setItem('swim_tempsDefaut',  JSON.stringify(tempsDefaut)) }, [tempsDefaut])

  const handleCursorMove = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0).cloneRange()
    range.setStart(editorRef.current, 0)
    const offsetTotal = range.toString().length
    const texteActuel = editorRef.current.innerText
    const lignes = texteActuel.split('\n')
    let cumul = 0
    let numeroLigneBrute = 0
    for (let i = 0; i < lignes.length; i++) {
      const longueur = lignes[i].length
      if (offsetTotal <= cumul + longueur) { numeroLigneBrute = i; break }
      cumul += longueur + 1
      numeroLigneBrute = i
    }
    const ligneBrute = lignes[numeroLigneBrute]
    if (!ligneBrute || ligneBrute.trim() === '') { setLigneCurseur(null); return }
    if (!resultat?.lignesParsees) { setLigneCurseur(null); return }
    const texteNormalise = ligneBrute.trim().toLowerCase()
    const idx = resultat.lignesParsees.findIndex(l => {
      const orig = (l.texteOriginal || '').trim().toLowerCase()
      return orig === texteNormalise || orig.startsWith(texteNormalise) || texteNormalise.startsWith(orig)
    })
    setLigneCurseur(idx >= 0 ? idx : null)
  }, [resultat])

  const resetSaisie = () => {
    setTexte(''); setTitre('')
    setDateSeance(new Date().toISOString().slice(0, 16))
    setLigneCurseur(null); setSeanceEnEdition(null)
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  const sauvegarderSeance = () => {
    if (!resultat || resultat.totalDistance === 0) return
    const payload = {
      id:             seanceEnEdition || Date.now(),
      titre:          titre.trim() || 'Séance sans titre',
      date:           dateSeance,
      texte,
      html:           editorRef.current?.innerHTML || '',
      totalDistance:  resultat.totalDistance,
      totalTemps:     resultat.totalTemps,
      statsNages:     resultat.statsNages     || {},
      statsMateriel:  resultat.statsMateriel  || {},
      statsIntensite: resultat.statsIntensite || {},
      statsTypeExo:   resultat.statsTypeExo   || {},
    }
    if (seanceEnEdition) {
      setHistorique(prev => prev.map(s => s.id === seanceEnEdition ? payload : s))
    } else {
      setHistorique(prev => [payload, ...prev])
    }
    resetSaisie()
    setOnglet('historique')
  }

  const modifierSeance = (s) => {
    setTexte(s.texte); setTitre(s.titre || '')
    setDateSeance(s.date ? new Date(s.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
    setSeanceEnEdition(s.id); setOnglet('saisie')
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = s.html || s.texte.replace(/\n/g, '<br/>')
    }, 50)
  }

  const dupliquerSeance = (s) => {
    setTexte(s.texte); setTitre((s.titre || '') + ' (copie)')
    setDateSeance(new Date().toISOString().slice(0, 16))
    setSeanceEnEdition(null); setOnglet('saisie')
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = s.html || s.texte.replace(/\n/g, '<br/>')
    }, 50)
  }

  const supprimerSeance = (id) => setHistorique(prev => prev.filter(s => s.id !== id))

  const ajouterFavoriSeance = () => {
    if (!resultat || resultat.totalDistance === 0) return
    setFavoris(prev => [{
      id: Date.now(), type: 'seance',
      titre: titre.trim() || 'Séance sans titre',
      texte, html: editorRef.current?.innerHTML || '',
      totalDistance: resultat.totalDistance,
    }, ...prev])
  }

  const ajouterFavoriSerie = () => {
    if (!ligneActive) return
    setFavoris(prev => [{
      id: Date.now(), type: 'serie',
      titre: ligneActive.texteOriginal?.trim() || 'Série',
      texte: ligneActive.texteOriginal?.trim() || '',
      totalDistance: ligneActive.distanceTotale,
    }, ...prev])
  }

  const supprimerFavori   = (id)     => setFavoris(prev => prev.filter(f => f.id !== id))
  const sauvegarderFavori = (favori) => setFavoris(prev => prev.map(f => f.id === favori.id ? favori : f))

  const chargerFavoriSeance = (fav) => {
    setTexte(fav.texte); setTitre(fav.titre || '')
    setDateSeance(new Date().toISOString().slice(0, 16))
    setSeanceEnEdition(null); setOnglet('saisie')
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = fav.html || fav.texte.replace(/\n/g, '<br/>')
    }, 50)
  }

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return
    setTexte(editorRef.current.innerText)
    handleCursorMove()
  }, [handleCursorMove])

  const handleSaveTempsDefaut = (val) => setTempsDefaut(val)

  // ── Calcul du margin-left du main ────────────────────────────
  // Sur mobile : pas de margin (sidebar en overlay)
  // Sur desktop : margin selon sidebar ouverte ou non
  const mainMarginLeft = isMobile
    ? '0px'
    : sidebarOpen ? '240px' : '64px'

  const renderPage = () => {
    switch (onglet) {

      case 'saisie': return (
        // MOBILE : flex-col (empilé) | DESKTOP : flex-row (côte à côte)
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

          {/* Colonne principale — 100% mobile, 55% desktop */}
          <div className="flex flex-col gap-4 w-full lg:flex-[55]">

            {seanceEnEdition && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-blue-700 font-medium">✏️ Modification en cours</span>
                <button
                  onClick={() => { resetSaisie(); setOnglet('historique') }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >Annuler</button>
              </div>
            )}

            {/* Titre + Date : colonne sur mobile, ligne sur desktop */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Titre de la séance"
                value={titre}
                onChange={e => setTitre(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm outline-none focus:border-[#1d83ea] focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="datetime-local"
                value={dateSeance}
                onChange={e => setDateSeance(e.target.value)}
                className="w-full sm:w-auto border border-gray-200 rounded-xl px-4 py-2.5 text-sm shadow-sm outline-none focus:border-[#1d83ea] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <FormatToolbar editorRef={editorRef} onChange={handleEditorInput} />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onInput={handleEditorInput}
                onClick={handleCursorMove}
                onKeyUp={handleCursorMove}
                data-placeholder={"Echauffement:\n    400 nl a1\n    4x50 4n a1\n\nCorps:\n    8x100 nl a2 @1:30\n\nRécup:\n    200 nl souple"}
                className="w-full p-4 font-mono text-sm outline-none leading-relaxed min-h-[260px] md:min-h-[320px]"
              />
              <BandeauLigneActive ligne={ligneActive} />
            </div>

            {resultat && resultat.totalDistance > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={sauvegarderSeance}
                  className="flex-1 bg-[#1d83ea] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow text-sm"
                >
                  {seanceEnEdition ? '✏️ Mettre à jour' : '💾 Sauvegarder'}
                </button>
                {!seanceEnEdition && (
                  <button
                    onClick={ajouterFavoriSeance}
                    className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-600 font-semibold py-3 px-5 rounded-xl transition text-sm"
                  >⭐ Favori</button>
                )}
              </div>
            )}
          </div>

          {/* Colonne stats — 100% mobile (en bas), 45% desktop (sticky) */}
          <div className="w-full lg:flex-[45] lg:self-start lg:sticky lg:top-20">
            {resultat ? (
              <PanneauStats
                data={statsGlobales}
                statsNages={resultat.statsNages     || {}}
                statsMateriel={resultat.statsMateriel || {}}
                statsIntensite={resultat.statsIntensite || {}}
                statsTypeExo={resultat.statsTypeExo   || {}}
              />
            ) : (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center">
                <div className="text-3xl mb-2">🏊</div>
                <div className="text-sm text-gray-300">Les stats apparaîtront ici</div>
              </div>
            )}
          </div>
        </div>
      )

      case 'calendrier': return (
        <Calendar
          historique={historique}
          nages={nages} materiel={materiel}
          intensite={intensite} typeExo={typeExo}
          onSauvegarder={(payload, estModification) => {
            if (estModification) setHistorique(prev => prev.map(s => s.id === payload.id ? payload : s))
            else setHistorique(prev => [payload, ...prev])
          }}
          onSupprimer={supprimerSeance}
        />
      )

      case 'historique': return (
        <PageHistorique
          historique={historique}
          modifierSeance={modifierSeance}
          dupliquerSeance={dupliquerSeance}
          supprimerSeance={supprimerSeance}
        />
      )

      case 'stats': return <Stats historique={historique} />

      case 'favoris': return (
        <Favoris
          favoris={favoris}
          onChargerSeance={chargerFavoriSeance}
          onSupprimerFavori={supprimerFavori}
          onSauvegarderFavori={sauvegarderFavori}
        />
      )

      case 'parametres': return (
        <Settings
          nages={nages} materiel={materiel}
          intensite={intensite} typeExo={typeExo}
          tempsDefaut={tempsDefaut}
          onSaveTempsDefaut={handleSaveTempsDefaut}
          onUpdate={(category, items) => {
            if (category === 'nages')     setNages(items)
            if (category === 'materiel')  setMateriel(items)
            if (category === 'intensite') setIntensite(items)
            if (category === 'typeExo')   setTypeExo(items)
          }}
          historique={historique}
          onImport={setHistorique}
        />
      )

      default: return null
    }
  }

  // ✅ handleCloseSidebar AVANT le return, pas dedans
  const handleCloseSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        onToggleSidebar={handleToggleSidebar}
        onOpenSettings={() => handleNavigate('parametres')}
      />

      <Sidebar
        isOpen={sidebarOpen}
        activePage={onglet}
        onNavigate={handleNavigate}
        onClose={handleCloseSidebar}
      />

      <main
        className="pt-14 transition-all duration-300"
        style={{ marginLeft: mainMarginLeft }}
      >
        <div className="p-3 md:p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}  // ← accolade fermante de export default function App()

