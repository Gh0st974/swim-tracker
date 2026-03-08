import { useState, useEffect } from 'react'
import CalendarHeader    from './CalendarHeader'
import CalendarWeekView  from './CalendarWeekView'
import CalendarMonthView from './CalendarMonthView'
import WorkoutModal      from './WorkoutModal'
import NoteModal         from './NoteModal'
import { getLundiDeLaSemaine, getJoursDeLaSemaine } from './calendarUtils'

const STORAGE_KEY_NOTES = 'swim_notes'

function chargerNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES)) || []
  } catch {
    return []
  }
}

export default function Calendar({
  historique,
  nages, materiel, intensite,
  onSauvegarder,
  onSupprimer,
}) {
  const aujourd_hui = new Date()

  const [vue,          setVue]          = useState('semaine')
  const [annee,        setAnnee]        = useState(aujourd_hui.getFullYear())
  const [mois,         setMois]         = useState(aujourd_hui.getMonth())
  const [lundiSemaine, setLundiSemaine] = useState(() => getLundiDeLaSemaine(aujourd_hui))

  // Modal séance
  const [modal,     setModal]     = useState(null) // { date, seance }
  // Modal note
  const [modalNote, setModalNote] = useState(null) // { date, note }

  // Notes
  const [notes, setNotes] = useState(() => chargerNotes())

  // Persist notes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes))
  }, [notes])

  // ── Navigation ───────────────────────────────────────────────
  const onPrev = () => {
    if (vue === 'semaine') {
      setLundiSemaine(prev => {
        const d = new Date(prev); d.setDate(d.getDate() - 7); return d
      })
    } else {
      if (mois === 0) { setMois(11); setAnnee(a => a - 1) }
      else setMois(m => m - 1)
    }
  }

  const onNext = () => {
    if (vue === 'semaine') {
      setLundiSemaine(prev => {
        const d = new Date(prev); d.setDate(d.getDate() + 7); return d
      })
    } else {
      if (mois === 11) { setMois(0); setAnnee(a => a + 1) }
      else setMois(m => m + 1)
    }
  }

  const onAujourdhui = () => {
    const now = new Date()
    setAnnee(now.getFullYear())
    setMois(now.getMonth())
    setLundiSemaine(getLundiDeLaSemaine(now))
  }

  // ── Handlers séance ──────────────────────────────────────────
  const ouvrirNouvelleSeance = (date = aujourd_hui) => {
    setModal({ date, seance: null })
  }

  const ouvrirSeance = (seance) => {
    setModal({ date: new Date(seance.date), seance })
  }

  const handleSauvegarder = (payload, estModification) => {
    onSauvegarder(payload, estModification)
    setModal(null)
  }

  const handleSupprimer = (id) => {
    onSupprimer(id)
    setModal(null)
  }

  // ── Handlers note ────────────────────────────────────────────
  const ouvrirNote = (dateOuNote) => {
    if (dateOuNote?.type === 'note') {
      setModalNote({ date: new Date(dateOuNote.date), note: dateOuNote })
    } else {
      setModalNote({ date: dateOuNote, note: null })
    }
  }

  const handleSauvegarderNote = (payload) => {
    setNotes(prev => {
      const existe = prev.find(n => n.id === payload.id)
      return existe
        ? prev.map(n => n.id === payload.id ? payload : n)
        : [payload, ...prev]
    })
    setModalNote(null)
  }

  const handleSupprimerNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setModalNote(null)
  }

  // ── Handler contextuel (choix du menu) ───────────────────────
  const handleChoixMenu = (type, date) => {
    if (type === 'seance') ouvrirNouvelleSeance(date)
    if (type === 'note')   ouvrirNote(date)
  }

  const jours = getJoursDeLaSemaine(lundiSemaine)

  return (
    <div className="flex flex-col gap-4">

      <CalendarHeader
        vue={vue}
        setVue={setVue}
        annee={annee}
        mois={mois}
        lundiSemaine={lundiSemaine}
        onPrev={onPrev}
        onNext={onNext}
        onAujourdhui={onAujourdhui}
        onNouvelleSeance={() => ouvrirNouvelleSeance(aujourd_hui)}
      />

      {vue === 'semaine' ? (
        <CalendarWeekView
            jours={jours}
            historique={historique}
            notes={notes}                // ← ajout
            onJourClick={handleChoixMenu}
            onSeanceClick={ouvrirSeance}
            onNoteClick={ouvrirNote}     // ← ajout
        />
        ) : (
        <CalendarMonthView
          annee={annee}
          mois={mois}
          historique={historique}
          notes={notes}
          onJourClick={handleChoixMenu}
          onSeanceClick={ouvrirSeance}
          onNoteClick={ouvrirNote}
        />
      )}

      {/* Modal séance */}
      {modal && (
        <WorkoutModal
          date={modal.date}
          seance={modal.seance}
          nages={nages}
          materiel={materiel}
          intensite={intensite}
          onSauvegarder={handleSauvegarder}
          onSupprimer={handleSupprimer}
          onFermer={() => setModal(null)}
        />
      )}

      {/* Modal note */}
      {modalNote && (
        <NoteModal
          date={modalNote.date}
          note={modalNote.note}
          onSauvegarder={handleSauvegarderNote}
          onSupprimer={handleSupprimerNote}
          onFermer={() => setModalNote(null)}
        />
      )}

    </div>
  )
}
