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

## Architecture

**Layering** (README §4.1):

```
data/ (static content) → lib/ (pure functions) → services/ (external APIs)
  → stores/ (Pinia user state) → views/ (one per route, lazy-loaded) → components/
```

`components/base` must not import stores, router or `data/`.

**App shell and routing**
- **Shell.** `App.vue` wraps everything in `DeviceFrame` (StatusBar, routed view, TabBar, Toast). `SplashScreen` overlays it on every launch.
- **Router.** It uses hash history, and Vite uses `base: './'`, so `dist/` runs from any static sub-path.
- **Route `meta` drives the chrome:**
  - `tab`: the active tab-bar item.
  - `hideTabBar`: hides the tab bar for full-screen navigation.
  - `status`: status-bar tone and background (documented in `router/index.js`).
- **HomeView caching.** `HomeView` is kept alive by component name through `defineOptions({ name: 'HomeView' })`. Renaming it breaks the `KeepAlive include`.
- **Home filters** live in the URL query (`?category=&q=`).

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
   - Steep has the highest `difficultyScore` within 1.9× Normal's time, and is never the Accessible pick.

- **No alternative.** If no route differs, the UI says "same as Normal" instead of inventing one.
- **Minutes and caching.** Minutes add Naismith's rule (+1 min per 10 m climbed). Results are cached per points and language, and the composable re-routes only after 50 m of movement.
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

## Styling rules

- **Tokens only.** Use `src/styles/tokens.css`; never write hex values in components.
- **Fonts:**
  - Playfair Display: headings.
  - Inter: body text.
  - Montserrat: labels, buttons and the tab bar.
  - Caveat: decoration only.
- **Keep the global `lining-nums` rule.** `base.css` sets `* { font-variant-numeric: lining-nums !important }` because Playfair defaults to old-style figures and every `font:` shorthand resets numeric variants.
- **Colours:** burgundy `--brand-600` is the only action colour, and `--ar-400` appears only over camera views.
- **Touch targets** are at least 44px, and `IconButton` requires a `label`.

## Tests

- Vitest runs in the `node` environment with no DOM.
- Specs cover `lib/`, the pure helpers in `services/`, stores and i18n parity. There are no component tests.
- Put new logic in `lib/`, or export it as a pure function, so it can be tested.
