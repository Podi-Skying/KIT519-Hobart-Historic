/**
 * Internationalisation.
 *  - UI strings: vue-i18n messages in ./messages/<locale>.js (English is the source).
 *  - Content (site descriptions, captions, narration…): English lives in src/data,
 *    translations in ./content/<locale>.js, merged by ./content.js.
 * Missing keys always fall back to English.
 */
import { createI18n } from 'vue-i18n'
import { storage } from '@/lib/storage'
import en from './messages/en'
import zhHant from './messages/zh-Hant'
import ja from './messages/ja'
import ko from './messages/ko'
import vi from './messages/vi'

/**
 * Supported languages.
 *  label   shown in the language picker (native name)
 *  short   compact badge on buttons
 *  speech  BCP-47 tags to look for when choosing a text-to-speech voice, best first
 */
export const LOCALES = [
  { code: 'en', label: 'English', english: 'English', short: 'EN', speech: ['en-AU', 'en-GB', 'en-US', 'en'] },
  { code: 'zh-Hant', label: '繁體中文', english: 'Chinese (Traditional)', short: '繁中', speech: ['zh-TW', 'zh-HK', 'zh-Hant', 'zh'] },
  { code: 'ja', label: '日本語', english: 'Japanese', short: '日本', speech: ['ja-JP', 'ja'] },
  { code: 'ko', label: '한국어', english: 'Korean', short: '한국', speech: ['ko-KR', 'ko'] },
  { code: 'vi', label: 'Tiếng Việt', english: 'Vietnamese', short: 'VI', speech: ['vi-VN', 'vi'] },
]
export const DEFAULT_LOCALE = 'en'
const STORAGE_KEY = 'hobart-heritage:locale'

const isSupported = (code) => LOCALES.some((l) => l.code === code)

/** Saved choice → otherwise the browser language (if supported) → English. */
function initialLocale() {
  const saved = storage.read(STORAGE_KEY)
  if (isSupported(saved)) return saved
  const browser = typeof navigator !== 'undefined' ? navigator.language ?? '' : ''
  if (/^zh-(TW|HK|MO|Hant)/i.test(browser)) return 'zh-Hant'
  const base = browser.split('-')[0]
  return isSupported(base) ? base : DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, 'zh-Hant': zhHant, ja, ko, vi },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false,
})

export const localeInfo = (code) => LOCALES.find((l) => l.code === code) ?? LOCALES[0]

function applyDocumentLang(code) {
  if (typeof document !== 'undefined') document.documentElement.lang = code
}
applyDocumentLang(i18n.global.locale.value)

/** Switch the whole app (UI, content, narration voice) to another language. */
export function setLocale(code) {
  if (!isSupported(code)) return
  i18n.global.locale.value = code
  storage.write(STORAGE_KEY, code)
  applyDocumentLang(code)
}
