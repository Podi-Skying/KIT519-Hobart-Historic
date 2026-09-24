# Evaluation plan: final high-fidelity prototype

- **Prototype under test:** https://podi-skying.github.io/KIT519-Hobart-Historic/. Record the
  commit hash of the build on the session log, from `git log -1` or the GitHub Actions run.
- **Artefacts:**
  - Tasks trace to the workflows in [personas.md](../personas.md) and the requirements in
    [rtm.md](../rtm.md).
  - Instruments: [instruments/kit.html](instruments/kit.html) (print A4).
  - Data templates: [data/](data/).
  - Analysis: `node docs/a3/evaluation/analysis/eval-summary.mjs`.

---

## 1. Objectives and evaluation questions

| # | Objective | Evaluation question | Primary evidence |
| --- | --- | --- | --- |
| O1 | Each persona can complete their required workflows | Can representative users finish T1–T9 **without help**? | Completion, assists, errors |
| O2 | The design is learnable by first-time users | Where does a new user fail to see or understand the next action? | Cognitive walkthrough, think-aloud |
| O3 | The interface follows recognised usability principles | Which heuristics are violated, and how severely? | Heuristic evaluation (severity 0–4) |
| O4 | The prototype meets WCAG 2.2 AA for the tested screens | Which success criteria fail, automatically and manually? | axe-core scans, manual checklist |
| O5 | Users find the product acceptable | Is perceived usability at or above the industry average? | SUS, SEQ, debrief |
| O6 | Refinements fixed what they targeted | Did the Round 2 changes remove the problems, without new ones? | Targeted re-test (§10) |

## 2. Scope

- **In scope:** workflows W1–W11 on a phone-sized screen, in English. T3 also uses Korean
  audio. Every screen in the [site map](../site-map.md) is exercised by at least one task.
- **Out of scope, stated as limitations:**
  - Real outdoor GPS tracking. Arrival is triggered with **Simulate arrival**.
  - Real camera landmark recognition. The AR feed is a photo.
  - Offline tile caching. The toggle is simulated.
  - Live weather. The data is static.

## 3. Methods and justification (triangulation)

No single method finds every kind of problem. Inspection methods are cheap and cover the whole
interface. User testing reveals the problems experts don't predict. Accessibility audits cover
needs that neither group may have. Combining them lets each finding be checked against a
second source (Nielsen, 1994; Hollingsed & Novick, 2007).

| Method | Who | Answers | Strength | Limitation (and mitigation) |
| --- | --- | --- | --- | --- |
| **M1 Heuristic evaluation** (Nielsen, 1994), severity 0–4 | E1–E4, the four team members, working independently, then merged; E0 is an AI-assisted pre-inspection | O3 | Whole-UI coverage, fast, cheap | Evaluator bias toward our own design → independent logs before merging; compare with E0 and user data |
| **M2 Cognitive walkthrough** (Wharton et al., 1994) | Pairs of team members, one persona each | O2 | Targets first-time learnability of the *critical path* | Predictive only → the T1–T9 tests confirm or reject each predicted failure |
| **M3 Accessibility audit** (WCAG 2.2 AA) | Automated axe-core on 30 screen states; manual keyboard, VoiceOver, zoom and target-size checks by E1 | O4 | Objective and repeatable | Automated rules catch only part of WCAG (no judgement of meaning, focus order or gestures) → manual checklist (kit §10) |
| **M4 Moderated usability test** with concurrent think-aloud, persona role-play | 6 participants (§4) | O1, O2, O5 | Real behaviour, quotes, measured performance | Classmates are not the target users → persona briefs, limitation stated, no statistical claims |
| **M5 Targeted re-evaluation** (RITE-style, Medlock et al., 2002) | 2–3 *new* participants, affected tasks only | O6 | Shows whether refinements work | Small sample → report as indicative only |

## 4. Participants and evaluators

**Evaluators (M1–M3).** Four team members (E1–E4, all KIT519 students with HCI training). E0
is an AI-assisted inspection run once before Round 1; it is acknowledged in the report, and its
results are in [results/expert-review.md](results/expert-review.md). E0 is **not** one of the
independent evaluators: its findings are compared against E1–E4.

**Participants (M4).**
- **Recruitment:** six classmates or peers who were **not** involved in the design, recruited
  in the tutorial and by message. No incentives.
- **Allocation:** two participants per persona role. Each receives a role card (kit §3) and
  must do that persona's tasks, plus T5 for everyone: text-size discoverability matters for
  all users.
- **Screening** (pre-questionnaire, kit §2): smartphone use, map-app use, AR experience,
  familiarity with Hobart, preferred language. Record whether anyone genuinely matches a
  persona (for example a Korean speaker for P1).
- **Stretch goal:** one older adult (for example a family member aged 65+) for the P2 role,
  if they consent. Their data is analysed separately.
- **Sample size:** a formative study. About five users per distinct user group find most
  severe problems (Nielsen & Landauer, 1993). With three groups, two per group is the minimum
  and is reported as a limitation. No inferential statistics are used.

## 5. Setup and materials

- **Device:** the participant's own phone if possible (ecological validity), otherwise the
  team's iPhone. Chrome or Safari, portrait, sound on.
- **Clean state:** a new private/incognito tab per participant, which resets stored
  preferences, stops, likes and language. Allow location, or deny it: record which.
- **Roles:**
  - Moderator: reads the script and never demonstrates.
  - Note-taker: observation log, kit §5.
  - Time-keeper: stopwatch per task.
- **Screen recording:** only with explicit consent, and stored in `evaluation/private/`
  (git-ignored).
- **Materials:** in [kit.html](instruments/kit.html):
  - information sheet and consent form
  - pre-questionnaire
  - moderator script
  - persona role cards and task cards
  - observation log
  - SEQ
  - SUS
  - debrief questions
  - heuristic form
  - cognitive walkthrough form
  - WCAG checklist

## 6. Tasks

Task wording on the cards gives the goal only and never names a control. Success criteria are
observable on screen.

| Task | Persona · WF | Scenario (read to participant) | Success = | Limit | Reqs | Probes |
| --- | --- | --- | --- | --- | --- | --- |
| **T1** | P1 · W1 | "You're interested in convict history and your leg is sore. Find a convict-heritage place that's suitable for a wheelchair or pram, and open its page." | Site page of **Cascade Female Factory** open | 3 min | FR3 FR4 FR5 | Filter vs search? Notices the Accessible badge? |
| **T2** | P1 · W2 | "Check whether today is good for walking. Then set up the **flattest** way to get there and start following it on a map." | Standard map navigation open with **Accessible route** in the summary | 4 min | NFR4 FR1 FR8 FR10 | Finds the route type on the mode screen (R1-6)? Uses the Weather button (R1-3)? |
| **T3** | P1 · W3 W4 | "Switch to the camera view. When you get there (press *Simulate arrival*), listen to the story **in Korean**." | AR navigation → arrival sheet → audio playing with 한국어 selected | 4 min | FR2 FR10 FR15 FR6 FR9 NFR7 | Finds the language setting from the audio page? |
| **T4** | P1 · W4 | "See what this place looked like in 1844." | Compare view open and slider moved | 2 min | FR13 | Understands the slider? |
| **T5** | all · W5 | "Imagine the writing is too small for you to read comfortably. Make the app easier to read." | **Larger text** on (High contrast optional) | 2 min | FR14 NFR1 | Time to first tap on "EN · Aa"; where they looked first |
| **T6** | P2 · W6 | "Plan a gentle walk to the heritage place nearest to you, with a toilet stop on the way." | Nearest site selected + Accessible + Toilets stop | 4 min | FR17 FR1 FR11 | **H5**: looks for "add stop" in the selected panel? |
| **T7** | P2 · W7 | "Get a copy of this route you can take with you on paper." | Printable map open and print dialog shown | 2 min | FR12 FR10 NFR2 | Expects print on the map screen? |
| **T8** | P3 · W8 W9 | "Your class excursion is this week. Find a day that should stay dry. Then plan an accessible route to Cascade Female Factory that also visits Salamanca Place and Narryna. How long will the walk take?" | Names a dry day (not Tue); route has both stops + Accessible; states the minutes | 6 min | NFR4 FR11 FR1 | **H1**: does the stated time match the navigation screen? **H5** as in T6 |
| **T9** | P3 · W10 | "Prepare a hand-out for your students with the route and some facts about each stop." | Printable map with **At each stop** visible, print dialog shown | 3 min | FR12 | Is the hand-out content enough? |

**Order:** role tasks in the order above, then T5 last for P1 and P3, so it is a fresh
discovery; P2 does T5 first. Any task not finished within its time limit is recorded as
*failed*, and the moderator moves on.

## 7. Procedure (about 35 minutes per session)

1. **Welcome, information sheet, consent** (3 min). Kit §1.
2. **Pre-questionnaire** (2 min). Kit §2.
3. **Role card and think-aloud practice** (3 min). Kit §3: "Please say what you're looking
   at and thinking."
4. **Tasks** (about 20 min). Kit §4. For each task:
   - Read the card aloud; the timer starts when the participant touches the phone.
   - Neutral prompts only: "What are you looking for?"
   - An *assist* is recorded when the moderator gives any hint.
   - The SEQ is asked after each task.
5. **SUS** (3 min). Kit §6.
6. **Debrief interview** (4 min). Kit §7.
7. **Thank the participant.** Reset the device by closing the private tab.

**Pilot:** one team member runs the full session on another member first (not counted) to
check timing and wording.

## 8. Measures and success criteria

| Dimension | Measure | Instrument | Success criterion |
| --- | --- | --- | --- |
| Effectiveness | Completion: unassisted / assisted / failed | Observation log | ≥ 80 % unassisted per task |
| Efficiency | Time on task; errors (wrong screen or backtrack) | Stopwatch, log | Time ≤ 3× the expert baseline (team member, recorded in `data/tasks.csv`) |
| Satisfaction (task) | Single Ease Question, 1–7 (Sauro & Dumas, 2009) | Kit §5 | Mean ≥ 5.5 per task |
| Satisfaction (overall) | System Usability Scale, 0–100 (Brooke, 1996) | Kit §6 | Mean ≥ 68 (average); target ≥ 75 ("good", Bangor et al., 2009) |
| Learnability | Cognitive walkthrough failures on critical paths | Kit §9 | 0 unresolved "No" answers on T2, T5, T6 critical steps |
| Heuristics | Issue count by severity | Kit §8 / `data/issues.csv` | No severity-4 issues open at submission |
| Accessibility | axe-core violations (serious/critical); manual checklist | `tools/capture.mjs`, kit §10 | 0 serious or critical app violations; all manual checks pass or are documented |

## 9. Analysis

1. **Quantitative.** Run `eval-summary.mjs`. It calculates:
   - completion %, median time and mean SEQ per task
   - SUS per participant, with mean and SD
   - issue counts by severity and method
2. **Issue log.** Every problem from every method goes into `data/issues.csv` with its
   source(s), screen, heuristic, WCAG criterion, requirement, persona, evidence
   (screenshot / quote / time) and severity.
3. **Merging.** Duplicates across evaluators and methods are merged. The number of
   independent sources is kept, because agreement between methods raises confidence.
4. **Prioritisation.** Priority = severity (0–4) × reach × criticality. Reach is 1 for 1
   participant, 2 for ≥ 2 participants or ≥ 2 evaluators, and 3 for "all". Criticality is ×2
   when the issue blocks a persona's critical path (T2, T5, T6, T8).
   - Top priorities → Round 2 refinements.
   - Recorded in [findings.md](findings.md) with before/after evidence.
5. **Qualitative.** Think-aloud quotes and debrief answers are affinity-mapped into themes
   (sticky notes or a Miro board; photograph it for evidence).
6. **Hypotheses from the expert review.** H1, H3, H4 and H5 are marked *confirmed*,
   *rejected* or *inconclusive* against the user data. A confirmed hypothesis becomes a
   Round 2 refinement.

## 10. Re-evaluation (M5)

After the Round 2 refinements:
- **Tasks:** re-run only the affected tasks with 2–3 participants who did not take part in
  M4.
- **Scans:** re-run `tools/capture.mjs --label after-r2`.
- **Reporting:** a refinement counts as "verified" when its task reaches the §8 criterion
  and no new issue of severity ≥ 3 appears.

## 11. Ethics and data handling

- **Consent and anonymity:** participation is voluntary and informed. Participants can stop
  at any time without giving a reason, and are identified only as P1…Pn.
- **Minimal personal data:** no names in the data files; age is collected as a band.
- **Storage:**
  - Signed consent forms and any recordings stay in `evaluation/private/`, which is
    git-ignored because the repository is public, or on paper.
  - Only anonymised, aggregated data is committed.
  - Raw data is deleted after grading.
- **Institutional approval:** this is a formative class activity with peers, not
  publishable research. Check with the unit coordinator that no HREC approval is needed
  before testing with anyone outside the class (for example the older-adult stretch
  participant).

## 12. Threats to validity and limitations

| Threat | Effect | Mitigation |
| --- | --- | --- |
| Participants are students, not older adults, teachers or real international visitors | Under-estimates problems for P2/P3, especially vision, mobility and domain needs | Persona role cards; T5 run for all; recruit one older adult if possible; stated in the report |
| Lab setting (seated, indoors, Wi-Fi) instead of walking outdoors | No glare, noise, GPS drift or divided attention | "Simulate arrival"; recommend a field test in production |
| Simulated AR, offline and weather | Tests the interaction design, not the technology | Explained in the briefing; separate limitations |
| Evaluators designed the product | Confirmation bias in M1/M2 | Independent logs; E0 comparison; user data decides the hypotheses |
| Small sample | Metrics are indicative, not generalisable | Descriptive statistics only; qualitative emphasis; triangulation |
| Moderator influence | Hints inflate completion | Scripted neutral prompts; every hint logged as an assist |

## 13. Schedule and roles (proposed; adjust to the team)

| When | What | Owner |
| --- | --- | --- |
| 25–26 Sep | Pilot session; finalise kit; expert baseline times | Moderator + note-taker |
| 25–27 Sep | M1 heuristic evaluation (independent), M2 walkthrough, M3 manual checklist | E1–E4 |
| 27–30 Sep | M4 sessions P1–P6 | Rotating moderator / note-taker |
| 30 Sep | Merge issues, run `eval-summary`, prioritise | Whole team |
| 1–2 Oct | Round 2 refinements; `capture --label after-r2` | Dev lead (with Claude Code, acknowledged) |
| 2–3 Oct | M5 re-test; write report and slides | Whole team |
| 4 Oct | Submit | — |

## References

Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies, 4*(3), 114–123.

Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.

Hollingsed, T., & Novick, D. G. (2007). Usability inspection methods after 15 years of research and practice. In *Proceedings of the 25th Annual ACM International Conference on Design of Communication* (pp. 249–255). ACM. https://doi.org/10.1145/1297144.1297200

Medlock, M. C., Wixon, D., Terrano, M., Romero, R., & Fulton, B. (2002). Using the RITE method to improve products: A definition and a case study. *Usability Professionals' Association Annual Conference*.

Nielsen, J. (1994). Heuristic evaluation. In J. Nielsen & R. L. Mack (Eds.), *Usability inspection methods* (pp. 25–62). John Wiley & Sons.

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. In *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Sauro, J., & Dumas, J. S. (2009). Comparison of three one-question, post-task usability questionnaires. In *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems* (pp. 1599–1608). ACM. https://doi.org/10.1145/1518701.1518946

Wharton, C., Rieman, J., Lewis, C., & Polson, P. (1994). The cognitive walkthrough method: A practitioner's guide. In J. Nielsen & R. L. Mack (Eds.), *Usability inspection methods* (pp. 105–140). John Wiley & Sons.

World Wide Web Consortium. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/
