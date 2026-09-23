import { describe, expect, it } from 'vitest'
import en from '@/i18n/messages/en'
import zhHant from '@/i18n/messages/zh-Hant'
import ja from '@/i18n/messages/ja'
import ko from '@/i18n/messages/ko'
import vi from '@/i18n/messages/vi'
import { localizeSite } from '@/i18n/content'
import { SITES } from '@/data/sites'
import { WAYPOINTS, NAVIGATION_MODES, ROUTE_TYPES } from '@/data/navigation'
import { CATEGORIES } from '@/data/categories'

/** All leaf key paths of a nested messages object. */
const keysOf = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)
const placeholders = (text) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort()

const english = keysOf(en).sort()

describe.each([
  ['zh-Hant', zhHant],
  ['ja', ja],
  ['ko', ko],
  ['vi', vi],
])('%s UI messages', (_code, messages) => {
  it('has exactly the same keys as English', () => {
    expect(keysOf(messages).sort()).toEqual(english)
  })
  it('keeps every {placeholder} used by the English string', () => {
    for (const key of english) {
      expect(placeholders(get(messages, key)), key).toEqual(placeholders(get(en, key)))
    }
  })
})

describe('data ↔ message keys', () => {
  it('every category, waypoint, route type and navigation mode has a label', () => {
    for (const c of CATEGORIES) expect(get(en, `categories.${c.key}`)).toBeTruthy()
    for (const w of WAYPOINTS) expect(get(en, `waypoints.${w.id}`)).toBeTruthy()
    for (const r of ROUTE_TYPES) expect(get(en, `routeTypes.${r.key}.description`)).toBeTruthy()
    for (const m of NAVIGATION_MODES) expect(get(en, `navModes.${m.route}.title`)).toBeTruthy()
  })
})

describe('localizeSite', () => {
  const site = SITES[0]
  it('returns English unchanged', () => {
    expect(localizeSite(site, 'en')).toBe(site)
  })
  it('translates description, captions and "Present day", keeping names and images', () => {
    const zh = localizeSite(site, 'zh-Hant')
    expect(zh.name).toBe(site.name)
    expect(zh.description).not.toBe(site.description)
    expect(zh.gallery[0].image).toBe(site.gallery[0].image)
    expect(zh.gallery[0].year).toBe('現今')
    expect(zh.gallery[3].year).toBe('1892')
  })
  it('falls back to English for anything untranslated', () => {
    const unknown = localizeSite({ ...site, id: 999 }, 'ja')
    expect(unknown.description).toBe(site.description)
  })
})
