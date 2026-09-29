# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Hobart heritage AR walking-guide prototype (KIT519 class project): a Vue 3 + Vite single-page app rendered inside a phone mockup. The owner writes in Traditional Chinese. `README.md` (also Chinese) is the full spec, including the UI design system in §5. Keep it in sync when features or UI rules change.

## Commands

Node isn't installed system-wide. A project-local copy lives in `.tools/node/` (git-ignored), so put it on PATH first:

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
npm test                                                   # all Vitest specs
npx vitest run tests/lib/terrain.spec.js                   # one file
npx vitest run tests/lib/terrain.spec.js -t chooseOptions  # one test/describe by name
npm run build                                              # → dist/
./scripts/dev.sh                                           # dev server on :5173 (strictPort); runs npm install if needed
```

- There is no linter or formatter. Follow `.editorconfig` (2 spaces, LF) and the surrounding style.
- The Claude preview launcher can't execute scripts under `~/Downloads` because of the macOS sandbox. Instead, start `scripts/dev.sh` with background Bash and open http://localhost:5173 in the browser.
- `archive/` holds the git-ignored v1 single-file prototype. Ignore it.

## Deploy workflow

- **Pushing to `main` deploys.** It triggers `.github/workflows/deploy.yml` (`npm ci → npm test → npm run build → GitHub Pages`), which publishes to https://podi-skying.github.io/KIT519-Hobart-Historic/. A failing test blocks the deploy.
- **Commit and push every change.** The owner wants each change pushed to `main` automatically, once `npm test` and `npm run build` pass locally.
- **Google keys:**
  - The app reads `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID`.
  - Locally they go in `.env.local`. In CI they come from the repo secrets `GOOGLE_MAPS_API_KEY` and `GOOGLE_MAPS_MAP_ID`.
  - Without a key everything still works: maps fall back to the illustrated `MapCanvas`, and routes to dashed straight-line estimates.

## Assignment 3 package (`docs/a3/`)

- **Contents:** design and evaluation artefacts (personas → RTM → UML → evaluation), linked by IDs (`P#`, `W#`, `FR#`, `T#`, `E0-*`, `R1-*`). Keep them consistent with the app when features change.
- **RTM:** `rtm.csv` is the source; regenerate `rtm.md` with `node docs/a3/build-rtm.mjs`.
- **Evidence capture:** `docs/a3/evaluation/tools/capture.mjs` (own `package.json`, puppeteer-core + axe-core, uses local Chrome) screenshots every screen and runs WCAG 2.2 AA scans.
- **Metrics:** `docs/a3/evaluation/analysis/metrics.mjs` holds the metric logic, tested by `tests/eval/metrics.spec.js`.
- **GenAI rule:** the assignment forbids AI-written report prose or presentation scripts — the owner writes the report and the talk (`report-outline.md`, `presentation-outline.md` are the owner's). AI **may** write project and design-rationale content (the owner also uses the app as a job-interview portfolio piece, so aim for portfolio quality), e.g. `src/data/designRationale.js`. Never invent participant data: cite only real sources (RTM, A1/A2 findings, Round 1 refinements, standards).
- **Screen numbers (S1–S11)** follow the app, in the order a visitor meets them: S1 Leading Page, S2 Home, S3 Site Detail, S4 Gallery, S5 Audio Tour, S6 Map, S7 Standard Navigation, S8 AR Navigation, S9 Printable Map, S10 AR Camera · Through Time, S11 Weather. Source: `SCREENS` in `data/designRationale.js`. `docs/a3` (site map, task flows, RTM screens column, personas) uses the same S#/O# numbers (O6 = Navigation mode sheet).

## Architecture

**Layering** (README §4.1):

```
data/ (static content) → lib/ (pure functions) → services/ (external APIs)
  → stores/ (Pinia user state) → views/ (one per route, lazy-loaded) → components/
```

`components/base` must not import stores, router or `data/`.

**App shell and routing**
- **Shell.** `App.vue` wraps everything in `DeviceFrame` (StatusBar, routed view, TabBar, `#sheet-layer`, Toast). `SplashScreen` overlays it on every launch: Tap to start → choose language (`setLocale`) → Home. While it is up, `.viewport` and the TabBar are `inert`, route chunks are prefetched on idle (`prefetchRoutes()` in `router/index.js`), and after it leaves `wakeViewport()` does a 1px scroll round-trip — iOS Safari otherwise ignored the first taps on Home.
- **Phone vs desktop.** The phone mock-up, the backdrop around it and the simulated status bar (time / signal / battery) exist only on desktops — `(min-width: 601px) and (hover: hover) and (pointer: fine)`, used in `tokens.css`, `DeviceFrame.vue` and `StatusBar.vue`. Phones/tablets are full-bleed; `--safe-top` / `--safe-bottom` are the notch insets there. Place floating controls with `var(--chrome-top)`, never a fixed `top: 50px`. In `StatusBar.vue` only the `.status-bar__sim` rules may set `display` on the simulated items (a later equal-specificity `display:flex` once brought the icons back on phones).
- **Voice directions.** `composables/useVoiceGuidance` (standard + AR navigation only — the Map tab has no voice toggle) speaks `lib/voicePrompt` prompts via `services/speech`; phrasing lives in `voice.*` messages.
- **Collapsible panels.** Map's route panel and the standard-navigation summary use `composables/useSnapSheet` (expanded ↔ "time · distance" bar).
- **AR audio.** ArCameraView auto-plays the site's narration once the landmark is detected; the Listen bubble toggles play/pause; leaving pauses it. Through time lives inside ArCameraView (no separate page; `/ar/:id/compare` redirects): once detected it plays today → oldest at a constant speed (`lib/timeline.js`), with a play/pause button and a year slider that takes over when touched. The top-right 360° button (only with a Maps key) swaps the photo stack for `components/ar/StreetView360.vue`: nearest outdoor panorama within 60 m, opened facing the landmark (`lib/streetView.js` › `facingPov`), Google motion tracking; no panorama → toast and back to photos. Never download/cache Street View imagery (Google terms). **Google logo/terms must stay visible** (Maps Platform terms): every Google map and panorama ends where bottom UI begins (MapView, StandardNavigationView `mapBottom`; ArNavigationView pano `bottom = summary height`) — never enlarge a map/pano to tuck the logo under app UI. ArNavigationView has its own 360° toggle: panorama nearest the walker (`location.origin`), facing `pointAhead(route, 40 m)`, level pitch; it hops to a newer panorama every 25 m walked (`setPano`, no extra load). The AR bottom is one flex dock (`.ar-camera__dock`): the info card stacks above the through-time card (no fixed offsets); the card slides down out of the way for 360°, and the panorama fades in over the photo once ready. Google's motion tracking is never used (it only starts after Google's own hidden control asks for permission): the app's glass toggle reads the compass / gyro itself and sets the POV (`orientationToPov`, `approachAngle` in lib/streetView; iOS webkitCompassHeading, Android deviceorientationabsolute). Off by default so the view opens facing the landmark. AR look-around (`useLookAround`) has no motion button: iOS motion permission is asked on the first tap in the AR view (`handlers.click`). AR Exit = `router.back()` (Home when opened directly).
- **Launch / refresh.** A router guard sends the first navigation to Home whatever the URL (the leading page never leads anywhere else); Home's query filters are kept.
- **Navigation flow.** "Go" / "Start route" open `navigate-map` directly (the default). Map ↔ navigation is one surface (`meta.mapSurface` → no page transition): the map stays, zooms in on the walker (`fit="start"`, the route start when there is no GPS fix; the locate button then shows the whole route), and the sheet rises as the trip summary, starting collapsed at its peek (time · distance, route line, Simulate / End; `useSnapSheet({ startCollapsed })`) — users didn't notice navigation had started when it opened a new page with the full panel. `/navigate/:id` is only a redirect. AR / printable are offered by `NavigationModeSheet` on the navigation screen. Route type is picked only where a map shows the routes (Map, standard navigation).
- **Router.** It uses hash history, and Vite uses `base: './'`, so `dist/` runs from any static sub-path.
- **Route `meta` drives the chrome:**
  - `tab`: the active tab-bar item.
  - `hideTabBar`: hides the tab bar for full-screen navigation.
  - `status`: status-bar tone and background (documented in `router/index.js`).
- **HomeView caching.** `HomeView` is kept alive by component name through `defineOptions({ name: 'HomeView' })`. Renaming it breaks the `KeepAlive include`.
- **Home filters** live in the URL query (`?category=&q=`).
- **Site catalogue** (`data/sites.js`, 16 sites). **Scope: historic places in Hobart, North Hobart and South Hobart**, counting Battery Point and Queens Domain as part of Hobart (owner decision, Sept 2026); anything farther out (Bellerive, Sandy Bay, New Town…) stays out. Ids 1–5 are the tour sites: full galleries (≥ 10 photos), time-travel imagery and scripted narration (`data/narration.js`). Ids 6–17 (13 left unused: removed as out of scope; ids are never reused because likes are stored by id) were checked against the Tasmanian Heritage Register (Discover Heritage search, Sept 2026) and carry `thr` (their register ID), coordinates from OpenStreetMap / the THR boundary, and one openly licensed photo via `singlePhoto` (hero = AR views = gallery[0]); their audio tour reads the translated description one sentence per line (`localizeNarration` fallback), so descriptions stay three sentences. **Every site has `sources`** (`thrEntry` / `webSource`), shown under the description on SiteDetail: the THR entry first, then the custodian's own page. Every fact in a description (all five languages) must be traceable to one of them — the THR datasheets (`thr-public-datasheets.heritage.tas.gov.au/Report_Handler.ashx?heritagePlaceID=<id>`) hold the history. **No source, no site**: a site is only added when its facts, coordinates and an openly licensed photo are all in hand (Arthur Circus and Mawson's Huts Replica are not on the THR; Kangaroo Bluff Battery, Alexandra Battery and Runnymede were removed as outside the area; Wesley Church, THR 12150, has no open photo yet). The accessible badge is only set when step-free access is confirmed by an official source. New translations go in all four `i18n/content/<locale>.js` packs; proper names stay English.
- **Map pins show the kind of place, never a number.** The glyph is the category icon (`categoryIcon`, `data/categories.js`: convict lock, religious church, colonial cottage, civic columns, military flag, waterfront anchor). Pins scale about their tip (`--pin-scale`): 1.2 selected, 0.5 dots below zoom 14.5 on Google maps (`is-compact`) and always on the illustrated fallback, growing back on hover / focus / selection.

**i18n: two layers, five locales** (en, zh-Hant, ja, ko, vi)
- **UI strings** live in `src/i18n/messages/<locale>.js` and use vue-i18n, with `en.js` as the source. `tests/i18n/i18n.spec.js` fails unless every locale has exactly the same keys and `{placeholders}` as English, so add every new string to all five files.
- **Content** covers site descriptions, gallery captions, time-travel and narration:
  - English is in `src/data/`. Translations are in `src/i18n/content/<locale>.js`, merged by `src/i18n/content.js`.
  - Render sites from `useContent().sites` / `siteById`, not raw `SITES`, or they won't translate.
  - Site names stay in English.
  - A translated narration is used only if its line count matches the English one.
- **`LOCALES`** in `src/i18n/index.js` maps each locale to BCP-47 speech tags. Those tags pick the TTS voice and set the Google Routes `languageCode`.

**Location and distances**
- `stores/location.js` watches geolocation.
- If permission is denied, or the user is more than 25 km from Hobart, the origin is `DEFAULT_ORIGIN` (Centenary Building, Dynnyrne).
- `SITES` precomputes distances from `DEFAULT_ORIGIN` for static use. Live values come from `location.distanceTo(site)`.

**Maps**
- `components/map/SiteMap.vue` is the single entry point used by every map screen (Map, standard navigation, AR-nav mini map, printable).
- It renders `GoogleMap` (Maps JS API with `AdvancedMarkerElement`, which needs a Map ID).
- It falls back to `MapCanvas` when there's no key or `gm_authFailure` fires.

**Walking routes (Normal / Accessible / Steep).** Every navigation screen uses `composables/useWalkingRoute.js`:
1. **Candidates.** `services/routeOptions.js` `planRouteOptions` asks the Google Routes API (REST, WALK mode, `services/routes.js`) for the fastest route and its alternatives. It also forces extra routes through flat and hill-top via-points (`ROUTE_VIA_POINTS` in `data/navigation.js`).
2. **Terrain.** `services/elevation.js` profiles each candidate with the free Open-Meteo elevation API. Grades are measured over at least 150 m, because the terrain data has ~90 m resolution.
3. **Choice.** `chooseOptions` is pure and unit-tested:
   - Normal is the fastest route.
   - Accessible has the lowest `difficultyScore` among routes within 1.6× Normal's time.
   - Steep maximises `steepValue` within 1.9× Normal's time: it must beat Normal by ≥ 15 m climb or ≥ 2 % max slope (else it equals Normal), then wins on extra difficulty per extra minute, with a bonus for scenic (hill-top) via-points. Never the Accessible pick.
   - `routeProfile` / `profileWithPlaces` also return where the steepest stretch and the highest point are; `lib/routeHighlights.js` turns those into ≤ 3 labelled map pins per route type, and `useWalkingRoute` exposes `highlights`, `alternatives` (the other routes, drawn faint) and `pending` (spinner).

- **No alternative.** If no route differs, the UI says "same as Normal" instead of inventing one.
- **Minutes and caching.** Minutes add Naismith's rule (+1 min per 10 m climbed). Results are cached per points and language for 3 minutes (`lib/ttlCache`), and the composable re-routes only after 50 m of movement.
- **Guidance.** Turn-by-turn directions come from `lib/guidance.js` `nextGuidance`. It returns a `kind` that the views localise.

**Audio tours**
- `stores/player.js` speaks the narration line by line through `services/speech.js`, which uses the browser's Web Speech API (free, no key).
- Seek and skip snap to the start of a line.
- When speech isn't supported, the player simulates the timing.
- Switching locale resets the player.

**Persistence**
- Stores opt in with `persist: { paths, version }` (`plugins/persist.js`, keys prefixed `hobart-heritage:`).
- Bump `version` whenever the persisted shape changes.
- `setLocale` saves the locale separately.

- **Loading & API budget.** Route chunks prefetch behind the splash; landmark-photo host is preconnected (`index.html`); splash photo is WebP. Routes: `planRouteOptions` caches per trip in memory for 3 minutes, and `useWalkingRoute` re-plans only when the walker has moved ≥ 50 m *and* left the planned route (`needsReplan` in `lib/guidance.js`) — never on every GPS fix. Open-Meteo elevations are cached in memory for 3 minutes (no longer in localStorage). GPS: screens call `location.acquire()` / `release()`; the watch stops when none need it. The simulated weather timer pauses while the tab is hidden. Home cards show no walking time (the walker's position is unknown there).

- **Site photos.** Every site has ≥ 10 gallery photos (test-enforced). New ones are openly licensed Wikimedia Commons / Flickr photos, hot-linked (not re-hosted) via `openPhoto(url, caption, year, description, credit(author, licence, sourceUrl), { detail })`; GalleryView shows the credit (author + licence link) the licence requires. `thumb` = `smallVersion(url)` (Commons 330px — only standard widths work; Flickr `_n`) for rails/thumbnails. `detail: true` (interiors, close-ups) keeps a photo out of the AR through-time playback. Translations of captions are index-aligned in `src/i18n/content/*.js`. Don't add a photo without a verified licence and author.

- **Site facts (checked 2026-09-28).** Dates/descriptions follow: St George's parish history (consecrated 1838, tower 1841–47, portico 1888, ramp 2017), Tasmanian Heritage Register THR12092 (Penitentiary Chapel 1831–34, courts 1859–60), narryna.com.au (1835–40, Greek Revival, first folk museum 1955), Salamanca Arts Centre / Tasmanian Life (warehouses 1830s–1840s, whale oil, wool, grain, imports), femalefactory.org.au + Wikipedia (Cascades — with an s — opened 1828). Coordinates from Google Maps place pins. Keep these when editing copy; don't reintroduce unsourced claims.
- **Weather is read-only (owner).** No walk/route button on S11: conditions, best time, this week, advice. Planning starts from the Map tab.
- **Tab bar.** Selection is a soft capsule + tint inside the bar (nothing on the top edge); tab icons are fixed (no live weather icon).

- **Performance rules (slowdown fix, 2026-09-28).** AR camera 360°: the panorama is mounted on first use per landmark and then only parked (`.is-parked`, visibility hidden — never display:none / setVisible(false)); a `webglcontextlost` discards the instance and remounts. Never `new google.maps.Map` / `new StreetViewPanorama` directly — use `acquireMap` / `acquirePanorama` and release on unmount (`services/googlePool.js`); Google instances can't be destroyed and used to pile up. Per-frame transforms (gyro/drag) go through the `v-look` directive from `useLookAround`, not a `:style` binding (that re-rendered the whole AR view every frame). The AR photo stack only mounts today + the blended pair + the next photo (`inWindow`). Values that change every frame (the through-time playhead) are written by `frameDirective` directives (`v-fade`, `v-playhead`), never read in the template.

- **AR navigation map (Live View style).** A dome along the bottom (`.ar-nav__dome`, `clip-path: ellipse(56% 100% at 50% 100%)`) holding a heading-up *vector* map: `SiteMap :follow="{ position, heading }"` → GoogleMap `followCamera()` (moveCamera zoom 18, centre 30 m ahead, heading = bearing to `pointAhead`), blue heading arrow instead of the dot. Vector maps have their own pool (`acquireMap(..., { vector: true })`). Owner's decision (non-commercial project, appearance first): the Street View panorama runs full height *under* the dome, so its own Google strip is hidden; the dome's map keeps Google's logo/Terms visible (bottom 32px clear), and (owner's decision) the panorama's photographer credit is not shown either. Panorama controls sit above the dome via `bottomInset`. ETA + destination are a second line in the instruction pill; Simulate arrival is a glass chip in the dome's lower-right corner (above the 32px Google strip); The whole page is `user-select: none` (dragging to look around never highlights text).

- **Walk ahead in Street View.** AR navigation shows 3D ground chevrons (`.ar-nav__go`, CSS perspective + rotateX, turned by `arrowTurn` = route bearing from the *view's* position − view heading). Labelled "Step back · Walk ahead" buttons (glass + brand `--brand-600`, just above the dome; disabled when not possible via `canStep` / history) and a one-time coach toast say what the screen does. Walking calls `StreetView360.stepForward(heading)` (or `stepBack()` = previous panorama, pull-out transition): `bestLink(panorama.getLinks(), heading)` (lib/streetView, ≤ 60° off) → dolly-in transition (`.is-stepping`) → `setPano`. Moving is **buttons only** (owner): the chevrons are `pointer-events: none` and only show the way (`--ar-arrow` muted see-through slate face, `--ar-arrow-side` extrusion, `--ar-arrow-rim` — owner wants them low-saturation and see-through; never `--info-600`; solid in high contrast / reduced transparency), Street View's ↑/↓/W/S keys are swallowed (`blockKeyMoves`), clickToGo/linksControl stay off. The dome map follows the view's position. No link that way → toast.

## Styling rules

- **Tokens only.** Use `src/styles/tokens.css`; never write hex values in components. Camera/photo surfaces use `--camera-bg`, `--ar-arrow`, `--like-glass`, `--photo-veil-*` (all overridden for high contrast). Glass IconButtons invert to a cream fill when pressed/on. Icons are AppIcon line icons — no emoji.
- **Fonts:**
  - Playfair Display: headings.
  - Inter: body text.
  - Montserrat: labels, buttons and the tab bar.
  - Caveat: decoration only.
- **Keep the global `lining-nums` rule.** `base.css` sets `* { font-variant-numeric: lining-nums !important }` because Playfair defaults to old-style figures and every `font:` shorthand resets numeric variants.
- **Colours:** burgundy `--brand-600` is the only action colour, and `--ar-400` appears only over camera views. Exception: on the dark toast the action (Undo) uses `--accent-100`, since burgundy fails contrast there.
- **Type:** components use the `--t-*` font tokens (README §5.3), never `font: 600 12px …` or px font sizes (use rem so text follows the browser size). Prefer a token over a weight override: bold 11px labels are `--t-caption` (add `.t-caption` / `--track-caption` when uppercase), list-row / option / pill titles are `--t-row-title`. Minimum size 11px. Large headings carry their `--track-*` letter-spacing; letter-spacing is always a `--track-*` token.
- **Radii by kind:** bordered cards `--r-lg`, sheets and hero panels `--r-xl`, option rows / thumbnails / floating map buttons `--r-md`, badges, chips and pills `--r-pill`, map labels `--r-xs`.
- **Text on photos** sits on a veil token (`--photo-veil-*`, `--splash-veil-*`) or glass — never a literal rgba — so High contrast can darken it; measure the worst case over the actual photo.
- **Control outlines:** borders that identify a tappable control use `--outline` (≥ 3:1); `--sand` is for decorative borders only.
- **Touch targets** are at least 44px (grow small visuals with a transparent `::before`), and `IconButton` requires a `label`.
- **Press feedback:** every tappable element gets `.pressable`, `.pressable-card` or `.pressable-dim` (`base.css`). If the component declares its own `transition`, include both `scale` and `opacity` in it (reduced motion turns the press into a dim that must ease back). Wrap `:hover` in `@media (hover: hover)`.
- **Materials:** translucent chrome uses `--material-bar` + `backdrop-filter: var(--material-blur)` (both turn solid under reduced transparency / high contrast); prefer a scroll-edge fade over a hard divider.
- **Haptics:** `services/haptics.js` `haptic(kind)` only for meaningful moments (arrival, stop added/removed/full, dot scrub) — don't add it to ordinary taps.
- **Motion:** durations and easings are tokens (`--dur-*`, `--ease*`; `--dur-loop` for looping hints); animate transform / opacity only (no `filter` or layout properties in transitions); multiply every travel distance / zoom by `var(--motion)` (0 under reduced motion → cross-fade). Gestures use `useSheetDrag` / `useSwipePager` with the physics in `lib/gesture.js` (velocity tracking, projection, rubber-band, `pagerStep`) and `lib/spring.js` (Apple damping/response springs; sheets are spring-driven, so never put a CSS `transition` on their `transform`). `BottomSheet` teleports to `#sheet-layer` in `App.vue`; the page recedes behind it via `:has()` in `base.css`. Type and spacing tokens are rem; route transitions come from `lib/pageTransition.js` (which transition + `pageStyle`) and are spring-driven by `composables/usePageTransition.js` through `<Transition :css="false">` hooks, so don't add CSS classes for them.
- **Display preferences:** `stores/prefs.js` sets `data-text` and `data-contrast` on `<html>`.
  - High contrast overrides tokens in `tokens.css`, so colours must come from tokens.
  - Put quiet button fills on `--sand-fill`, not `--sand`, which darkens to an outline colour in high contrast.
  - Larger text scales anything with the `.text-zoom` class. Add it to new text surfaces, but never to a map or camera view: their pointer maths assume an unscaled box.

## Tests

- Vitest runs in the `node` environment with no DOM.
- Specs cover `lib/`, the pure helpers in `services/`, stores and i18n parity. There are no component tests.
- Put new logic in `lib/`, or export it as a pure function, so it can be tested.
- **px vs rem.** Type and spacing tokens are rem. Component margin/padding/gap and the heights of text-holding controls (chips, badges, buttons, like pill, stop chips, counters) are rem too, so they grow with the browser text size. Keep px for borders, shadows, radii, `--hit`, hit-area insets/negative margins, fixed-size graphics, map/AR/Street View geometry, the splash, tab bar and device frame (owner: nothing that changes the look).
- **Design notes (desktop only).** `components/layout/DesignNotes.vue`, mounted by `DeviceFrame` (≥ 960px + mouse, own lazy chunk, open/closed in localStorage): annotated-figure callouts in the dark gutters, each with a leader line + arrow to the phone's edge level with its control. Controls are marked `data-req="FR3"` (space-separated IDs; first visible one wins); side = which half of the phone the control is in; stacking = `layoutColumn` (lib, tested); placement runs per frame writing styles directly (no re-render). Hover/focus a note → details + a highlight outline over the control (the only thing ever drawn over the phone). Unanchored/every-screen notes sit at the bottom without a line. Content: header = screen number, name and design intent; each note = rationale from `data/designRationale.js` (title, why, principle, evidence, trade-off; keyed `screen:ID`, `*:ID` for every screen) + its RTM trace (requirement, personas, workflows, status) quoted from `rtm.csv` / `personas.md`. The S1 Leading Page is detected in the frame loop (`.splash` inside `.device`). English only (showcase copy); UI labels are in all five locales. Route → IDs in `lib/designNotes.js` `ROUTE_REQUIREMENTS` (+ `EVERY_SCREEN`); `tests/lib/designNotes.spec.js` fails if an ID is unknown, a requirement is shown nowhere, or a route name is wrong, or a route's requirement has no `data-req` anchor — update the map/anchors when the RTM or routes change. Only the labels are translated.
- **Consistency rules (audit round 6).** One AR tone: `--ar-400` is the muted slate-blue #a4c6d6 used by the scan frame, scan line, arrows (`--ar-arrow*`) and bubble halo (`--ar-glow`; selected = `--brand-halo`). List rows in sheets and the Nearest shortcut share one icon tile: `--row-icon` (40px), `--r-md`, 20px icon, `--sand-fill`/ink resting, paper/brand when selected; row title `--t-h3` 600, secondary line `--t-meta`. PageHeader title is `--t-title` (17px). README §5.2 still lists `--ar-400` as #38BDF8 — owner updates README.
- **Take part (desktop design notes).** Top-left of the stage are two peer buttons, "Design notes" (toggle) and "Scenario Task"; below them either the screen header or the `components/layout/SurveyPicker.vue` panel. The bar never exceeds the window (the panel's task list scrolls inside; the form part stays in view). Hover ring = a box the size of the control with its own border-radius, paper + brand focus-ring shadow, clipped to the phone screen. SurveyPicker: pick P1/P2/P3 (`PersonaAvatar` = the team's persona portraits, `assets/images/personas/*.webp`, 192px round crops) → that persona's intro (left panel) and Task 1–3 (a card in the right-hand column, `.notes__tasks`) copied word for word from its Google Form (`data/surveyForms.js`; re-copy if a form changes) → Google Form A/B/C by the QR code only (scan, or click it) (`data/surveyForms.js`; QR paths pre-encoded, version 3-M, decode-checked — regenerate if a URL changes). While it's open the callouts hide. The button uses `--accent-100` (action colour on dark surfaces).
- **Desktop mock-up size.** The phone is always 390px wide (real iPhone width); only its height follows the window (≤ 844px). Never shrink the width to keep an aspect ratio — that squeezed the app's layout on laptop screens. Design notes: a column that can't fit its notes switches to compact (title only, `data-compact`), and while the Leading Page is up only its own `data-req` anchors count.
- **Scenario Task details.** Personas come from `parsePersonas` as `{ name, age, role, label }` — show the name alone and "Age 22 · role" underneath in small type (never "(Age: 22)"). `ScenarioTasks.vue` (right-hand card): tasks run one at a time — segmented progress bar, finished tasks folded to one line (tap to reopen, which re-locks later ones), the current task open with one "Done, next task" button, later tasks locked (lock icon). Progress = `localStorage` `scenario-task-progress` per persona. After the last task: medal + burst (reduced motion: fade) pointing to the QR code; "Start over". No Google Form link button anywhere (owner): the QR code (clickable) is the only way to the form. Button icon `tasks`.
- **Caches expire after 3 minutes (owner).** Every API-result cache (`services/routes.js`, `routeOptions.js`, `elevation.js`) is a `sharedCache()` from `lib/ttlCache.js`: entries live `CACHE_TTL_MS` (3 min), expired ones are dropped on use and swept once a minute, sizes are capped. Nothing API-related is kept in localStorage (the old `hh.elevations.v1` store is removed at startup). User settings and progress (language, display, likes, trip, design-notes toggle, scenario progress) are not caches and stay.
