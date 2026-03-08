import { COULEURS_NAGES, COULEURS_MAT, COULEURS_INT, COULEURS_TYPE } from './constants'

function Section({ titre, items, couleurs }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5 min-w-[80px]">
      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{titre}</span>
      {items.map(({ label, distance }, i) => (
        <div key={label + i} className="flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${couleurs[i % couleurs.length]}`}>{label}</span>
          {distance > 0 && <span className="text-gray-400">{distance}m</span>}
        </div>
      ))}
    </div>
  )
}

export default function BandeauLigneActive({ ligne }) {
  if (!ligne || !ligne.distanceTotale) return null

  const {
    distanceTotale,
    distanceBase,
    repetitions,
    intervalle,
    dureeTotale,
    nages,
    materiel,
    intensite,
    typeExo,
    subdivisions,
  } = ligne

  let nageItems = (nages || []).map(n => ({ label: n.nom, distance: n.distance }))
  let matItems = []
  let intItems = []
  let typeItems = []

  if (subdivisions && subdivisions.length > 0) {
    const nageMap = {}, matMap = {}, intMap = {}, typeMap = {}
    for (const sub of subdivisions) {
      if (sub.nage) nageMap[sub.nage] = (nageMap[sub.nage] || 0) + sub.distance
      for (const m of (sub.materiel || [])) matMap[m] = (matMap[m] || 0) + sub.distance
      if (sub.intensite) intMap[sub.intensite] = (intMap[sub.intensite] || 0) + sub.distance
      if (sub.typeExo)   typeMap[sub.typeExo]   = (typeMap[sub.typeExo]   || 0) + sub.distance
    }
    nageItems = Object.entries(nageMap).map(([label, distance]) => ({ label, distance }))
    matItems  = Object.entries(matMap).map(([label, distance]) => ({ label, distance }))
    intItems  = Object.entries(intMap).map(([label, distance]) => ({ label, distance }))
    typeItems = Object.entries(typeMap).map(([label, distance]) => ({ label, distance }))
  } else {
    matItems  = (materiel || []).map(m => ({ label: m, distance: distanceTotale }))
    intItems  = intensite ? [{ label: intensite, distance: distanceTotale }] : []
    typeItems = typeExo   ? [{ label: typeExo,   distance: distanceTotale }] : []
  }

  const hasDetails = nageItems.length || matItems.length || intItems.length || typeItems.length

  return (
    <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50/60 to-white px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 items-start rounded-b-xl">

      
      <div className="flex flex-col gap-0.5 min-w-[90px]">
        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Série active</span>

        {ligne.isParentBloc ? (
          // Ligne "4x" parent
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-gray-700">{ligne.repetitions}×</span>
            <span className="text-base font-bold text-[#1d83ea]">{ligne.distanceTotale}m</span>
          </div>
        ) : ligne.multiplicateurBloc > 1 ? (
          // Ligne enfant d'un bloc multiplié
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm text-gray-500">{ligne.distanceUnitaireSansBloc}m</span>
            <span className="text-xs text-gray-400">×{ligne.multiplicateurBloc}</span>
            <span className="text-base font-bold text-[#1d83ea]">{ligne.distanceTotale}m</span>
          </div>
        ) : (
          // Ligne normale
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {repetitions > 1 && (
              <span className="text-sm font-bold text-gray-700">{repetitions}×</span>
            )}
            {repetitions > 1 && distanceBase > 0 && (
              <span className="text-sm text-gray-500">{distanceBase}m</span>
            )}
            <span className="text-base font-bold text-[#1d83ea]">{distanceTotale}m</span>
          </div>
        )}

        {dureeTotale && dureeTotale !== '0:00' && (
          <span className="text-xs text-green-600 font-semibold">{dureeTotale}</span>
        )}
        {intervalle && (
          <span className="text-[10px] text-gray-400">départ {intervalle}</span>
        )}
      </div>


      {hasDetails && <div className="w-px bg-gray-200 self-stretch hidden sm:block" />}

      <Section titre="Nages"     items={nageItems}  couleurs={COULEURS_NAGES} />
      <Section titre="Matériel"  items={matItems}   couleurs={COULEURS_MAT}   />
      <Section titre="Intensité" items={intItems}   couleurs={COULEURS_INT}   />
      <Section titre="Type"      items={typeItems}  couleurs={COULEURS_TYPE}  />

    </div>
  )
}
