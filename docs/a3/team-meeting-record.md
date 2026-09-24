# Team meeting record: Group 13 (Assignment 3)

Copy the meeting template for every meeting. Keep entries short and factual.
- **Decisions** made outside meetings (chat, code review) go in the decision log.
- **Contribution:** the record also supports any peer-review moderation, so name who owned
  each action.

## Meeting template

**Meeting #__: date · time · place/online**
**Present:** · **Apologies:** · **Chair / minutes:**

| # | Agenda item | Discussion (key points) | Decision | Action | Owner | Due |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | |
| 2 | | | | | | |

**Carried over from the last meeting:** status of each action (done / in progress / blocked).

---

## Decision log

The first entries were proposed during the AI-assisted Round 1 work on 24 Sep. They need the
team's confirmation (initial the last column) before they are reported as team decisions.

| Date | Decision | Why (evidence / principle) | Alternatives considered | Proposed by | Team confirmed |
| --- | --- | --- | --- | --- | --- |
| 24 Sep | Add two proto-personas (older resident, teacher) to Minzi | A3 brief "all personas"; A1 stakeholder priorities | Only Minzi; a Heritage Officer persona (no admin UI to test) | Claude Code (AI-assisted), accepted by T. Hua-kuei | ☐ |
| 24 Sep | Fix clear-cut defects before user testing (Round 1); keep judgement calls as hypotheses | Testing known bugs wastes participant time; hypotheses keep Round 2 evidence-based | Fix everything first; fix nothing until testing | Claude Code, accepted by T. Hua-kuei | ☐ |
| 24 Sep | Display settings live in the language sheet behind an "Aa" cue | One entry point; no settings page in the IA | A separate settings tab; follow the OS text size only | Claude Code | ☐ (test in T5) |
| 24 Sep | Scale text with CSS `zoom` on text surfaces, never on maps or camera | Maps' pointer maths break under zoom; full token refactor too costly | Token `calc()` refactor of 34 components | Claude Code | ☐ |
| 24 Sep | Audio never autoplays on arrival | WCAG 1.4.2; startling in the street; user control | Autoplay (A1 FR5 wording) | Claude Code | ☐ |
| 24 Sep | Evaluate with classmates in persona roles + inspection + axe (triangulation) | Recruiting real older adults and teachers isn't feasible by 4 Oct | Classmates only; inspection only | Team (via T. Hua-kuei) | ☐ |
| | | | | | |
