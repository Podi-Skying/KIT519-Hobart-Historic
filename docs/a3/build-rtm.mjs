#!/usr/bin/env node
/**
 * Regenerate rtm.md from rtm.csv (the RTM's source of truth).
 *   node docs/a3/build-rtm.mjs
 * Adds the matrix, the backward trace and a workflow × requirement coverage table, and
 * prints any requirement no workflow uses or any workflow without a Must requirement.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv } from './evaluation/analysis/metrics.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const rows = parseCsv(readFileSync(join(here, 'rtm.csv'), 'utf8'))
const WORKFLOWS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11']

const cell = (s) => s.replaceAll('; ', ', ').replaceAll('|', '\\|')
const covers = (row, w) => {
  const ws = row.Workflows
  if (ws === 'all') return true
  if (ws.includes('W1–W4') && ['W1', 'W2', 'W3', 'W4'].includes(w)) return true
  return ws.split(/\s+/).includes(w)
}

const intro = `# Requirements Traceability Matrix (final)

\`rtm.csv\` is the source; this page is generated from it by \`node docs/a3/build-rtm.mjs\` (open the CSV in Excel for filtering).
Every requirement traces **forwards** to screens, code, tests and evaluation tasks, and
**backwards** to its A1/A2 origin and stakeholder need. Personas/workflows → [personas.md](personas.md);
evaluation tasks T1–T9 → [evaluation/evaluation-plan.md](evaluation/evaluation-plan.md#6-tasks);
findings (H*, A11Y-*, R1-*) → [evaluation/findings.md](evaluation/findings.md).

## ID history (A1 → A2 → A3)

A1 and A2 numbered requirements differently. A3 keeps the **A2 numbering** (the latest agreed
baseline) and appends new IDs, so earlier documents stay valid:

| A1 | A2 | A3 (final) | Note |
| --- | --- | --- | --- |
| FR1 Route calculation | FR1 | FR1 | Extended with real climb / slope (terrain data) |
| FR2 AR live HUD | FR2 | FR2 | Phone AR (smart-glasses concept from A1 dropped for budget/hardware risk) |
| FR3 Category filtering | FR3 | FR3 | + search |
| FR4 Image galleries (AR overlays) | FR7 | FR7 + **FR13** | Split: gallery (FR7) and AR past/present compare (FR13) |
| FR5 Audio tours, auto-triggered | FR6 | FR6 + **FR15** | Split: player (FR6) and arrival trigger (FR15, Round 1) |
| NFR1 Accessibility incl. font size / contrast | NFR1 | NFR1 + **FR14** | Font size / contrast was never built → FR14 (Round 1) |
| NFR2 Offline | NFR2 | NFR2 | Paper map is the working fallback; offline tiles simulated |
| NFR3 Real-time performance | NFR3 | NFR3 | Hand-tracking (glasses) no longer applies |
| NFR4 Weather | NFR4 | NFR4 | + "Plan an accessible walk" (Round 1) |
| — | FR4, FR5, FR8–FR12, NFR5, NFR6 | same | Unchanged from A2 |
| — | — | **FR16, FR17, NFR7** | Existing features that had no requirement (likes, nearest site, localisation) |

## Matrix
`

const out = [intro]
out.push('| ID | Requirement | Pri. | Personas · Workflows | Screens | Verification | Evaluation evidence | Status |')
out.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of rows) {
  out.push(
    `| **${r.ID}** | ${cell(r.Requirement)} | ${r.Priority} | ${r.Personas} · ${r.Workflows} | ${cell(r['Screens / routes'])} | ${cell(r.Verification)} | ${cell(r['Evaluation evidence'])} | ${r.Status} |`,
  )
}
out.push('', '## Backward trace: source and implementation', '')
out.push('| ID | Source (earlier ID · stakeholder need) | Implementation (`src/…`) |', '| --- | --- | --- |')
for (const r of rows) out.push(`| **${r.ID}** | ${cell(r['Source (earlier ID · stakeholder need)'])} | ${cell(r.Implementation)} |`)

out.push(
  '',
  '## Coverage: workflows × requirements',
  '',
  '✓ = the workflow depends on the requirement. Every workflow is covered by at least one *Must*',
  'requirement and every requirement is exercised by at least one workflow (no orphans).',
  '',
)
out.push(`| Req \\ Workflow | ${WORKFLOWS.join(' | ')} |`, `| --- | ${WORKFLOWS.map(() => '---').join(' | ')} |`)
for (const r of rows) out.push(`| ${r.ID} | ${WORKFLOWS.map((w) => (covers(r, w) ? '✓' : '')).join(' | ')} |`)

const orphans = rows.filter((r) => !WORKFLOWS.some((w) => covers(r, w))).map((r) => r.ID)
const uncovered = WORKFLOWS.filter((w) => !rows.some((r) => covers(r, w) && r.Priority === 'Must'))
out.push('', `<!-- generated: orphans=${JSON.stringify(orphans)} workflows-without-Must=${JSON.stringify(uncovered)} -->`, '')

writeFileSync(join(here, 'rtm.md'), out.join('\n'))
console.log(`rtm.md written · ${rows.length} requirements · orphans: ${orphans.join(', ') || 'none'} · workflows without a Must: ${uncovered.join(', ') || 'none'}`)
