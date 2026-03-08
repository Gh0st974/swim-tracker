// ─────────────────────────────────────────────
// UTILITAIRES TEMPS
// ─────────────────────────────────────────────

function tempsEnSecondes(str) {
  if (!str) return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0)
  return parts[0] || 0
}

function secondsEnTemps(sec) {
  if (!sec || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─────────────────────────────────────────────
// RÉSOLUTION DE TOKENS → entités
// ─────────────────────────────────────────────

function resolveToken(token, config) {
  const t = token.toLowerCase().trim()
  if (!t) return null
  const { nages, materiel, intensite, typeExo } = config

  const nage = nages.find(n => n.abrev.toLowerCase() === t)
  if (nage) return { kind: 'nage', nom: nage.nom, abrev: t }

  const intens = intensite.find(i => i.abrev.toLowerCase() === t)
  if (intens) return { kind: 'intensite', nom: intens.nom, abrev: t }

  if (t === 'pl') return { kind: 'double_pl', materielNom: 'Planche', typeNom: 'Jambes' }

  const mat = materiel.find(m => m.abrev.toLowerCase() === t && t !== 'pl')
  if (mat) return { kind: 'materiel', nom: mat.nom, abrev: t }

  const type = typeExo.find(ty => ty.abrev.toLowerCase() === t)
  if (type) return { kind: 'typeExo', nom: type.nom, abrev: t }

  return null
}

// ─────────────────────────────────────────────
// RÉSOLUTION D'UN ENSEMBLE DE TOKENS → qualificatifs
// ─────────────────────────────────────────────

function resolveQualificatifs(tokens, config) {
  let nage = null
  let intensite = null
  let typeExo = null
  let materiel = []

  for (const token of tokens) {
    const r = resolveToken(token, config)
    if (!r) continue
    if (r.kind === 'nage' && !nage) nage = r.nom
    else if (r.kind === 'intensite' && !intensite) intensite = r.nom
    else if (r.kind === 'double_pl') {
      if (!materiel.includes('Planche')) materiel.push('Planche')
      if (!typeExo) typeExo = 'Jambes'
    }
    else if (r.kind === 'materiel') {
      if (!materiel.includes(r.nom)) materiel.push(r.nom)
    }
    else if (r.kind === 'typeExo' && !typeExo) typeExo = r.nom
  }

  return { nage, intensite, typeExo, materiel }
}

// ─────────────────────────────────────────────
// CLASSIFICATION DES TOKENS D'UN RESTE
// ─────────────────────────────────────────────

function classifierTokens(tokens, config) {
  const nageTokens    = []
  const intensTokens  = []
  const typeExoTokens = []
  const communsTokens = []

  for (const t of tokens) {
    const r = resolveToken(t, config)
    if (!r) continue
    if (r.kind === 'nage')                          nageTokens.push(t)
    else if (r.kind === 'intensite')                intensTokens.push(t)
    else if (r.kind === 'typeExo')                  typeExoTokens.push(t)
    else if (r.kind === 'materiel' || r.kind === 'double_pl') communsTokens.push(t)
  }

  return { nageTokens, intensTokens, typeExoTokens, communsTokens }
}

// ─────────────────────────────────────────────
// CONSTRUCTION DES SUBDIVISIONS DEPUIS UNE SÉRIE
// Gère toutes les combinaisons connues
// ─────────────────────────────────────────────

function construireSubdivisions(reps, distUnitaire, tokens, config) {
  const { nageTokens, intensTokens, typeExoTokens, communsTokens } = classifierTokens(tokens, config)
  const qualifCommuns = resolveQualificatifs(communsTokens, config)

  // ── Cas 1 : multi-nages → répartition équitable
  // ex: 6x50 cr pap  →  150 Crawl + 150 Papillon
  // ex: 6x50 pap dos br  →  100 Pap + 100 Dos + 100 Brasse
  if (nageTokens.length > 1) {
    const distParNage = (distUnitaire * reps) / nageTokens.length
    return nageTokens.map(t => {
      const r = resolveToken(t, config)
      return {
        distance: distParNage,
        nage: r.nom,
        intensite: qualifCommuns.intensite,
        typeExo: qualifCommuns.typeExo,
        materiel: qualifCommuns.materiel,
        label: `${distParNage} ${r.nom}`,
      }
    })
  }

  const nageCommune = nageTokens.length === 1
    ? resolveToken(nageTokens[0], config)?.nom
    : null

  // ── Cas 2 : typeExo séquentiels = reps
  // ex: 3x100 4n jbs educ nc  →  100 4Nages Jambes + 100 4Nages Educ + 100 4Nages NC
  if (typeExoTokens.length === reps) {
    const intensiteCommune = resolveQualificatifs(intensTokens, config).intensite
    return Array.from({ length: reps }, (_, i) => {
      const r = resolveToken(typeExoTokens[i], config)
      return {
        distance: distUnitaire,
        nage: nageCommune,
        intensite: intensiteCommune,
        typeExo: r?.nom || null,
        materiel: qualifCommuns.materiel,
        label: `${distUnitaire} ${nageCommune || ''} ${typeExoTokens[i]}`.trim(),
      }
    })
  }

  // ── Cas 3 : intensités séquentielles = reps
  // ex: 4x100 cr z1 z2 z3 z4
  if (intensTokens.length === reps) {
    const typeExoCommun = resolveQualificatifs(typeExoTokens, config).typeExo
    return Array.from({ length: reps }, (_, i) => {
      const r = resolveToken(intensTokens[i], config)
      return {
        distance: distUnitaire,
        nage: nageCommune,
        intensite: r?.nom || null,
        typeExo: typeExoCommun,
        materiel: qualifCommuns.materiel,
        label: `${distUnitaire} ${nageCommune || ''} ${intensTokens[i]}`.trim(),
      }
    })
  }

  // ── Cas 4 : nages séquentielles = reps (1 nage différente par rep)
  // ex: 4x100 cr dos br 4n
  if (nageTokens.length === reps) {
    const intensiteCommune = resolveQualificatifs(intensTokens, config).intensite
    const typeExoCommun    = resolveQualificatifs(typeExoTokens, config).typeExo
    return Array.from({ length: reps }, (_, i) => {
      const r = resolveToken(nageTokens[i], config)
      return {
        distance: distUnitaire,
        nage: r?.nom || null,
        intensite: intensiteCommune,
        typeExo: typeExoCommun,
        materiel: qualifCommuns.materiel,
        label: `${distUnitaire} ${nageTokens[i]}`.trim(),
      }
    })
  }

  // ── Fallback : qualificatifs communs pour toutes les reps
  const qualifAll = resolveQualificatifs(tokens, config)
  return Array.from({ length: reps }, () => ({
    distance: distUnitaire,
    nage: qualifAll.nage,
    intensite: qualifAll.intensite,
    typeExo: qualifAll.typeExo,
    materiel: qualifAll.materiel,
    label: `${distUnitaire} ${qualifAll.nage || ''}`.trim(),
  }))
}

// ─────────────────────────────────────────────
// PARSER D'UN GROUPE (utilisé par parseChecksum)
// "3x100 cr z1 z2 z3" ou "600 cr pl"
// ─────────────────────────────────────────────

function parseGroupe(texte, config) {
  texte = texte.trim()
  if (!texte) return []

  const matchGroupe = texte.match(/^(\d+)\s*[x×]\s*(\d+)\s*(.*)/i)

  if (!matchGroupe) {
    const matchSimple = texte.match(/^(\d+)\s*(.*)/)
    if (!matchSimple) return []
    const distance = parseInt(matchSimple[1])
    const tokens = matchSimple[2].trim().split(/\s+/).filter(Boolean)
    const qualifs = resolveQualificatifs(tokens, config)
    return [{
      distance,
      nage: qualifs.nage,
      intensite: qualifs.intensite,
      typeExo: qualifs.typeExo,
      materiel: qualifs.materiel,
      label: texte.trim(),
    }]
  }

  const reps = parseInt(matchGroupe[1])
  const distUnitaire = parseInt(matchGroupe[2])
  const tokens = matchGroupe[3].trim().split(/\s+/).filter(Boolean)

  return construireSubdivisions(reps, distUnitaire, tokens, config)
}

// ─────────────────────────────────────────────
// PARSE CHECKSUM : "1200 (3x100 cr z1 z2 z3  600 cr pl)"
// ─────────────────────────────────────────────

function parseChecksum(ligne, config) {
  const matchChecksum = ligne.match(/^(\d+)\s*\((.+)\)\s*(?:\[([^\]]*)\])?$/i)
  if (!matchChecksum) return null

  const distanceDeclaree = parseInt(matchChecksum[1])
  const contenu = matchChecksum[2]
  const bracketContent = matchChecksum[3] || null

  const groupesTexte = contenu
    .split(/(?=\b\d+\s*[x×]\s*\d+|\b\d{2,4}\b(?!\s*[x×]))/)
    .map(s => s.trim())
    .filter(Boolean)

  const subdivisions = []
  let distanceCalculee = 0

  for (const gTexte of groupesTexte) {
    const subs = parseGroupe(gTexte, config)
    for (const sub of subs) {
      distanceCalculee += sub.distance
      subdivisions.push(sub)
    }
  }

  let intervalle = null
  let rest = null
  if (bracketContent) {
    const mInt  = bracketContent.match(/d[eé]part\s*(\d+:\d+)/i)
    const mRest = bracketContent.match(/rest\s+(\d+:\d+)/i)
    if (mInt)  intervalle = mInt[1]
    if (mRest) rest = mRest[1]
  }

  return {
    isChecksum: true,
    distanceDeclaree,
    distanceCalculee,
    checksumOk: distanceCalculee === distanceDeclaree,
    distanceTotale: distanceDeclaree,
    subdivisions,
    intervalle,
    rest,
    repetitions: 1,
    multiplicateur: 1,
    nages: [],
    materiel: [],
    intensite: null,
    typeExo: null,
  }
}

// ─────────────────────────────────────────────
// PARSE D'UNE LIGNE STANDARD
// ─────────────────────────────────────────────

function parseLigne(ligne, config) {
  ligne = ligne.trim()
  if (!ligne) return null

  // ── Extraction bracket [départ 1:30] ou [rest 0:20]
  let intervalle = null
  let rest = null
  const bracketMatch = ligne.match(/\[([^\]]+)\]/i)
  if (bracketMatch) {
    const bContent = bracketMatch[1]
    const mInt  = bContent.match(/d[eé]part\s*(\d+:\d+)/i)
    const mRest = bContent.match(/rest\s+(\d+:\d+)/i)
    if (mInt)  intervalle = mInt[1]
    if (mRest) rest = mRest[1]
    ligne = ligne.replace(/\[[^\]]+\]/g, '').trim()
  }

  // ── Checksum "1200 (...)"
  if (/^\d+\s*\(/.test(ligne)) {
    const cs = parseChecksum(ligne, config)
    if (cs) return { ...cs, intervalle: cs.intervalle || intervalle, rest: cs.rest || rest }
  }

  // ── Série "NxM qualificatifs"
  const matchRep = ligne.match(/^(\d+)\s*[x×]\s*(\d+)\s*(.*)/i)
  if (matchRep) {
    const reps         = parseInt(matchRep[1])
    const distUnitaire = parseInt(matchRep[2])
    const tokens       = matchRep[3].trim().split(/\s+/).filter(Boolean)

    const subdivisions = construireSubdivisions(reps, distUnitaire, tokens, config)

    // Agréger les nages depuis les subdivisions
    const nagesMap = {}
    for (const sub of subdivisions) {
      if (sub.nage) nagesMap[sub.nage] = (nagesMap[sub.nage] || 0) + sub.distance
    }
    const nages = Object.entries(nagesMap).map(([nom, distance]) => ({ nom, distance }))

    // Qualifs globaux pour materiel/intensite/typeExo si pas dans subdivisions
    const qualifAll = resolveQualificatifs(tokens, config)

    // Est-ce que toutes les subs ont la même intensite/typeExo ?
    const toutesMemesIntens = subdivisions.every(s => s.intensite === subdivisions[0].intensite)
    const toutesMemeType    = subdivisions.every(s => s.typeExo   === subdivisions[0].typeExo)

    return {
      repetitions:      reps,
      distanceUnitaire: distUnitaire,
      distanceTotale:   reps * distUnitaire,
      nages,
      materiel:   qualifAll.materiel,
      intensite:  toutesMemesIntens ? subdivisions[0].intensite : null,
      typeExo:    toutesMemeType    ? subdivisions[0].typeExo   : null,
      intervalle,
      rest,
      multiplicateur: 1,
      subdivisions,
      texteOriginal: ligne,
    }
  }

  // ── Distance simple "400 cr z1"
  const matchDist = ligne.match(/^(\d+)\s*(.*)/)
  if (matchDist) {
    const distance = parseInt(matchDist[1])
    const tokens   = matchDist[2].trim().split(/\s+/).filter(Boolean)
    const qualif   = resolveQualificatifs(tokens, config)

    return {
      repetitions:      1,
      distanceUnitaire: distance,
      distanceTotale:   distance,
      nages:    qualif.nage ? [{ nom: qualif.nage, distance }] : [],
      materiel: qualif.materiel,
      intensite: qualif.intensite,
      typeExo:  qualif.typeExo,
      intervalle,
      rest,
      multiplicateur: 1,
      subdivisions: [],
      texteOriginal: ligne,
    }
  }

  return null
}

// ─────────────────────────────────────────────
// PARSE COMPLET D'UNE SÉANCE
// ─────────────────────────────────────────────

export function parseSeance(texte, config, tempsDefaut = {}) {
  if (!texte?.trim()) return {
    lignesParsees: [], totalDistance: 0, totalTemps: '0:00',
    statsNages: {}, statsMateriel: {}, statsIntensite: {}, statsTypeExo: {},
  }

  const { nages = [], materiel = [], intensite = [], typeExo = [] } = config

  const labelsBlocs = [
    'échauffement', 'echauffement', 'corps', 'récupération', 'recuperation',
    'retour au calme', 'principal', 'technique', 'sprint', 'endurance',
  ]

  const lignesBrutes = texte.split('\n')
  const lignesParsees = []
  let totalDistance = 0
  let totalSecondes = 0
  const statsNages     = {}
  const statsMateriel  = {}
  const statsIntensite = {}
  const statsTypeExo   = {}

  let blocCourant        = null
  let multiplicateurBloc = 1
  let indentBloc         = null
  let parentBlocIdx      = null

  for (let i = 0; i < lignesBrutes.length; i++) {
    const ligneRaw = lignesBrutes[i]
    const ligne    = ligneRaw.trim()

    if (!ligne) continue
    if (ligne.startsWith('//')) continue

    // ── Multiplicateur bloc seul "3x"
    const multSeulMatch = ligne.match(/^(\d+)\s*[x×]\s*$/)
    if (multSeulMatch) {
      multiplicateurBloc = parseInt(multSeulMatch[1])
      indentBloc    = ligneRaw.search(/\S/)
      parentBlocIdx = lignesParsees.length
      lignesParsees.push({
        isParentBloc: true,
        repetitions: multiplicateurBloc,
        distanceTotale: 0,
        distanceUnitaire: null,
        nages: [], materiel: [], intensite: null, typeExo: null,
        subdivisions: [], intervalle: null, rest: null,
        dureeTotale: null, _totalSecondes: 0,
        bloc: blocCourant,
        texteOriginal: ligne,
        multiplicateur: multiplicateurBloc,
      })
      continue
    }

    // ── Fin de bloc multiplicateur si retour à l'indentation parent
    if (multiplicateurBloc > 1 && indentBloc !== null) {
      const indentLigne = ligneRaw.search(/\S/)
      if (indentLigne <= indentBloc) {
        multiplicateurBloc = 1
        indentBloc    = null
        parentBlocIdx = null
      }
    }

    // ── Multiplicateur inline "3x (contenu)"
    let ligneEffective  = ligne
    let multInlineMatch = null
    const _multInline   = ligne.match(/^(\d+)\s*[x×]\s*\((.+)\)$/i)
    if (_multInline) {
      multInlineMatch    = _multInline
      multiplicateurBloc = parseInt(_multInline[1])
      ligneEffective     = _multInline[2]
      indentBloc    = null
      parentBlocIdx = null
    }

    // ── Titre de bloc avec contenu inline "Échauffement: 400 cr"
    const prefixMatch = ligneEffective.match(/^([^:]+):\s*(.+)/)
    if (prefixMatch) {
      const prefix = prefixMatch[1].trim().toLowerCase()
      if (labelsBlocs.some(lb => prefix.includes(lb))) {
        blocCourant    = prefixMatch[1].trim()
        ligneEffective = prefixMatch[2].trim()
      }
    }

    // ── Titre de bloc seul "Échauffement:"
    if (/^[A-ZÉÈÊÀa-zéèêà][^:\d(x×]*:?\s*$/.test(ligneEffective)) {
      const label = ligneEffective.replace(/:$/, '').trim().toLowerCase()
      if (labelsBlocs.some(lb => label.includes(lb))) {
        blocCourant        = ligneEffective.replace(/:$/, '').trim()
        multiplicateurBloc = 1
        indentBloc    = null
        parentBlocIdx = null
        continue
      }
    }

    // ── Parse de la ligne
    let parsed
    try {
      parsed = parseLigne(ligneEffective, { nages, materiel, intensite, typeExo })
    } catch (e) {
      console.error('parseLigne error:', e, ligneEffective)
      continue
    }
    if (!parsed) continue

    if (!parsed.bloc && blocCourant) parsed.bloc = blocCourant

    // ── Application du multiplicateur de bloc
    const estEnfantDeBloc = multiplicateurBloc > 1 && indentBloc !== null

    if (estEnfantDeBloc) {
      parsed.distanceUnitaireSansBloc = parsed.distanceTotale
      parsed.repetitions       *= multiplicateurBloc
      parsed.multiplicateurBloc = multiplicateurBloc
      parsed.multiplicateur     = multiplicateurBloc
      parsed.distanceTotale    *= multiplicateurBloc
      parsed.nages = parsed.nages.map(n => ({ ...n, distance: n.distance * multiplicateurBloc }))
      if (parsed.subdivisions?.length > 0) {
        const orig = parsed.subdivisions
        parsed.subdivisions = Array.from({ length: multiplicateurBloc }, () =>
          orig.map(s => ({ ...s }))
        ).flat()
      }
    }

    // ── Calcul durée
    let dureeTotale = null
    if (parsed.intervalle) {
      const sec = tempsEnSecondes(parsed.intervalle) * parsed.repetitions
      dureeTotale    = secondsEnTemps(sec)
      totalSecondes += sec
    } else if (parsed.distanceTotale > 0) {
      const nageNom    = parsed.nages?.[0]?.nom || null
      const nageConfig = nageNom ? nages.find(n => n.nom === nageNom) : null
      const nageAbrev  = nageConfig?.abrev?.toLowerCase() || null
      const tempsStr   = (nageAbrev && tempsDefaut[nageAbrev]) || tempsDefaut['_defaut'] || null
      if (tempsStr) {
        const secPour100 = tempsEnSecondes(tempsStr)
        if (secPour100 > 0) {
          const secEstime = Math.round((parsed.distanceTotale / 100) * secPour100)
          dureeTotale    = `~${secondsEnTemps(secEstime)}`
          totalSecondes += secEstime
        }
      }
    }
    parsed.dureeTotale = dureeTotale

    // ── Agrégation vers le parent bloc
    if (estEnfantDeBloc && parentBlocIdx !== null) {
      const parent = lignesParsees[parentBlocIdx]
      parent.distanceTotale += parsed.distanceTotale

      if (parsed.dureeTotale) {
        const secEnfant = tempsEnSecondes(parsed.dureeTotale.replace('~', ''))
        parent._totalSecondes = (parent._totalSecondes || 0) + secEnfant
        const prefixe = (parent.dureeTotale?.startsWith('~') || parsed.dureeTotale.startsWith('~')) ? '~' : ''
        parent.dureeTotale = `${prefixe}${secondsEnTemps(parent._totalSecondes)}`
      }

      for (const n of parsed.nages) {
        const existing = parent.nages.find(pn => pn.nom === n.nom)
        if (existing) existing.distance += n.distance
        else parent.nages.push({ ...n })
      }

      for (const m of parsed.materiel) {
        if (!parent.materiel.includes(m)) parent.materiel.push(m)
      }

      if (parsed.typeExo && !parent.typeExo) parent.typeExo = parsed.typeExo

      const subsAAjouter = parsed.subdivisions?.length
        ? parsed.subdivisions
        : [{
            distance:  parsed.distanceTotale,
            nage:      parsed.nages?.[0]?.nom || null,
            intensite: parsed.intensite,
            typeExo:   parsed.typeExo,
            materiel:  parsed.materiel,
          }]
      for (const sub of subsAAjouter) parent.subdivisions.push({ ...sub })
    }

    // ── Reset multiplicateur inline
    if (multInlineMatch) {
      multiplicateurBloc = 1
      indentBloc    = null
      parentBlocIdx = null
    }

    // ── Alimentation des stats
    if (parsed.distanceTotale > 0) {
      totalDistance += parsed.distanceTotale

      const subsStats = parsed.subdivisions?.length
        ? parsed.subdivisions
        : parsed.nages.map(n => ({
            distance:  n.distance,
            nage:      n.nom,
            intensite: parsed.intensite,
            typeExo:   parsed.typeExo,
            materiel:  parsed.materiel,
          }))

      for (const sub of subsStats) {
        const d = sub.distance || 0
        if (sub.nage)      statsNages[sub.nage]          = (statsNages[sub.nage]          || 0) + d
        if (sub.typeExo)   statsTypeExo[sub.typeExo]     = (statsTypeExo[sub.typeExo]     || 0) + d
        if (sub.intensite) statsIntensite[sub.intensite] = (statsIntensite[sub.intensite] || 0) + d
        for (const m of (sub.materiel || [])) statsMateriel[m] = (statsMateriel[m] || 0) + d
      }

      // Si aucune sub et aucune nage (materiel/typeExo seuls)
      if (subsStats.length === 0) {
        if (parsed.typeExo)   statsTypeExo[parsed.typeExo]     = (statsTypeExo[parsed.typeExo]     || 0) + parsed.distanceTotale
        if (parsed.intensite) statsIntensite[parsed.intensite] = (statsIntensite[parsed.intensite] || 0) + parsed.distanceTotale
        for (const m of parsed.materiel) statsMateriel[m] = (statsMateriel[m] || 0) + parsed.distanceTotale
      }
    }

    lignesParsees.push({ ...parsed, dureeTotale })
  }

  return {
    lignesParsees,
    totalDistance,
    totalTemps: secondsEnTemps(totalSecondes),
    statsNages,
    statsMateriel,
    statsIntensite,
    statsTypeExo,
  }
}
