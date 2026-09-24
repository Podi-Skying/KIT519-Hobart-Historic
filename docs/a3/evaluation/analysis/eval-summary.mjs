#!/usr/bin/env node
/**
 * Summarise the evaluation data as Markdown (tables ready for the report / findings.md).
 *
 *   node docs/a3/evaluation/analysis/eval-summary.mjs                 # print to terminal
 *   node docs/a3/evaluation/analysis/eval-summary.mjs --out summary   # also write ../results/summary.md
 *
 * Reads ../data/tasks.csv, sus.csv and issues.csv (empty files are skipped).
 * No dependencies — plain Node 18+.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASELINE_ID, parseCsv, summarizeIssues, summarizeSus, summarizeTasks } from './metrics.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const DATA = join(here, '..', 'data')
const read = (file) => (existsSync(join(DATA, file)) ? parseCsv(readFileSync(join(DATA, file), 'utf8')) : [])

const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)} %`)
const n1 = (x) => (x == null ? '—' : (Math.round(x * 10) / 10).toString())
const tick = (ok) => (ok == null ? '—' : ok ? '✓' : '✗')

const out = ['# Evaluation summary', '', `Generated ${new Date().toISOString().slice(0, 10)} from docs/a3/evaluation/data/*.csv`, '']

const tasks = read('tasks.csv')
if (tasks.some((r) => r.participant !== BASELINE_ID)) {
  const participants = new Set(tasks.filter((r) => r.participant !== BASELINE_ID).map((r) => r.participant))
  out.push(`## Tasks (n = ${participants.size} participants)`, '')
  out.push('| Task | n | Unassisted | Assisted | Failed | Completion | Median time (s) | Expert (s) | Mean errors | Mean SEQ | Meets: completion · SEQ · time |')
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const t of summarizeTasks(tasks)) {
    out.push(
      `| ${t.task} | ${t.n} | ${t.ok} | ${t.assist} | ${t.fail} | ${pct(t.completion)} | ${n1(t.medianTime)} | ${n1(t.baseline)} | ${n1(t.meanErrors)} | ${n1(t.meanSeq)} | ${tick(t.meets.completion)} · ${tick(t.meets.seq)} · ${tick(t.meets.time)} |`,
    )
  }
  out.push('', 'Criteria: ≥ 80 % unassisted completion · mean SEQ ≥ 5.5 · median time ≤ 3 × expert baseline.', '')
} else out.push('## Tasks', '', '_No participant rows in tasks.csv yet._', '')

const sus = read('sus.csv')
if (sus.length) {
  const s = summarizeSus(sus)
  out.push(`## System Usability Scale (n = ${s.n})`, '')
  out.push(`Mean **${n1(s.mean)}** (SD ${n1(s.sd)}, range ${s.min}–${s.max}) · adjective rating: **${s.adjective}** · benchmark 68, target ≥ 75`, '')
  out.push('| Participant | SUS |', '| --- | --- |', ...s.scores.map((x) => `| ${x.participant} | ${x.score} |`), '')
} else out.push('## System Usability Scale', '', '_No rows in sus.csv yet._', '')

const issues = read('issues.csv')
if (issues.length) {
  const i = summarizeIssues(issues)
  out.push(`## Issues (${i.total})`, '')
  out.push('| Severity | 0 | 1 | 2 | 3 | 4 |', '| --- | --- | --- | --- | --- | --- |', `| Count | ${i.bySeverity.map((b) => b.count).join(' | ')} |`, '')
  out.push(`By method: ${i.byMethod.map(([k, v]) => `${k} ${v}`).join(' · ')}  `)
  out.push(`By status: ${i.byStatus.map(([k, v]) => `${k} ${v}`).join(' · ')}`, '')
  out.push('### Priority ranking (severity × reach × critical-path)', '')
  out.push('| # | ID | Screen | Problem | Sev. | Reach | Critical | Priority | Status |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  i.ranked.forEach((r, k) =>
    out.push(`| ${k + 1} | ${r.id} | ${r.screen} | ${r.description} | ${r.severity} | ${r.reach} | ${r.critical} | ${r.priorityScore} | ${r.status} |`),
  )
  out.push('')
} else out.push('## Issues', '', '_No rows in issues.csv yet._', '')

const markdown = out.join('\n')
console.log(markdown)
const outIndex = process.argv.indexOf('--out')
if (outIndex !== -1) {
  const file = join(here, '..', 'results', `${process.argv[outIndex + 1] ?? 'summary'}.md`)
  writeFileSync(file, `${markdown}\n`)
  console.error(`\nWritten to ${file}`)
}
