# Accessibility audit (WCAG 2.2 AA)

- **Automated:** axe-core 4.x with rule tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
  `wcag22aa`, run on every screen state by [`tools/capture.mjs`](../tools/capture.mjs).
  Viewport is 390 × 844 in English, with location denied.
- **Manual:** kit §10 checklist.

## Automated results

| | Before (`9432967`) | After Round 1 (`a1cc4c7`+) |
| --- | --- | --- |
| Screen states scanned | 20 | 31 (20 + 11 new Round 1 states) |
| **App-owned rule failures** | **3 rule types** on 4 states: `listitem` (language sheet, 5 nodes); `scrollable-region-focusable` (weather ×2) | **0** |
| Third-party (Google Maps footer controls) | `target-size`: "Map data", "Terms" in the AR mini map | `target-size`: "Map data", "Terms", "Keyboard shortcuts" on map screens |
| False positive | `color-contrast` on the mock-up status-bar clock "9:41" over a photo (decorative, `aria-hidden`) | same |

Full tables: [before](../evidence/before/axe-summary.md) · [after](../evidence/after/axe-summary.md).
The raw JSON in the same folders gives the node selectors.

**Third-party controls:** Google requires its attribution links and they can't be restyled, so
they are documented as an exception (A11Y-4). The interactive map offers keyboard access
through Google's own shortcuts, and every map function also has an app control outside the map
(nearest site, route cards).

## Manual checks

| SC | Check | Result (E0, 24 Sep) | Still to do (E1) |
| --- | --- | --- | --- |
| 1.1.1 | Text alternatives | **Fixed:** weather conditions and comfort chart had none (A11Y-3). Photos have `alt`; icon buttons have `aria-label` (IconButton requires it) | VoiceOver pass on iPhone |
| 1.3.1 | Structure | **Fixed:** language list semantics (A11Y-1). Route types and languages are radiogroups; display options are `role="switch"` with `aria-checked` | VoiceOver pass |
| 1.4.2 | Audio control | **Pass:** narration never autoplays (arrival sheet offers it; ArrivalSheet.vue documents why) | — |
| 1.4.3 | Contrast | **Pass:** tokens are AA/AAA (README §5.2). High contrast raises secondary text to ≈ 11:1 | Spot-check over photos in sunlight |
| 1.4.4 / 1.4.10 | Resize / reflow | **Pass (Larger text 1.2×):** screenshots 23–25 show no horizontal page scroll | Check at 200 % browser zoom |
| 1.4.11 | Non-text contrast | High contrast darkens outlines to #8C7B5E (≈ 3.6:1 on cream). The default theme's sand outlines are decorative, because cards are also identified by their content | Confirm chart bars in the default theme |
| 2.1.1 | Keyboard | **Fixed:** weather forecast strip is focusable (A11Y-2); the map panel's Hide button is keyboard-operable (A11Y-5) | Full keyboard-only run of T1–T9 |
| 2.4.7 | Focus visible | **Pass:** `--focus-ring` everywhere; in high contrast it becomes a solid 3 px ring (#2C2417) | — |
| 2.5.7 | Dragging movements | **Fixed:** map panel (Hide button). Bottom sheets have ✕. **Open:** AR bubble repositioning is drag-only (A11Y-6, severity 1) | Decide in Round 2 |
| 2.5.8 | Target size | **Pass** for app controls (44 px rule; the Hide grip is 96 × 32). Google attribution is an exception | — |
| 3.1.1 / 3.1.2 | Language | **Pass:** `<html lang>` follows the chosen language (`src/i18n/index.js`); language names carry their own `lang` | — |
| 2.3.3 (AAA) | Motion | **Pass:** `prefers-reduced-motion` disables animations (base.css) | — |
