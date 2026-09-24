/**
 * Evidence capture for the A3 evaluation.
 *
 * Walks every screen of the prototype on a phone-sized viewport, saves a screenshot per step
 * and runs an axe-core WCAG 2.2 A/AA scan on each one. Run it before and after a design change
 * so the two folders can be compared side by side.
 *
 *   cd docs/a3/evaluation/tools && npm install
 *   node capture.mjs --label before                       # live site
 *   node capture.mjs --label after --base http://localhost:5173/
 *   node capture.mjs --label after --only weather,print   # just some steps
 *   node capture.mjs --label before-ko --locale ko         # another UI language
 *
 * Output: ../evidence/<label>/NN-step.png, axe.json, axe-summary.md
 * Needs a local Google Chrome (set CHROME_PATH to use another Chromium browser).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]?.startsWith('--') ? true : (all[i + 1] ?? true)])
    return pairs
  }, []),
)
const BASE = args.base ?? 'https://podi-skying.github.io/KIT519-Hobart-Historic/'
const LABEL = args.label ?? 'capture'
const LOCALE = args.locale ?? 'en'
const ONLY = args.only ? String(args.only).split(',') : null
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = join(here, '..', 'evidence', LABEL)

/** WCAG 2.2 A + AA rules only (best-practice rules are not conformance failures). */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- step helpers -------------------------------------------------------------------------------
const go = (hash, wait = 1200) => async (page) => {
  await page.evaluate((h) => (location.hash = h), hash)
  await sleep(wait)
}
const click = (selector, wait = 700) => async (page) => {
  await page.waitForSelector(selector, { timeout: 5000 })
  await page.click(selector)
  await sleep(wait)
}
/** Click the first button/link whose visible text contains `text`. */
const clickText = (text, wait = 700) => async (page) => {
  const ok = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button, a, [role=button]')].find((e) => e.textContent.includes(t))
    el?.click()
    return Boolean(el)
  }, text)
  if (!ok) throw new Error(`No control with text "${text}"`)
  await sleep(wait)
}
/** Scroll the page's scroll container (AppPage `.page`) to the bottom. */
const scrollDown = (wait = 500) => async (page) => {
  await page.evaluate(() => {
    const el = document.querySelector('main.page') ?? document.scrollingElement
    el.scrollTop = el.scrollHeight
  })
  await sleep(wait)
}
/** Map tab: close the selected-destination panel so the browse panel (stops) shows. */
const closeSelected = async (page) => {
  await page.evaluate(() => document.querySelector('.panel__selected .selected button[aria-label]')?.click())
  await sleep(500)
}
const run = (...steps) => async (page) => {
  for (const step of steps) await step(page)
}

/**
 * The walkthrough: [name, action]. Each step is screenshotted and scanned after its action.
 * Order matters — later steps build on the state left by earlier ones.
 */
const STEPS = [
  ['splash', async () => {}],
  ['home', run(click('.splash', 1200), go('#/home'))],
  ['home-list', scrollDown()],
  ['language-sheet', run(go('#/home'), click('.language-button'))],
  ['site-detail', run(async (p) => p.keyboard.press('Escape'), go('#/sites/1'))],
  ['site-detail-gallery', scrollDown()],
  ['audio-tour', go('#/sites/1/audio')],
  ['gallery', go('#/sites/1/gallery/0')],
  ['map-browse', go('#/map', 2500)],
  ['map-selected', click('.nearest', 2500)],
  ['navigate-modes', go('#/navigate/1')],
  ['navigate-standard', go('#/navigate/1/map', 3000)],
  ['navigate-ar', go('#/navigate/1/ar', 2500)],
  ['navigate-ar-arrived', clickText('Simulate arrival', 900)],
  ['navigate-print', run(go('#/home', 300), go('#/navigate/1/print', 3000))],
  ['navigate-print-steps', scrollDown()],
  ['ar-camera', go('#/ar/1', 2500)],
  ['ar-compare', go('#/ar/1/compare', 1500)],
  ['weather', go('#/weather')],
  ['weather-bottom', scrollDown()],

  // ---- Round 1 refinements (these steps fail harmlessly on builds that predate them) ----
  ['display-settings', run(go('#/home'), click('.language-button'))],
  ['display-both-on', run(clickText('Larger text', 300), clickText('High contrast', 500))],
  ['home-large-contrast', run(async (p) => p.keyboard.press('Escape'), go('#/home', 900))],
  ['site-detail-large-contrast', go('#/sites/1')],
  ['map-large-contrast', go('#/map', 2500)],
  ['display-reset', run(go('#/home'), click('.language-button'), clickText('Larger text', 300), clickText('High contrast', 500))],
  ['weather-plan-accessible', run(async (p) => p.keyboard.press('Escape'), go('#/weather'), scrollDown(), clickText('Plan an accessible walk', 1200))],
  ['map-accessible-preselected', run(closeSelected, click('.nearest', 2500))],
  ['navigate-standard-arrived', run(go('#/navigate/1/map', 3000), clickText('Simulate arrival', 900))],
  ['print-stops-facts', run(go('#/map', 1500), closeSelected, clickText('Salamanca', 400), clickText('Narryna', 400), go('#/navigate/1/print', 3000), scrollDown())],
]

// ---- main ---------------------------------------------------------------------------------------
await mkdir(OUT, { recursive: true })
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--lang=en-AU'] })
const page = await browser.newPage()
await page.emulate({
  viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
})
// Same language for the app and for Google Maps, whatever the machine's own locale is.
await page.setExtraHTTPHeaders({ 'Accept-Language': `${LOCALE},en;q=0.8` })
await page.evaluateOnNewDocument((lang) => {
  Object.defineProperty(navigator, 'language', { get: () => lang })
  Object.defineProperty(navigator, 'languages', { get: () => [lang] })
}, LOCALE)
// Deny geolocation so every run starts from the same default origin (Centenary Building).
await browser.defaultBrowserContext().overridePermissions(new URL(BASE).origin, [])
// Start from a clean slate: chosen UI language, no saved likes/stops/preferences.
await page.goto(BASE, { waitUntil: 'networkidle2' })
await page.evaluate((lang) => {
  localStorage.clear()
  localStorage.setItem('hobart-heritage:locale', JSON.stringify(lang))
}, LOCALE)
await page.goto(`${BASE}#/home`, { waitUntil: 'networkidle2' })
await sleep(1500)

const results = []
let n = 0
for (const [name, action] of STEPS) {
  n += 1
  const file = `${String(n).padStart(2, '0')}-${name}.png`
  try {
    await action(page)
  } catch (error) {
    console.warn(`✗ ${name}: ${error.message}`)
    results.push({ step: name, error: error.message })
    continue
  }
  if (ONLY && !ONLY.includes(name)) continue
  await page.screenshot({ path: join(OUT, file) })

  if (!(await page.evaluate(() => 'axe' in window))) await page.evaluate(axeSource)
  const axe = await page.evaluate(
    (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] }),
    AXE_TAGS,
  )
  const violations = axe.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    wcag: v.tags.filter((t) => /^wcag\d/.test(t)),
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((node) => node.target.join(' ')),
  }))
  results.push({ step: name, screenshot: file, url: page.url(), violations })
  console.log(`✓ ${file} — ${violations.length} axe rule(s) failing`)
}
await browser.close()

await writeFile(join(OUT, 'axe.json'), JSON.stringify({ base: BASE, date: new Date().toISOString(), tags: AXE_TAGS, results }, null, 2))

const lines = [
  `# axe-core scan — ${LABEL}`,
  '',
  `Base: ${BASE} · ${new Date().toISOString().slice(0, 10)} · rules: ${AXE_TAGS.join(', ')} · viewport 390×844`,
  '',
  '| Step | Screenshot | Failing rules (impact · affected nodes) |',
  '| --- | --- | --- |',
  ...results.map((r) =>
    r.error
      ? `| ${r.step} | — | step failed: ${r.error} |`
      : `| ${r.step} | [${r.screenshot}](${r.screenshot}) | ${r.violations.map((v) => `\`${v.id}\` (${v.impact} · ${v.nodes})`).join('<br>') || 'none'} |`,
  ),
]
await writeFile(join(OUT, 'axe-summary.md'), `${lines.join('\n')}\n`)
console.log(`\nSaved to ${OUT}`)
