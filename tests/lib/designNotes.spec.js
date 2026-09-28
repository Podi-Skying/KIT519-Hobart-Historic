import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { RATIONALE, SCREENS } from '@/data/designRationale'
import { SURVEY_FORMS } from '@/data/surveyForms'
import { EVERY_SCREEN, ROUTE_REQUIREMENTS, expandIds, layoutColumn, notesFor, parseCsv, parsePersonas, parseTasks, scenarioFor } from '@/lib/designNotes'

const rows = parseCsv(readFileSync('docs/a3/rtm.csv', 'utf8'))
const docs = parsePersonas(readFileSync('docs/a3/personas.md', 'utf8'))
const ids = new Set(rows.map((r) => r.ID))

describe('design notes (RTM beside the desktop mock-up)', () => {
  it('only names requirements that exist in rtm.csv', () => {
    for (const id of [...Object.values(ROUTE_REQUIREMENTS).flat(), ...EVERY_SCREEN]) expect(ids.has(id), id).toBe(true)
  })
  it('shows every requirement on at least one screen', () => {
    const shown = new Set([...Object.values(ROUTE_REQUIREMENTS).flat(), ...EVERY_SCREEN])
    expect([...ids].filter((id) => !shown.has(id))).toEqual([])
  })
  it('keys are real route names', () => {
    const router = readFileSync('src/router/index.js', 'utf8')
    const names = new Set([...router.matchAll(/name: '([^']+)'/g)].map((m) => m[1]))
    for (const name of Object.keys(ROUTE_REQUIREMENTS)) if (name !== 'splash') expect(names.has(name), name).toBe(true)
  })
  it('reads persona names and workflow titles from personas.md', () => {
    expect(docs.personas.P1).toMatch(/^Minzi/)
    expect(Object.keys(docs.workflows)).toContain('W11')
  })
  it('expands ID lists and ranges', () => {
    expect(expandIds('W1–W4 W9')).toEqual(['W1', 'W2', 'W3', 'W4', 'W9'])
    expect(expandIds('all')).toEqual([])
  })
  it('builds notes verbatim from the CSV, in the order asked', () => {
    const [a, b] = notesFor(['FR2', 'FR1'], rows, docs)
    expect(a.id).toBe('FR2')
    expect(b.id).toBe('FR1')
    expect(a.requirement).toBe(rows.find((r) => r.ID === 'FR2').Requirement)
    expect(a.personas[0]).toEqual({ id: 'P1', name: docs.personas.P1 })
    expect(notesFor(['FR3'], rows, docs)[0].evidence).toBe('') // "—" means none
  })
  it('puts every anchored screen requirement on an element (data-req) in the source', () => {
    const src = [
      ...['views', 'components/home', 'components/layout', 'components/map', 'components/site', 'components/splash'].flatMap((d) =>
        readdirSync(`src/${d}`).filter((f) => f.endsWith('.vue')).map((f) => readFileSync(`src/${d}/${f}`, 'utf8')),
      ),
    ].join('\n')
    const anchored = new Set([...src.matchAll(/data-req="([^"]+)"/g)].flatMap((m) => m[1].split(' ')))
    const unanchored = new Set(['NFR3']) // real-time performance: no single control
    for (const id of new Set(Object.values(ROUTE_REQUIREMENTS).flat())) if (!unanchored.has(id)) expect(anchored.has(id), id).toBe(true)
  })
})

describe('design rationale', () => {
  it('numbers the screens S1…S11 in order, one per screen with notes', () => {
    expect(SCREENS.map((s) => s.id)).toEqual(SCREENS.map((_, i) => `S${i + 1}`))
    expect(SCREENS.map((s) => s.key).sort()).toEqual(Object.keys(ROUTE_REQUIREMENTS).sort())
    for (const s of SCREENS) expect(s.name && s.intent, s.id).toBeTruthy()
  })
  it('has a complete rationale for every note shown', () => {
    const keys = [
      ...Object.entries(ROUTE_REQUIREMENTS).flatMap(([screen, list]) => list.map((id) => `${screen}:${id}`)),
      ...EVERY_SCREEN.map((id) => `*:${id}`),
    ]
    for (const key of keys) {
      const r = RATIONALE[key]
      expect(r, key).toBeTruthy()
      for (const field of ['title', 'why', 'principle', 'evidence', 'tradeoff']) expect(r[field], `${key}.${field}`).toBeTruthy()
    }
    expect(Object.keys(RATIONALE).sort()).toEqual([...keys].sort()) // nothing orphaned
  })
})

describe('layoutColumn', () => {
  it('centres callouts on their anchors when there is room', () => {
    expect(layoutColumn([{ want: 100, h: 40 }, { want: 300, h: 40 }], { top: 0, bottom: 800 })).toEqual([80, 280])
  })
  it('pushes overlapping callouts down, keeping anchor order', () => {
    expect(layoutColumn([{ want: 110, h: 40 }, { want: 100, h: 40 }], { top: 0, bottom: 800, gap: 8 })).toEqual([128, 80])
  })
  it('sends callouts without an anchor to the bottom and keeps them inside', () => {
    const [a, b] = layoutColumn([{ want: Infinity, h: 50 }, { want: 780, h: 40 }], { top: 0, bottom: 800, gap: 10 })
    expect(b + 40).toBeLessThanOrEqual(a - 10 + 0.001)
    expect(a + 50).toBeLessThanOrEqual(800)
  })
})

describe('evaluation scenarios (desktop "Take part")', () => {
  const tasks = parseTasks(readFileSync('docs/a3/evaluation/evaluation-plan.md', 'utf8'))
  it('reads every task T1–T9 with its persona and scenario', () => {
    expect(tasks.map((t) => t.id)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'])
    for (const t of tasks) expect(t.scenario.length, t.id).toBeGreaterThan(20)
  })
  it('orders each persona session as the plan says (P2 starts with the shared task)', () => {
    expect(scenarioFor('P1', tasks).map((t) => t.id)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5'])
    expect(scenarioFor('P2', tasks).map((t) => t.id)).toEqual(['T5', 'T6', 'T7'])
    expect(scenarioFor('P3', tasks).map((t) => t.id)).toEqual(['T8', 'T9', 'T5'])
  })
  it('has one form per persona with a link and a QR code', () => {
    expect(SURVEY_FORMS.map((f) => `${f.persona}${f.form}`)).toEqual(['P1A', 'P2B', 'P3C'])
    for (const f of SURVEY_FORMS) {
      expect(f.url).toMatch(/^https:\/\/forms\.gle\//)
      expect(f.qr.path).toMatch(/^M0 0h7/) // finder pattern in the top-left corner
    }
  })
})
