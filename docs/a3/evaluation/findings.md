# Prioritised findings & final design refinements

- **Source of truth:** [`data/issues.csv`](data/issues.csv). The ranking below comes from
  `analysis/eval-summary.mjs`.
- **Priority** = severity (0–4) × reach (1–3) × 2 when the issue blocks a persona's critical
  path. Details in [evaluation-plan.md §9](evaluation-plan.md#9-analysis).

The work happens in three stages:

1. **Round 1: before user testing.** Driven by E0 inspection, the cognitive walkthrough, axe
   and RTM review. Clear-cut defects only.
2. **Usability test (M4) and team inspection (E1–E4).** These confirm or reject the open
   hypotheses and add new issues.
3. **Round 2.** Refinements backed by user evidence, followed by the targeted re-test (M5).

---

## 1. Round 1 refinements (done, live since 24 Sep)

| # | Finding (ID · sev) | Evidence | Principle | Refinement | Verified by |
| --- | --- | --- | --- | --- | --- |
| R1-6 | **Accessible route unreachable from a site page** (E0-01 · 3, critical) | CW T2 step 3 ✗; [before](evidence/before/11-navigate-modes.png) | User control & freedom; visibility (Nielsen H3, H1) | Route-type picker on "How would you like to navigate?" | [after](evidence/after/11-navigate-modes.png); **T2** |
| R1-1 | **No text size or contrast setting**, despite A1 NFR1 (E0-04 · 3, critical for P2) | RTM gap; [before](evidence/before/02-home.png) | Universal design; WCAG 1.4.4, 1.4.11 | Language & display sheet: Larger text 1.2×, High contrast; "Aa" cue on the button | [after 22](evidence/after/22-display-both-on.png) · [23](evidence/after/23-home-large-contrast.png); axe 0; **T5** |
| R1-8 | **Contradictory times while routes load**: Steep shown "faster" than Normal (E0-06 · 2, critical) | [before](evidence/before/11b-navigate-modes-loading-estimates.png) | Consistency; visibility of system status | "…" in the cards while "Checking slopes…" | [after](evidence/after/11-navigate-modes.png); **T2, T8** |
| R1-2 | **No arrival state in standard navigation**; audio not reachable from navigation (E0-02 · 2) | [before](evidence/before/12-navigate-standard.png) | Consistency (H4); A1 FR5 | Shared ArrivalSheet, auto-opens within 20 m; primary action by mode; no autoplay (WCAG 1.4.2) | [after](evidence/after/29-navigate-standard-arrived.png); **T3** |
| R1-3 | **Weather page is a dead end** (E0-03 · 2) | [before](evidence/before/20-weather-bottom.png) | Flexibility & efficiency (H7) | "Plan an accessible walk" preselects Accessible | [after](evidence/after/20-weather-bottom.png) · [map](evidence/after/28-map-accessible-preselected.png); **T2** |
| R1-4 | **Print has no content for a hand-out** (E0-05 · 2) | [before](evidence/before/16-navigate-print-steps.png) | Match with the real-world task | "At each stop": category, area, year, accessibility, description, numbered like the map pins | [after](evidence/after/30-print-stops-facts.png); **T9** |
| R1-5 | **WCAG failures:** list semantics, keyboard scroll, missing text alternatives (A11Y-1/2/3 · 2) | [axe before](evidence/before/axe-summary.md) | WCAG 1.3.1, 2.1.1, 1.1.1 | Sheet rebuilt; focusable forecast; hidden text for weather emoji and chart | [axe after](evidence/after/axe-summary.md) = 0 app-owned |
| R1-7 | **Map panel hides only by dragging** (A11Y-5 · 2) | code review | WCAG 2.5.7 | Grip is a "Hide panel" button | [after](evidence/after/31-map-panel-hidden.png) |

**Deliberately not changed in Round 1.** The items below are judgement calls, not defects.
Changing them before seeing users would be guessing, so they are hypotheses for the usability
test (§2).
- H1: the static walking times on Home and Nearest.
- H5: adding stops from the selected-destination panel.

---

## 2. Hypotheses for the usability test

Decision rule: **confirmed** if ≥ 2 participants show the problem (or 1 participant fails the
task because of it). **Rejected** if no participant shows it. Otherwise **inconclusive**, and
the issue stays open with its severity reduced by 1.

| ID | Hypothesis (from E0) | Task / probe | Candidate refinement if confirmed | Result |
| --- | --- | --- | --- | --- |
| H1 | Straight-line times on Home and Nearest (e.g. 20 min) don't match routed times (28 min), which undermines trust in timing | T8: "How long will it take?"; note which number they quote | Label list times "about"; show the routed time once known | ☐ confirmed ☐ rejected ☐ inconclusive |
| H5 | People choose the destination first and then look for "add stop" in the selected panel, where it doesn't exist | T6, T8: path to add a stop | "Add a stop" in the selected panel, reusing WaypointSheet | ☐ ☐ ☐ |
| H4 | Once hidden, the "Plan a walk" tab isn't recognised as the way back | Incidental in T6/T8; debrief Q5 | Label the tab more strongly, or restore on marker tap | ☐ ☐ ☐ |
| H2 | Icon-only map controls (speaker, wifi = offline) are unclear | Debrief; T7 | Text labels or tooltips; say honestly that offline is simulated | ☐ ☐ ☐ |
| H3 | The Top 5 carousel duplicates the 5-site list | T1 think-aloud | Different content, e.g. "Near you" | ☐ ☐ ☐ |
| H6 | "Change mode" as the primary button distracts during navigation | T2/T3 | Make "Change mode" secondary | ☐ ☐ ☐ |
| H7 | "Top 5 Heritages" reads oddly | T1 think-aloud | "Top 5 heritage sites" | ☐ ☐ ☐ |
| H8 | The location toast hides the map controls | Incidental | Move toasts below the controls | ☐ ☐ ☐ |
| A11Y-6 | AR bubbles can only be repositioned by dragging | E1 manual check | "Reset layout" button, or accept as non-essential | ☐ ☐ ☐ |

---

## 3. Findings from the usability test and team inspection

Fill in after running `eval-summary.mjs`: one row per merged issue, highest priority first.
Keep issues that no participant or evaluator actually showed out of this table.

| Rank | ID | Finding | Sources (methods · who) | Sev. | Reach | Crit. | Priority | Evidence (quote / time / screenshot) | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | | | Round 2 / later / won't fix (why) |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |

**Validated strengths (keep).** List them with evidence, e.g. tasks with 100 % unassisted
completion and SEQ ≥ 6, and positive quotes. A2's pilot strengths (Top 5 for first-time
visitors; AR arrows) should be re-checked here.

---

## 4. Round 2 refinements and re-evaluation (M5)

| # | Refinement | Addresses | Before | After | Re-test (task · participants) | Result vs criterion | Verified? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R2-1 | | | | | | | ☐ |
| R2-2 | | | | | | | ☐ |

Re-run `node capture.mjs --label after-r2` after the changes and link the new axe table here.
