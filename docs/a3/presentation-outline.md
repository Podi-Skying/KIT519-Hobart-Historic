# Presentation plan: 10 minutes + defence

> **GenAI rule:** presentation *scripting* must not be AI-written. This file gives only
> structure, timing, visuals and the demo click-path. Each presenter writes their own words.
> Diagrams and imagery on slides **may** use GenAI, and must be acknowledged.

**Recommended arc:** a persona-led story. Show one problem, the evidence, the decision, then
the result, and repeat. The HD descriptor rewards "selecting compelling evidence rather than
merely describing the project", so each slide should carry one piece of evidence.

| # | Time | Slide | Visual (file) | Rubric point covered | Presenter |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00–0:30 | Title and the client problem | Splash screenshot (`evidence/after/01-splash.png`) | Context | |
| 2 | 0:30–1:15 | Who we designed for: 3 personas | Persona table ([personas.md](personas.md)) | All personas | |
| 3 | 1:15–4:15 | **Live demo, persona-led (3 min)**, see the demo path below | Live site on a phone via screen mirroring; backup: screenshots | Final prototype; key workflows | |
| 4 | 4:15–5:00 | How the design meets needs: traceability | RTM coverage matrix + ID history ([rtm.md](rtm.md)); one UML figure (sequence §3 or use case) | RTM & UML | |
| 5 | 5:00–6:00 | Evaluation plan: why these methods | Methods × objectives table ([evaluation-plan.md §3](evaluation/evaluation-plan.md)) | Evaluation plan & methods | |
| 6 | 6:00–7:15 | What we found | `results/summary.md` charts: completion, SEQ, SUS vs 68/75; top 3 issues with priority scores; 1–2 quotes | Findings & evidence; prioritisation | |
| 7 | 7:15–8:30 | What we changed: before → after | 2–3 pairs, e.g. route type (R1-6), Aa display (R1-1), plus the strongest Round 2 change; re-test result | Refinements; HCI principles | |
| 8 | 8:30–9:30 | HCI principles in the final design | Heuristics + WCAG 2.2 criteria, each mapped to a visible feature | Critical HCI application | |
| 9 | 9:30–10:00 | Limitations & next steps | Proposed production architecture (UML §7) | Limitations, recommendations | |

## Demo path (about 3 minutes, rehearsed on the live site)

Start in a fresh private tab. Pre-load the page, and have a backup screen recording ready in
case of network failure.

1. **Minzi, about 60 s.**
   1. Splash → Home → Language & display → 한국어.
   2. Back to English for the audience (optional).
   3. Cascade card → **Start walking route**.
   4. Route type → **Accessible**; point at the climb and slope.
   5. **AR navigation** → **Simulate arrival** → **Listen to the audio tour**.
2. **Margaret, about 45 s.**
   1. Language & display → **Larger text** + **High contrast**.
   2. Map → nearest site → Accessible → Go → **Printable map**.
3. **Sam, about 45 s.**
   1. Weather → This week → **Plan an accessible walk**.
   2. Map: add Salamanca + Narryna → Cascade → Go → Printable map → **At each stop**.
4. **Reset, about 10 s.** Turn the display settings off so the next slides match.

## Defence preparation: likely questions → where the evidence is

Every member must answer at least one question. Assign owners, and make sure each person can
point to the evidence rather than recall it from memory.

| Likely question | Evidence to point to | Owner |
| --- | --- | --- |
| Why did you move from AR glasses (A1) to a phone app? | RTM ID history; A1 SDLC risk ("protected delivery baseline, app-based"); budget constraint | |
| Your participants were students. How valid are the results? | Evaluation plan §4 and §12; persona role cards; triangulation with inspection and axe | |
| Why these methods and not, e.g., A/B testing or analytics? | Plan §3: formative stage, small n, prototype, no live users | |
| How did you prioritise? | Priority formula; issues.csv ranking | |
| Which change had the most evidence behind it? | findings.md: the issue with the most sources and the highest priority | |
| How do you know a refinement worked? | M5 re-test results; before/after axe | |
| What did AI contribute, and how did you check it? | README acknowledgement; E0 treated as a hypothesis source; team's own E1–E4 forms | |
| What would you do next for the City of Hobart? | UML §7: CMS, service worker, live weather, field test with older adults | |
| Where is the accessible route data from, and is it reliable? | uml.md §3: Google Routes + Open-Meteo elevation; the "may include steps" note (honesty) | |
