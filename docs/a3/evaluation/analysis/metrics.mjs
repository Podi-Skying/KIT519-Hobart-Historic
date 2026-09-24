/**
 * Evaluation metrics — pure functions (unit-tested in tests/eval/metrics.spec.js).
 * Input rows come from the CSV templates in ../data; see eval-summary.mjs for the CLI.
 */

/** Minimal RFC 4180 CSV parser: quoted fields, "" escapes, CRLF. Returns objects keyed by header. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header = [], ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ''))
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const median = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
/** Sample standard deviation (n − 1). */
const sd = (xs) => {
  if (xs.length < 2) return null
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}
const num = (v) => (v === '' || v == null ? null : Number(v))

/**
 * SUS score 0–100 (Brooke, 1996): odd items contribute (answer − 1), even items (5 − answer).
 * @param {number[]} answers ten answers on a 1–5 scale, in questionnaire order
 */
export function susScore(answers) {
  if (answers.length !== 10 || answers.some((a) => !Number.isInteger(a) || a < 1 || a > 5)) {
    throw new Error('SUS needs ten answers between 1 and 5')
  }
  const sum = answers.reduce((total, a, i) => total + (i % 2 === 0 ? a - 1 : 5 - a), 0)
  return sum * 2.5
}

/** Adjective rating for a SUS score (Bangor, Kortum & Miller, 2009). */
export function susAdjective(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 73) return 'Good'
  if (score >= 52) return 'OK'
  if (score >= 39) return 'Poor'
  return 'Awful'
}

/** @param {{participant:string, q1..q10:string}[]} rows */
export function summarizeSus(rows) {
  const scores = rows.map((r) => ({
    participant: r.participant,
    score: susScore(Array.from({ length: 10 }, (_, i) => Number(r[`q${i + 1}`]))),
  }))
  const values = scores.map((s) => s.score)
  const avg = mean(values)
  return {
    scores,
    n: values.length,
    mean: avg,
    sd: sd(values),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    adjective: avg == null ? null : susAdjective(avg),
  }
}

/** Participant id used for the expert (team) baseline times in tasks.csv. */
export const BASELINE_ID = 'EXP'

/**
 * Per-task effectiveness, efficiency and satisfaction.
 * Rows: participant, task, outcome (ok | assist | fail), time_s, errors, seq.
 * The BASELINE_ID row gives the expert time for the ≤ 3× efficiency check.
 */
export function summarizeTasks(rows, criteria = { completion: 0.8, seq: 5.5, timeFactor: 3 }) {
  const byTask = new Map()
  for (const r of rows) {
    if (!byTask.has(r.task)) byTask.set(r.task, { users: [], baseline: null })
    const entry = byTask.get(r.task)
    if (r.participant === BASELINE_ID) entry.baseline = num(r.time_s)
    else entry.users.push(r)
  }
  return [...byTask.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    .map(([task, { users, baseline }]) => {
      const n = users.length
      const count = (o) => users.filter((u) => u.outcome === o).length
      const times = users.filter((u) => u.outcome !== 'fail').map((u) => num(u.time_s)).filter((t) => t != null)
      const seqs = users.map((u) => num(u.seq)).filter((s) => s != null)
      const errors = users.map((u) => num(u.errors)).filter((e) => e != null)
      const completion = n ? count('ok') / n : null
      const medianTime = median(times)
      const meanSeq = mean(seqs)
      return {
        task,
        n,
        ok: count('ok'),
        assist: count('assist'),
        fail: count('fail'),
        completion,
        medianTime,
        baseline,
        meanErrors: mean(errors),
        meanSeq,
        meets: {
          completion: completion != null && completion >= criteria.completion,
          seq: meanSeq != null && meanSeq >= criteria.seq,
          time: baseline == null || medianTime == null ? null : medianTime <= baseline * criteria.timeFactor,
        },
      }
    })
}

/**
 * Priority = severity (0–4) × reach (1–3) × 2 if it blocks a persona's critical path.
 * An explicit `priority` value in the CSV wins.
 */
export function issuePriority(issue) {
  if (issue.priority) return Number(issue.priority)
  const severity = num(issue.severity) ?? 0
  const reach = num(issue.reach) ?? 1
  return severity * reach * (issue.critical === 'Y' ? 2 : 1)
}

export function summarizeIssues(rows) {
  const bySeverity = [0, 1, 2, 3, 4].map((s) => ({ severity: s, count: rows.filter((r) => num(r.severity) === s).length }))
  const tally = (key) =>
    Object.entries(rows.reduce((acc, r) => ({ ...acc, [r[key] || '—']: (acc[r[key] || '—'] ?? 0) + 1 }), {})).sort(
      (a, b) => b[1] - a[1],
    )
  const ranked = rows.map((r) => ({ ...r, priorityScore: issuePriority(r) })).sort((a, b) => b.priorityScore - a.priorityScore)
  return { total: rows.length, bySeverity, byMethod: tally('method'), byStatus: tally('status'), ranked }
}
