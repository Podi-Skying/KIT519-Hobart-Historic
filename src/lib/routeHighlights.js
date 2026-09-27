/**
 * Feature points to pin on the map for a route, so the three route types show *why* they differ
 * (user feedback: "I can't tell what's different between the routes"). Pure — unit-tested.
 *
 *   normal      its steepest stretch, when it is a real hill (≥ 8 %)
 *   accessible  the flat corridor it detours through (e.g. the waterfront) and any remaining
 *               pinch ≥ 5 %, so nothing surprises a wheelchair or pram
 *   steep       the top of the walk (highest point — the view) and its steepest climb
 *
 * @param {'normal'|'accessible'|'steep'} type
 * @param {object | null} option  planned route: { steepestAt, steepestUphill, maxGrade, highestAt, highestM, lowestM, via, viaKind, viaAt }
 * @returns {{ id: string, kind: 'steepest'|'summit'|'via', icon: string, position: {lat:number,lng:number}, params: object, message: string }[]}
 */
export function routeHighlights(type, option) {
  if (!option) return []
  const out = []
  const pct = Math.round((option.maxGrade ?? 0) * 100)
  const steepest = (minGrade) => {
    if (!option.steepestAt || (option.maxGrade ?? 0) < minGrade) return
    out.push({
      id: `${type}-steepest`,
      kind: 'steepest',
      icon: 'mountain',
      position: option.steepestAt,
      params: { pct },
      message: option.steepestUphill === false ? 'routeHighlights.steepestDown' : 'routeHighlights.steepestUp',
    })
  }
  const via = () => {
    if (!option.via || !option.viaAt) return
    const scenic = option.viaKind === 'scenic'
    out.push({
      id: `${type}-via`,
      kind: 'via',
      icon: scenic ? 'sun' : 'accessible',
      position: option.viaAt,
      params: { place: option.via },
      message: scenic ? 'routeHighlights.viaScenic' : 'routeHighlights.viaFlat',
    })
  }

  if (type === 'normal') steepest(0.08)
  if (type === 'accessible') {
    via()
    steepest(0.05)
  }
  if (type === 'steep') {
    // the high point is the reward; only worth a pin when the walk really climbs to it
    if (option.highestAt && (option.highestM ?? 0) - (option.lowestM ?? 0) >= 15) {
      out.push({
        id: 'steep-summit',
        kind: 'summit',
        icon: 'sun',
        position: option.highestAt,
        params: { m: option.highestM },
        message: 'routeHighlights.summit',
      })
    }
    steepest(0)
    if (option.viaKind === 'scenic') via()
  }
  return dedupe(out).slice(0, 3)
}

/** Drop pins within ~60 m of an earlier one (they'd sit on top of each other). */
function dedupe(list) {
  const kept = []
  for (const h of list) {
    const close = kept.some(
      (k) => Math.abs(k.position.lat - h.position.lat) < 0.00055 && Math.abs(k.position.lng - h.position.lng) < 0.0007,
    )
    if (!close) kept.push(h)
  }
  return kept
}
