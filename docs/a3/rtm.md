# Requirements Traceability Matrix (final)

`rtm.csv` is the source; this page is generated from it (open the CSV in Excel for filtering).
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

| ID | Requirement | Pri. | Personas · Workflows | Screens | Verification | Evaluation evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **FR1** | Users can compare Normal / Accessible / Steep walking routes with time, distance, climb and maximum slope | Must | P1 P2 P3 · W2 W6 W9 | Map /map › Route type, Standard nav /navigate/:id/map | tests/lib/terrain.spec.js (chooseOptions, elevationProfile, viaCandidates), tests/lib/routing.spec.js (parseRoute), usability T2 T6 T8 | H1 (time estimates differ between screens) — to verify in T8 | Implemented |
| **FR2** | Users can navigate with an AR heads-up view (direction arrows over the camera) | Must | P1 · W3 | AR navigation /navigate/:id/ar | tests/lib/routing.spec.js (nextGuidance), usability T3 | Camera feed is simulated (prototype limitation) | Implemented (simulated camera) |
| **FR3** | Users can filter and search heritage sites by category and name | Must | P1 · W1 | Home /home › filter bar | tests/lib/sites.spec.js (filterSites), usability T1 | — | Implemented |
| **FR4** | Users can browse featured sites (Top 5 ranked by likes) | Should | P1 · W1 | Home /home › Top 5 carousel | tests/lib/sites.spec.js (rankByLikes), usability T1 | H3 (Top 5 repeats the full list of 5 sites) — to verify | Implemented |
| **FR5** | Users can view heritage information (category, area, year, accessibility, description) | Must | P1 P3 · W1 W11 | Site detail /sites/:id | usability T1 | — | Implemented |
| **FR6** | Users can listen to a narrated audio tour with playback controls | Must | P1 P2 · W4 | Audio tour /sites/:id/audio, Arrival sheet | tests/stores/stores.spec.js (player store), usability T3 | Round 1 R1-2: audio reachable in one tap on arrival | Implemented |
| **FR7** | Users can view historical image galleries | Should | P1 P3 · W11 | Site detail › Through the years, Gallery /sites/:id/gallery/:index | usability T4 (optional) | — | Implemented |
| **FR8** | Users can start navigation from a site page | Must | P1 · W1 W2 | Site detail › Start walking route → /navigate/:id | usability T2 | — | Implemented |
| **FR9** | Users can read the audio transcript and choose the narration language | Must | P1 · W4 | Audio tour › Read transcript, Language & display sheet | tests/stores/stores.spec.js (narration in every language), usability T3 | — | Implemented |
| **FR10** | Users can choose and switch navigation mode (standard map / AR / printable) | Must | P1 P2 P3 · W3 W7 W10 | Navigate /navigate/:id, Map ⇄ AR buttons | usability T3 T7 | — | Implemented |
| **FR11** | Users can add up to 4 stops (heritage sites as real waypoints, amenities as reminders) | Must | P2 P3 · W6 W9 | Map › Add a stop, Standard nav › Add stop | tests/stores/stores.spec.js (caps stops, removes on second toggle), usability T6 T8 | — | Implemented |
| **FR12** | Users can print the route with steps, stops, per-stop key facts and space for notes | Must | P2 P3 · W7 W10 | Printable map /navigate/:id/print | usability T7 T9 | Round 1 R1-4: facts at each stop for group hand-outs | Implemented |
| **FR13** | Users can recognise a landmark in AR and compare it with its past (time-travel) | Should | P1 P3 · W4 W11 | AR camera /ar/:id, Compare /ar/:id/compare | usability T4 | Detection is simulated (prototype limitation) | Implemented (simulated detection) |
| **FR14** | Users can enlarge text and switch to high contrast | Must | P2 · W5 | Language & display sheet (🌐 EN · Aa) | tests/stores/stores.spec.js (prefs store), axe scan 22–25, usability T5 | Round 1 R1-1 (gap found in RTM review: A1 NFR1 never implemented) | Implemented in Round 1 |
| **FR15** | Arriving at the destination opens its content (audio, AR, details) without autoplay | Should | P1 P2 · W4 | Arrival sheet in /navigate/:id/map and /navigate/:id/ar | tests/lib/routing.spec.js (announces arrival), usability T3 | Round 1 R1-2 (standard nav had no arrival state — consistency) | Implemented in Round 1 |
| **FR16** | Users can like sites, likes rank the Top 5 | Could | P1 · W1 | Home cards, Site detail ♥ | tests/stores/stores.spec.js (favorites store) | — | Implemented |
| **FR17** | The app suggests the nearest heritage site from the user's location (or a default origin) | Should | P2 · W6 | Map › Nearest heritage site | tests/lib/sites.spec.js (nearestSite), usability T6 | — | Implemented |
| **NFR1** | Accessible by default: WCAG 2.2 AA, 44px targets, accessible routes, no forced gestures | Must | P1 P2 P3 · all | All screens | axe-core scans (evidence/before → after), tests/composables/sheetDrag.spec.js, heuristic + cognitive walkthrough | A11Y-1…A11Y-4 fixed in Round 1 | Partly verified — manual screen-reader test pending |
| **NFR2** | Usable with limited connectivity | Should | P2 P3 · W7 W10 | Printable map, "Save map offline" toggle | usability T7 T9 | Offline mode is simulated, paper map is the real fallback (limitation) | Partial |
| **NFR3** | Responsive and stable navigation (re-route only after 50 m, cached routes, graceful fallback) | Should | P1 · W3 | Standard / AR navigation | tests/lib/routing.spec.js, tests/lib/terrain.spec.js | — | Implemented |
| **NFR4** | Clear walking-weather information that feeds route planning | Should | P1 P2 P3 · W2 W8 | Weather /weather | usability T2 T8 | Round 1 R1-3: "Plan an accessible walk", data is static (limitation) | Implemented (static data) |
| **NFR5** | Simple and consistent navigation (persistent tab bar, one action colour, back everywhere) | Must | P1 P2 P3 · all | Tab bar, PageHeader | heuristic evaluation (H4 consistency) | — | Implemented |
| **NFR6** | Clear hierarchy and outdoor readability (contrast ≥ 4.5:1, one primary button per screen) | Must | P1 P2 P3 · all | All screens | axe color-contrast, heuristic evaluation | — | Implemented |
| **NFR7** | All interface text, site content and narration in 5 languages | Must | P1 · W1–W4 | Language & display sheet | tests/i18n/i18n.spec.js (identical keys & placeholders in every locale) | — | Implemented |

## Backward trace: source and implementation

| ID | Source (earlier ID · stakeholder need) | Implementation (`src/…`) |
| --- | --- | --- |
| **FR1** | A1 FR1 · A2 FR1 · visitors & older adults need exact effort before walking | services/routeOptions.js (chooseOptions), services/routes.js, services/elevation.js, composables/useWalkingRoute.js, components/map/RouteTypePicker.vue |
| **FR2** | A1 FR2 · A2 FR2 · hands-free wayfinding | views/ArNavigationView.vue, lib/guidance.js (nextGuidance) |
| **FR3** | A1 FR3 · A2 FR3 · reduce information overload | views/HomeView.vue, components/base/ChipGroup.vue, components/home/SearchField.vue, lib/sites.js (filterSites) |
| **FR4** | A2 FR4 · A2 pilot strength S1 (recognition over recall) | components/home/HeritageCarousel.vue, lib/sites.js (rankByLikes) |
| **FR5** | A2 FR5 · heritage officers: accurate interpretation | views/SiteDetailView.vue, data/sites.js, i18n/content |
| **FR6** | A1 FR5 · A2 FR6 · older adults can't read long text while walking | stores/player.js, services/speech.js (Web Speech API), views/AudioTourView.vue, components/map/ArrivalSheet.vue |
| **FR7** | A1 FR4 · A2 FR7 · visual archives without new signage | components/site/GalleryRail.vue, views/GalleryView.vue |
| **FR8** | A2 FR8 · smooth transition from information to wayfinding | views/SiteDetailView.vue, stores/trip.js (setDestination) |
| **FR9** | A2 FR9 · non-native English speakers | views/AudioTourView.vue, components/layout/LanguageSheet.vue, i18n/index.js (LOCALES speech tags) |
| **FR10** | A2 FR10 · A2 pilot finding F1 (AR felt forced) | views/NavigationModesView.vue, views/StandardNavigationView.vue, views/ArNavigationView.vue |
| **FR11** | A2 FR11 · A2 pilot finding F2 (route felt fixed) | components/map/StopPicker.vue, components/map/WaypointSheet.vue, stores/trip.js (toggleStop), data/navigation.js (WAYPOINTS, MAX_STOPS) |
| **FR12** | A2 FR12 · A2 pilot finding F3 · schools & walking groups | views/PrintableMapView.vue |
| **FR13** | A1 FR4 (historic photos as AR overlays) · heritage officers: interpretation | views/ArCameraView.vue, views/ArCompareView.vue, components/ar/* |
| **FR14** | A1 NFR1 (adjustable font size / high contrast) · older adults with low vision | stores/prefs.js, components/layout/LanguageSheet.vue, styles/tokens.css (data-contrast), styles/base.css (.text-zoom) |
| **FR15** | A1 FR5 (location-triggered narration) · safety while walking | components/map/ArrivalSheet.vue, lib/guidance.js (arrived < 20 m) |
| **FR16** | A2 UML Like_Function · engagement success measure | stores/favorites.js |
| **FR17** | A1 challenge: visitors miss points of interest | views/MapView.vue, lib/sites.js (nearestSite), stores/location.js |
| **NFR1** | A1 NFR1 · A2 NFR1 · improve accessibility (client objective) | README §5.8 checklist, ChipGroup radiogroup, aria labels, useSheetDrag (drag has button alternative) |
| **NFR2** | A1 NFR2 · A2 NFR2 · variable connectivity (case constraint) | views/PrintableMapView.vue, stores/trip.js (offlineMap — simulated) |
| **NFR3** | A1 NFR3 · A2 NFR3 | composables/useWalkingRoute.js (REROUTE_METERS, cache, 'fallback' status) |
| **NFR4** | A1 NFR4 · A2 NFR4 · weather affects outdoor experience (case challenge) | views/WeatherView.vue, data/weather.js (static) |
| **NFR5** | A2 NFR5 · simple navigation (design consideration) | components/layout/TabBar.vue, router meta (tab, hideTabBar) |
| **NFR6** | A2 NFR6 · clear information hierarchy | styles/tokens.css (AA/AAA contrast tokens) |
| **NFR7** | A2 FR9 (extended) · international visitors | i18n/messages/*.js, i18n/content/*.js, i18n/index.js |

## Coverage: workflows × requirements

✓ = the workflow depends on the requirement. Every workflow is covered by at least one *Must*
requirement and every requirement is exercised by at least one workflow (no orphans).

| Req \ Workflow | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FR1 |  | ✓ |  |  |  | ✓ |  |  | ✓ |  |  |
| FR2 |  |  | ✓ |  |  |  |  |  |  |  |  |
| FR3 | ✓ |  |  |  |  |  |  |  |  |  |  |
| FR4 | ✓ |  |  |  |  |  |  |  |  |  |  |
| FR5 | ✓ |  |  |  |  |  |  |  |  |  | ✓ |
| FR6 |  |  |  | ✓ |  |  |  |  |  |  |  |
| FR7 |  |  |  |  |  |  |  |  |  |  | ✓ |
| FR8 | ✓ | ✓ |  |  |  |  |  |  |  |  |  |
| FR9 |  |  |  | ✓ |  |  |  |  |  |  |  |
| FR10 |  |  | ✓ |  |  |  | ✓ |  |  | ✓ |  |
| FR11 |  |  |  |  |  | ✓ |  |  | ✓ |  |  |
| FR12 |  |  |  |  |  |  | ✓ |  |  | ✓ |  |
| FR13 |  |  |  | ✓ |  |  |  |  |  |  | ✓ |
| FR14 |  |  |  |  | ✓ |  |  |  |  |  |  |
| FR15 |  |  |  | ✓ |  |  |  |  |  |  |  |
| FR16 | ✓ |  |  |  |  |  |  |  |  |  |  |
| FR17 |  |  |  |  |  | ✓ |  |  |  |  |  |
| NFR1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NFR2 |  |  |  |  |  |  | ✓ |  |  | ✓ |  |
| NFR3 |  |  | ✓ |  |  |  |  |  |  |  |  |
| NFR4 |  | ✓ |  |  |  |  |  | ✓ |  |  |  |
| NFR5 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NFR6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NFR7 | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |

<!-- generated: orphans=[] workflows-without-Must=[] -->
