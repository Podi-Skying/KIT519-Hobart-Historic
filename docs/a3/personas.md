# Personas

Three personas cover the user groups that Assignment 1 prioritised (visitors, residents and
older adults, schools and walking groups). Every workflow ID used in the journeys, task flows,
RTM and evaluation tasks is defined here.

| | P1 · Minzi | P2 · Margaret | P3 · Sam |
| --- | --- | --- | --- |
| **Group** (A1 stakeholder analysis) | International visitor / student | Resident, older adult | School teacher (schools & walking groups) |
| **Source** | Assignment 2 persona, unchanged | New for A3 (proto-persona) | New for A3 (proto-persona) |
| **Primary need** | Confidence: an easy route, her own language | Comfort: readable text, gentle routes, rest stops | Control: a planned, printable route for a group |
| **Workflows** | W1–W4 | W5–W7 (+ W4) | W8–W11 |

> **Evidence status.** Minzi comes from Assignment 2. Margaret and Sam are *proto-personas*.
> They are grounded in the case study's user groups and the A1 stakeholder-conflict analysis
> ("Older adults need exact distances…", "Schools & walking groups value group-friendly
> route planning"), not in fresh interviews. The report's limitations section should say so,
> and the evaluation recruits role-players against these briefs (see
> [evaluation-plan.md](evaluation/evaluation-plan.md) §4).

---

## P1 · Minzi (22): international exchange student

> "I want to see the old buildings, but I can't walk far right now and my English isn't
> perfect."

- **Who:** 3rd-year art and design student from Seoul, on exchange at UTAS for a semester.
- **Context:** A minor leg injury makes hills and long walks painful. She is comfortable with
  apps, has tried AR in games, and reads English slowly.
- **Goals:**
  - Find heritage places worth visiting for her design studies.
  - Pick a flat route.
  - Check the weather first.
  - Hear the story in Korean.
- **Frustrations:**
  - Hobart information is spread across signs and websites.
  - Route steepness is invisible on normal maps.
  - Long English text.
- **Accessibility needs:** Low-gradient routes, and content in her own language (audio plus
  transcript).
- **Scenario:** On a Saturday she opens the app and switches it to 한국어. She checks
  whether today suits walking and picks a site from the Top 5. Next she compares the
  Normal and Accessible routes and follows AR arrows. On arrival she listens to the
  Korean narration.

**Workflows**

| ID | Workflow | Main screens (routes) |
| --- | --- | --- |
| W1 | Discover and choose a heritage site | Home `/home` → Site detail `/sites/:id` |
| W2 | Check conditions and plan an accessible route | Weather `/weather` → Map `/map` (Accessible preselected) |
| W3 | Navigate by map or AR and switch modes | Navigate `/navigate/:id` → `/navigate/:id/map` ⇄ `/navigate/:id/ar` |
| W4 | Learn on site (arrival → audio, transcript, AR, past vs present) | Arrival sheet → `/sites/:id/audio`, `/ar/:id`, `/ar/:id/compare` |

---

## P2 · Margaret (71): Sandy Bay resident

> "Make the writing bigger, tell me where I can sit down, and don't send me up Battery Point."

- **Who:** Retired school librarian who has lived in Sandy Bay for 40 years.
- **Context:**
  - She has mild macular degeneration, so small or low-contrast text is hard to read, and
    glare makes it worse.
  - She has walked with a stick since a hip replacement.
  - She uses an iPhone for calls and photos with system text enlarged, and has never used AR.
  - She walks with a friend on Thursday mornings.
- **Goals:**
  - Rediscover local history on gentle routes.
  - Know where the toilets and coffee stops are.
  - Have something on paper she can hold.
- **Frustrations:**
  - Small grey text.
  - Apps that assume she can manage hills.
  - Voices that start talking without being asked.
- **Accessibility needs:**
  - Larger text and higher contrast (A1 NFR1 "adjustable font size, high contrast").
  - Accessible routes.
  - Rest stops.
  - A paper fallback.
- **Scenario:** Her friend suggests the Female Factory. Margaret makes the text bigger and
  darker, then asks the Map for the nearest site and chooses the Accessible route. She adds
  a toilet and coffee stop and prints the route to take with her.

**Workflows**

| ID | Workflow | Main screens (routes) |
| --- | --- | --- |
| W5 | Set up reading comfort (larger text, high contrast) | Language & display sheet (from the "🌐 EN · Aa" button) |
| W6 | Plan a gentle walk with rest stops | Map `/map` → nearest site → Accessible → Add a stop |
| W7 | Take the route on paper | Navigate `/navigate/:id` → Printable map `/navigate/:id/print` |
| (W4) | Hear the story on arrival | Arrival sheet → Audio tour |

---

## P3 · Sam (38): Year 9 history teacher

> "I need one route I can risk-assess, that works for everyone in the class, printed, by Friday."

- **Who:** History teacher at a public high school in Hobart, planning a two-hour convict-history
  excursion for 24 students.
- **Context:**
  - One student uses a wheelchair.
  - School policy limits phone use on excursions.
  - Sam plans on a laptop and phone the week before.
- **Goals:**
  - Link several sites into one walk that fits the timetable.
  - Check the forecast for the excursion day.
  - Hand every student a sheet with the route, key facts and space for notes.
- **Frustrations:**
  - Stitching together Google Maps, heritage websites and weather apps.
  - No accessible-route information for the risk assessment.
- **Accessibility needs:** An accessible route for the whole group (the gentlest option
  becomes the group default).
- **Scenario:** On Monday Sam checks the week's forecast and picks the dry day. On the map
  Sam chooses Cascade Female Factory, adds Salamanca and Narryna as stops, and selects
  Accessible. Sam checks the total time, then prints the route with facts for every stop.

**Workflows**

| ID | Workflow | Main screens (routes) |
| --- | --- | --- |
| W8 | Check the forecast for a future day | Weather `/weather` › This week |
| W9 | Plan a multi-stop group route | Map `/map` → destination → Add a stop (up to 4) → Accessible |
| W10 | Produce a class hand-out | Printable map `/navigate/:id/print` › At each stop → Print or save as PDF |
| W11 | Prepare classroom material | Site detail › Through the years → Gallery; AR › Compare today with 1844 |
