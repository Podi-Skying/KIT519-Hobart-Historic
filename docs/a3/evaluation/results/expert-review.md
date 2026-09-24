# E0: GenAI-assisted expert inspection (pre-test)

| | |
| --- | --- |
| **Evaluator** | E0: Claude Code (Anthropic, model Claude Opus 5.5), working in the team's repository at the team's request. **Acknowledge this in the report.** |
| **Date** | 24 Sep 2026 |
| **Build inspected** | Live site at commit `9432967` (before). Fixes verified on `a1cc4c7` and later (after) |
| **Methods** | Heuristic evaluation (Nielsen's 10, severity 0–4). Cognitive walkthrough of the critical tasks (T2, T5, T6, T8) against [task-flows.md](../../task-flows.md). WCAG 2.2 AA spot checks (1.1.1, 2.1.1, 2.5.7) on top of the automated axe scan |
| **Evidence** | 20 screen states before and 31 after, at 390 × 844 px, captured by [`tools/capture.mjs`](../tools/capture.mjs): [`evidence/before/`](../evidence/before/) and [`evidence/after/`](../evidence/after/) |
| **Full log** | [`data/issues.csv`](../data/issues.csv) (rows `E0-*`, `A11Y-*`, `H*`) |

> **Status of this evidence.** E0 is a single, non-human evaluator. It has no lived experience
> of low vision, mobility limits or visiting Hobart, and it can over- or under-rate severity.
> Its findings are therefore treated as **inputs to triangulate**, not as conclusions:
> - **Clear-cut defects** (unreachable functions, WCAG failures, inconsistencies visible in
>   the code) were fixed in Round 1 and are listed below with before/after evidence.
> - **Judgement calls** became hypotheses **H1–H8**, and the usability test (T1–T9) decides
>   them.
>
> E1–E4 must complete their own heuristic forms (kit §8) **before** reading this page, to
> avoid anchoring.

## Summary

- **Issues:** 21 logged, as of 24 Sep.
  - By severity: 2 × sev 3, 12 × sev 2, 6 × sev 1, 1 × sev 0 (a false positive).
  - Status: 10 fixed in Round 1, 9 open hypotheses or candidates, 1 won't-fix (third-party
    Google attribution), 1 rejected.
- **The two severity-3 problems were both on a persona's critical path** and both came from
  *traceability and walkthrough* work, not from looking at screens.
  - **E0-01: no route type from a site page.** A walker who starts from a site page
    (Start walking route) never sees the route-type choice. The Accessible route, Minzi's core
    need (FR1/NFR1), was reachable only via the Map tab.
  - **E0-04: no text-size or contrast setting.** A1's NFR1 promised "adjustable font size,
    high contrast", but it was never built. The RTM review made the gap visible.
- **App-owned axe failures dropped from 3 rule types to 0.** Before: `listitem`, and
  `scrollable-region-focusable` on 2 states. What remains is Google's own map-footer controls
  and a decorative mock-up element; see [a11y-audit.md](a11y-audit.md).

## Cognitive walkthrough: critical paths

Q1 goal · Q2 action visible · Q3 action ↔ effect · Q4 feedback. ✗ = a predicted failure,
with its story in the Notes column.

**T2 · Minzi: set up the flattest route (before Round 1)**

| Step | Correct action | Q1 | Q2 | Q3 | Q4 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Home → site card | ✓ | ✓ | ✓ | ✓ | |
| 2 | Start walking route | ✓ | ✓ | ✓ | ✓ | |
| 3 | Choose Accessible | ✓ | **✗** | — | — | **No route-type control on this path.** Minzi would pick Standard map and walk the Normal route without knowing it. Fixed by R1-6 → **E0-01** |
| 4 | Standard map | ✓ | ✓ | ✓ | ✓ | Summary line shows "Normal route", so she may notice only after starting |

**T5 · Margaret: make the text easier to read (after Round 1)**

| Step | Correct action | Q1 | Q2 | Q3 | Q4 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tap "🌐 EN · Aa" | ✓ | **?** | **?** | ✓ | Before Round 1 there was no action at all (✗). After: the "Aa" cue is the only signifier. A globe usually means *language only*, so this is the riskiest step. **Verify in T5** (time to first tap) |
| 2 | Larger text switch | ✓ | ✓ | ✓ | ✓ | Switch shows its state by the knob position, not colour alone |
| 3 | High contrast switch | ? | ✓ | ✓ | ✓ | Optional; she may not know "contrast" |

**T6 · Margaret: gentle walk to the nearest site with a toilet stop**

| Step | Correct action | Q1 | Q2 | Q3 | Q4 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Map tab | ✓ | ✓ | ✓ | ✓ | |
| 2 | Add a stop → Toilets (browse panel) | **?** | ✓ | ✓ | ✓ | Users usually choose the destination first and then look for stops. **H5** |
| 3 | Nearest heritage site | ✓ | ✓ | ✓ | ✓ | |
| 4 | Accessible | ✓ | ✓ | ✓ | ✓ | Climb and slope feedback shown |
| 5 | Add the forgotten stop (selected panel) | ✓ | **✗** | — | — | The selected panel can only *remove* stops (stop chips). She must close the panel (✕), add the stop, then reselect. **H5** |

**T8 · Sam: dry day, multi-stop accessible route, total time**

| Step | Correct action | Q1 | Q2 | Q3 | Q4 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Weather → This week | ✓ | ✓ | ✓ | ✓ | Rainy Tuesday is shown by emoji; the text alternative was added in Round 1 (A11Y-3) |
| 2 | Map → add Salamanca, Narryna | ? | ✓ | ✓ | ✓ | Same ordering risk as T6 (**H5**) |
| 3 | Destination → Accessible | ✓ | ✓ | ✓ | ✓ | Before R1-8 the times jumped while loading (**E0-06**) |
| 4 | Read the total time | ✓ | ✓ | ? | ✓ | Home / Nearest times use a straight-line estimate that differs from the routed time (**H1**) |

## Before / after (Round 1)

| Refinement | Finding | Before | After |
| --- | --- | --- | --- |
| R1-1 Language & display: larger text, high contrast | E0-04 | [02-home](../evidence/before/02-home.png) | [22-display-both-on](../evidence/after/22-display-both-on.png) · [23-home](../evidence/after/23-home-large-contrast.png) · [25-map](../evidence/after/25-map-large-contrast.png) |
| R1-2 Arrival sheet in both navigation modes | E0-02 | [12-navigate-standard](../evidence/before/12-navigate-standard.png) · [14-ar-arrived](../evidence/before/14-navigate-ar-arrived.png) | [29-standard-arrived](../evidence/after/29-navigate-standard-arrived.png) · [14-ar-arrived](../evidence/after/14-navigate-ar-arrived.png) |
| R1-3 Weather → Plan an accessible walk | E0-03 | [20-weather-bottom](../evidence/before/20-weather-bottom.png) | [20-weather-bottom](../evidence/after/20-weather-bottom.png) · [28-accessible-preselected](../evidence/after/28-map-accessible-preselected.png) |
| R1-4 Printable map: facts at each stop | E0-05 | [16-print-steps](../evidence/before/16-navigate-print-steps.png) | [30-print-stops-facts](../evidence/after/30-print-stops-facts.png) |
| R1-5 List semantics, keyboard scroll, text alternatives | A11Y-1/2/3 | [axe before](../evidence/before/axe-summary.md) | [axe after](../evidence/after/axe-summary.md) |
| R1-6 Route type on the mode screen | E0-01 | [11-navigate-modes](../evidence/before/11-navigate-modes.png) | [11-navigate-modes](../evidence/after/11-navigate-modes.png) |
| R1-7 "Hide panel" grip button | A11Y-5 | drag only | [31-map-panel-hidden](../evidence/after/31-map-panel-hidden.png) |
| R1-8 No contradictory times while loading | E0-06 | [11b-loading-estimates](../evidence/before/11b-navigate-modes-loading-estimates.png) | [11-navigate-modes](../evidence/after/11-navigate-modes.png) |

## Strengths observed (to keep)

- **One action colour and consistent sheets.** Every screen has exactly one burgundy primary
  action, and all sheets share one component (dismiss by ✕, backdrop or drag).
  Consistency and standards.
- **Route-type cards explain the trade-off.** Each card gives its reason with measured climb
  and max slope ("↑ 44 m climb · max 14 % slope") rather than a vague label. Match with the
  real world, and it supports informed choice for P1/P2.
- **Recovery paths everywhere.** Change mode, remove a stop, close the destination, switch
  Map ⇄ AR. User control and freedom.
- **Graceful degradation.** Without Google keys the app still routes with straight-line
  estimates and says so ("straight-line estimate"). Error prevention and honesty.
