/**
 * Design notes beside the desktop phone mock-up: which requirements (docs/a3/rtm.csv) a screen
 * implements, and why they exist — shown verbatim from the team's own documents, never
 * rewritten here (assignment GenAI rule: no AI-written rationale).
 */
export { parseCsv } from '../../docs/a3/evaluation/analysis/metrics.mjs'

/** Requirements each screen (route name) implements, most visible first. */
export const ROUTE_REQUIREMENTS = {
  home: ['FR3', 'FR4', 'FR16', 'FR14', 'NFR7', 'NFR5'],
  site: ['FR5', 'FR8', 'FR7', 'FR16'],
  gallery: ['FR7'],
  audio: ['FR6', 'FR9', 'FR14', 'NFR7'],
  map: ['FR1', 'FR17', 'FR11', 'NFR2', 'NFR5'],
  'navigate-map': ['FR1', 'FR10', 'FR11', 'FR15', 'NFR3'],
  'navigate-ar': ['FR2', 'FR10', 'FR15', 'NFR3'],
  'navigate-print': ['FR12', 'NFR2'],
  ar: ['FR13'],
  weather: ['NFR4'],
}

/** Requirements that apply to every screen (listed once, under the screen's own). */
export const EVERY_SCREEN = ['NFR1', 'NFR6']

/**
 * Persona names and workflow titles from personas.md:
 * "## P1 · Minzi (22): international exchange student" and "| W1 | Discover and choose … |".
 */
export function parsePersonas(markdown) {
  const personas = {}
  const workflows = {}
  for (const line of markdown.split('\n')) {
    const p = line.match(/^##\s+(P\d+)\s+·\s+(.+?)\s*$/)
    if (p) personas[p[1]] = p[2]
    const w = line.match(/^\|\s*(W\d+)\s*\|\s*([^|]+?)\s*\|/)
    if (w) workflows[w[1]] = w[2]
  }
  return { personas, workflows }
}

/** "W1–W4" → W1 W2 W3 W4; "P1 P2" → P1 P2; words such as "all" are dropped. */
export function expandIds(text) {
  const out = []
  for (const token of (text ?? '').split(/\s+/)) {
    const range = token.match(/^([A-Z]+)(\d+)[–-]\1?(\d+)$/)
    if (range) for (let n = +range[2]; n <= +range[3]; n++) out.push(range[1] + n)
    else if (/^[A-Z]+\d+$/.test(token)) out.push(token)
  }
  return out
}

const dash = (s) => (!s || s === '—' ? '' : s)

/** One note per requirement ID, in the given order; unknown IDs are skipped. */
export function notesFor(ids, rows, { personas = {}, workflows = {} } = {}) {
  const byId = Object.fromEntries(rows.map((r) => [r.ID, r]))
  return ids
    .map((id) => byId[id])
    .filter(Boolean)
    .map((r) => ({
      id: r.ID,
      requirement: r.Requirement,
      why: r['Source (earlier ID · stakeholder need)'],
      priority: r.Priority,
      status: r.Status,
      evidence: dash(r['Evaluation evidence']),
      personas: expandIds(r.Personas).map((id) => ({ id, name: personas[id] ?? '' })),
      workflows: expandIds(r.Workflows).map((id) => ({ id, title: workflows[id] ?? '' })),
    }))
}

/**
 * Stack callouts in one gutter column: each wants its centre at `want` (the anchor's y; Infinity
 * = no anchor, goes last), never overlaps the one above (gap), stays inside [top, bottom] when
 * it can. Returns the top of each item, in the input order.
 */
export function layoutColumn(items, { top, bottom, gap = 8 }) {
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => a.want - b.want)
  const tops = new Array(items.length)
  let next = top
  for (const it of order) {
    const wanted = Number.isFinite(it.want) ? it.want - it.h / 2 : bottom
    tops[it.i] = Math.max(wanted, next)
    next = tops[it.i] + it.h + gap
  }
  // pushed past the bottom: slide back up, keeping order and gaps
  let limit = bottom
  for (let k = order.length - 1; k >= 0; k--) {
    const it = order[k]
    tops[it.i] = Math.max(top, Math.min(tops[it.i], limit - it.h))
    limit = tops[it.i] - gap
  }
  return tops
}
