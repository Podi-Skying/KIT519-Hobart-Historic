# KIT519 Assignment 3: design & evaluation package (Group 13)

Final artefacts for *Assignment 3: Final Project Evaluation & Professional Defence*
(due 4 Oct 2026). Everything here is consistent with the live prototype at
https://podi-skying.github.io/KIT519-Hobart-Historic/, and IDs link the files together.

- **Personas / workflows:** `P1–P3` / `W1–W11`
- **Requirements:** `FR*` / `NFR*`
- **Tasks:** `T1–T9`
- **Findings:** `E0-*`, `A11Y-*`, hypotheses `H*`
- **Refinements:** `R1-*` / `R2-*`

Mermaid diagrams render directly on GitHub.

## Submission checklist → files

| Required artefact (A3 brief) | File(s) | Status |
| --- | --- | --- |
| Final High-Fidelity Prototype (all personas & workflows) | Live site · `src/` · [task-flows.md](task-flows.md) | ✅ Round 1 live · Round 2 after testing |
| Final User Journeys & Task Flows | [user-journeys.md](user-journeys.md) · [task-flows.md](task-flows.md) | ✅ draft for team review |
| Final Site Map | [site-map.md](site-map.md) | ✅ |
| Final RTM | [rtm.csv](rtm.csv) (Excel) · [rtm.md](rtm.md) (generated) | ✅ · update the *Evaluation evidence* and *Status* columns after testing |
| Final UML artefacts | [uml.md](uml.md) · [figures/](figures/) (SVG/PNG for slides) | ✅ |
| Detailed Evaluation Plan | [evaluation/evaluation-plan.md](evaluation/evaluation-plan.md) | ✅ adjust the schedule and roles |
| Evaluation instruments & materials | [evaluation/instruments/kit.html](evaluation/instruments/kit.html) (print A4) · [tools/capture.mjs](evaluation/tools/capture.mjs) | ✅ |
| Evaluation results & evidence | [results/expert-review.md](evaluation/results/expert-review.md) · [results/a11y-audit.md](evaluation/results/a11y-audit.md) · [evidence/](evaluation/evidence/) · [data/](evaluation/data/) | ◐ E0 and axe done · **team: M1–M4 sessions** |
| Prioritised findings & final refinements | [evaluation/findings.md](evaluation/findings.md) · [data/issues.csv](evaluation/data/issues.csv) | ◐ Round 1 done · **team: §3–§4** |
| Final Design & Evaluation Report (≤ 2,000 words) | [report-outline.md](report-outline.md) | ✍️ **team writes** (GenAI rule) |
| Presentation slides | [presentation-outline.md](presentation-outline.md) | ✍️ **team builds and scripts** |
| Team Meeting Record | [team-meeting-record.md](team-meeting-record.md) | ✍️ team fills in and confirms the decision log |

## How to use

```bash
# screenshots + WCAG scan of every screen (needs Google Chrome)
cd docs/a3/evaluation/tools && npm install && node capture.mjs --label after-r2

# tables for the report from the CSVs you filled in
node docs/a3/evaluation/analysis/eval-summary.mjs --out summary

# regenerate rtm.md after editing rtm.csv
node docs/a3/build-rtm.mjs
```

- **Kit:** open `evaluation/instruments/kit.html` in a browser → Print → A4.
- **Private data:** signed forms and recordings go in `evaluation/private/` (git-ignored; this
  repository is public).

## Acknowledging GenAI use

The brief allows GenAI for research and for **imagery/diagrams on slides**, and requires every
tool used to be referenced. It forbids GenAI for final written copy and presentation
scripting. The facts to acknowledge:

- **Code (prototype):** Round 1 refinements R1-1 to R1-8 were implemented with Claude Code at
  the team's direction and are covered by the automated tests (`npm test`). The team should
  review them before submission.
- **Evaluation:** the E0 inspection, the axe scans and the capture/analysis tools were
  produced with Claude Code. E0 is reported as an AI-assisted inspection, separate from the
  team's own evaluators E1–E4.
- **Artefact drafts:** personas P2/P3, journeys, task flows, site map, RTM, UML and the
  evaluation plan/kit were drafted with Claude Code. The team must review them and adapt them
  as their own before submission.
- **Not AI-written:** the report text, the slide script and the participant data. Those must
  come from the team.

Reference entries (APA 7):

- Anthropic. (2026). *Claude* (Opus 5.5) [Large language model]. https://claude.ai
- Anthropic. (2026). *Claude Code* [Computer software]. https://claude.com/claude-code
- Deque Systems. (2024). *axe-core* (Version 4) [Computer software]. https://github.com/dequelabs/axe-core
