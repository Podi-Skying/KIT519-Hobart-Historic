/**
 * Localised content. English source data lives in src/data; translations in
 * ./content/<locale>.js override individual fields, and anything missing falls
 * back to English — so adding a site never breaks another language.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SITES } from '@/data/sites'
import { NARRATION } from '@/data/narration'
import zhHant from './content/zh-Hant'
import ja from './content/ja'
import ko from './content/ko'
import vi from './content/vi'

const CONTENT = { 'zh-Hant': zhHant, ja, ko, vi }

/**
 * @param {import('@/data/sites').HeritageSite} site
 * @param {string} locale
 */
export function localizeSite(site, locale) {
  const pack = CONTENT[locale]
  if (!site || !pack) return site
  const t = pack.sites?.[site.id] ?? {}
  return {
    ...site,
    categoryLabel: t.categoryLabel ?? site.categoryLabel,
    area: pack.areas?.[site.area] ?? site.area,
    description: t.description ?? site.description,
    gallery: site.gallery.map((photo, i) => ({
      ...photo,
      caption: t.gallery?.[i]?.caption ?? photo.caption,
      description: t.gallery?.[i]?.description ?? photo.description,
      year: photo.year === 'Present day' ? (pack.presentDay ?? photo.year) : photo.year,
    })),
    timeTravel: site.timeTravel && {
      ...site.timeTravel,
      pastCaption: t.timeTravel?.pastCaption ?? site.timeTravel.pastCaption,
      presentCaption: t.timeTravel?.presentCaption ?? site.timeTravel.presentCaption,
    },
  }
}

/** Narration script for a site in the given language (title + transcript lines). */
export function localizeNarration(siteId, locale) {
  const source = NARRATION[siteId]
  if (!source) return null
  const t = CONTENT[locale]?.narration?.[siteId]
  return {
    ...source,
    title: t?.title ?? source.title,
    transcript: t?.transcript?.length === source.transcript.length ? t.transcript : source.transcript,
  }
}

/** Reactive, language-aware access to site content for components. */
export function useContent() {
  const { locale } = useI18n()
  const sites = computed(() => SITES.map((site) => localizeSite(site, locale.value)))
  const siteById = (id) => sites.value.find((s) => s.id === Number(id))
  return { locale, sites, siteById }
}
