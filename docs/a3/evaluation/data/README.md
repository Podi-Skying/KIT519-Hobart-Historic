# Evaluation data (anonymised)

Fill these in after each session, from the paper forms in `instruments/kit.html`. Then run:

```bash
node docs/a3/evaluation/analysis/eval-summary.mjs --out summary
```

That writes `results/summary.md`, the tables for the report and `findings.md`.

| File | One row per | Columns |
| --- | --- | --- |
| `participants.csv` | Participant (P1…Pn) | Screening answers (kit §2), role card, device, location permission, build commit |
| `tasks.csv` | Participant × task | `outcome` = `ok` / `assist` / `fail`; `time_s`; `errors`; `seq` 1–7. Add one row per task with participant `EXP` for the team's expert baseline time |
| `sus.csv` | Participant | `q1`…`q10`, the raw 1–5 answers in questionnaire order (the script does the scoring) |
| `issues.csv` | Problem | See below |

**`issues.csv` columns**

| Column | Values |
| --- | --- |
| `id` | E0-…, A11Y-…, HE-…, CW-…, UT-… |
| `method` | HE heuristic · CW walkthrough · A11Y audit · UT usability test |
| `source` | Who found it: E0–E4, P1…Pn, axe |
| `heuristic` | H1–H10 |
| `wcag` | Success criterion |
| `requirement` | RTM ID |
| `severity` | 0–4 |
| `reach` | 1 = one person · 2 = two or more participants or evaluators · 3 = everyone |
| `critical` | Y if it blocks a persona's critical path (T2, T5, T6, T8) |
| `status` | open · fixed-R1 · fixed-R2 · wont-fix · rejected |

- **Merging duplicates:** keep one row, and list every source in `source` (for example `E0 E2 P3 P5`).
- **Privacy:** no names or other identifying details go in these files, because the
  repository is public. Consent forms and recordings go in `../private/`, which is git-ignored.
