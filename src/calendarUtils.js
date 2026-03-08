// ── Couleurs par type (modifiez ici facilement) ──────────────────
export const WORKOUT_COLORS = {
  practice:    { bg: '#3B82F6', label: 'Entraînement' },
  competition: { bg: '#EF4444', label: 'Compétition'  },
  rest:        { bg: '#9CA3AF', label: 'Repos'        },
  other:       { bg: '#8B5CF6', label: 'Autre'        },
}

export const JOURS_SEMAINE  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
export const MOIS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]

export function getLundiDeLaSemaine(date) {
  const d = new Date(date)
  const jour = d.getDay()
  const diff = jour === 0 ? -6 : 1 - jour
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getJoursDeLaSemaine(lundi) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function getSemainesDuMois(annee, mois) {
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)
  const lundi = getLundiDeLaSemaine(premierJour)
  const semaines = []
  let courant = new Date(lundi)
  while (courant <= dernierJour) {
    semaines.push(getJoursDeLaSemaine(new Date(courant)))
    courant.setDate(courant.getDate() + 7)
  }
  return semaines
}

export function memeJour(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

export function getSeancesDuJour(historique, date) {
  return historique.filter(s => memeJour(new Date(s.date), date))
}

export function getSeancesDeLaSemaine(historique, jours) {
  return historique.filter(s =>
    jours.some(j => memeJour(new Date(s.date), j))
  )
}

export function formatDateFR(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function calculerSummaryHebdo(seances) {
  if (!seances.length) return null

  const totalDistance = seances.reduce((acc, s) => acc + (s.totalDistance || 0), 0)
  const totalSecondes = seances.reduce((acc, s) => {
    if (!s.totalTemps || s.totalTemps === '0:00') return acc
    const parts = s.totalTemps.split(':')
    if (parts.length === 2) return acc + parseInt(parts[0]) * 60 + parseInt(parts[1])
    if (parts.length === 3) return acc + parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    return acc
  }, 0)

  const h = Math.floor(totalSecondes / 3600)
  const m = Math.floor((totalSecondes % 3600) / 60)
  const totalTemps = totalSecondes > 0
    ? (h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m}min`)
    : null

  const moyenneDistance = Math.round(totalDistance / seances.length)

  // Nage dominante
  const allNages = {}
  seances.forEach(s => {
    if (s.statsNages) {
      Object.entries(s.statsNages).forEach(([nom, dist]) => {
        allNages[nom] = (allNages[nom] || 0) + dist
      })
    }
  })
  const nageDominante = Object.keys(allNages).length
    ? Object.entries(allNages).sort((a, b) => b[1] - a[1])[0][0]
    : null

  return { totalDistance, totalTemps, moyenneDistance, nageDominante, nbSeances: seances.length }
}
