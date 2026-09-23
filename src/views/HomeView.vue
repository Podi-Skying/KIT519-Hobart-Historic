<script setup>
/**
 * Home tab.
 * Layout follows content hierarchy: title (+ language) → featured Top 5 carousel →
 * the full list with its own toolbar. The toolbar (title, count, search button,
 * category chips) sticks to the top while the list scrolls. Search collapses to an
 * icon until needed, so it takes no space for people who just browse.
 * Filters live in the URL query (?category=convict&q=sal) so they survive
 * back-navigation and can be shared.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import LanguageButton from '@/components/layout/LanguageButton.vue'
import IconButton from '@/components/base/IconButton.vue'
import ChipGroup from '@/components/base/ChipGroup.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SearchField from '@/components/home/SearchField.vue'
import HeritageCarousel from '@/components/home/HeritageCarousel.vue'
import SiteGridCard from '@/components/home/SiteGridCard.vue'
import { ALL_CATEGORIES, CATEGORIES } from '@/data/categories'
import { filterSites, rankByLikes } from '@/lib/sites'
import { useContent } from '@/i18n/content'
import { useFavoritesStore } from '@/stores/favorites'

defineOptions({ name: 'HomeView' })

const TOP_COUNT = 5
const STATUS_BAR = 44

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { sites } = useContent()
const favorites = useFavoritesStore()

// ---- filters (URL-backed) ----
const category = computed(() => String(route.query.category ?? ALL_CATEGORIES))
const query = computed(() => String(route.query.q ?? ''))
const categoryOptions = computed(() => CATEGORIES.map((c) => ({ key: c.key, label: t(`categories.${c.key}`) })))

function updateQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const key of Object.keys(next)) {
    if (!next[key] || next[key] === ALL_CATEGORIES) delete next[key]
  }
  router.replace({ query: next })
}
const resetFilters = () => {
  searchOpen.value = false
  router.replace({ query: {} })
}

// ---- search: an icon until opened ----
const searchOpen = ref(Boolean(query.value))
/** Autofocus only when the user opened search (not when restored from the URL). */
const focusOnOpen = ref(false)
function openSearch() {
  focusOnOpen.value = true
  searchOpen.value = true
}
function closeSearch() {
  searchOpen.value = false
  updateQuery({ q: '' })
}

const topSites = computed(() => rankByLikes(sites.value, favorites.likeCount).slice(0, TOP_COUNT))
const results = computed(() => filterSites(sites.value, { category: category.value, query: query.value }))

const listTitle = computed(() => {
  if (query.value.trim()) return t('home.resultsFor', { query: query.value.trim() })
  if (category.value === ALL_CATEGORIES) return t('home.allSites')
  return t('home.categorySites', { category: t(`categories.${category.value}`) })
})

// ---- layout: status bar turns cream once the white header is gone ----
const header = ref(null)
const headerHeight = ref(120)

// ---- toolbar gets a divider shadow only while it is stuck ----
const page = ref(null)
const sentinel = ref(null)
const toolbarStuck = ref(false)
let observer

onMounted(() => {
  headerHeight.value = header.value?.offsetHeight ?? headerHeight.value
  observer = new IntersectionObserver(([entry]) => (toolbarStuck.value = !entry.isIntersecting), {
    root: page.value?.scroller,
    rootMargin: `-${STATUS_BAR}px 0px 0px 0px`,
  })
  if (sentinel.value) observer.observe(sentinel.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <AppPage ref="page" :safe-top="false" :solid-after="headerHeight - STATUS_BAR">
    <header ref="header" class="home-header">
      <div>
        <p class="home-header__eyebrow">{{ t('home.eyebrow') }}</p>
        <h1 class="t-h1">{{ t('home.title') }}</h1>
      </div>
      <LanguageButton />
    </header>

    <HeritageCarousel :title="t('home.top5')" :subtitle="t('home.rankedByLikes')" :sites="topSites" />

    <section class="directory" :aria-label="t('home.allSites')">
      <!-- zero-height marker: when it scrolls under the status bar, the toolbar is stuck -->
      <div ref="sentinel" aria-hidden="true" />

      <div class="toolbar" :class="{ 'is-stuck': toolbarStuck }">
        <Transition name="swap" mode="out-in">
          <div v-if="searchOpen" key="search" class="toolbar__search" role="search">
            <SearchField
              class="toolbar__field"
              :autofocus="focusOnOpen"
              :placeholder="t('home.search')"
              :clear-label="t('home.clearSearch')"
              :model-value="query"
              @update:model-value="(q) => updateQuery({ q })"
              @keydown.esc="closeSearch"
            />
            <button type="button" class="toolbar__cancel" @click="closeSearch">{{ t('common.cancel') }}</button>
          </div>
          <div v-else key="title" class="toolbar__title">
            <h2 class="t-h2">{{ listTitle }}</h2>
            <span class="toolbar__count" aria-live="polite">{{ t('common.sites', results.length) }}</span>
            <IconButton icon="search" :label="t('home.search')" variant="sand" aria-haspopup="true" @click="openSearch" />
          </div>
        </Transition>

        <ChipGroup
          :label="t('home.filterBy')"
          :options="categoryOptions"
          :model-value="category"
          @update:model-value="(c) => updateQuery({ category: c })"
        />
      </div>

      <div v-if="results.length" class="site-grid">
        <SiteGridCard v-for="site in results" :key="site.id" :site="site" />
      </div>
      <EmptyState v-else :title="t('home.noResults')" :message="t('home.noResultsHint')">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">{{ t('home.clearFilters') }}</BaseButton>
      </EmptyState>
    </section>
  </AppPage>
</template>

<style scoped>
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  padding: 54px var(--gutter) var(--s-2);
  background: var(--paper);
}
.home-header__eyebrow {
  font: 400 13px var(--font-body);
  color: var(--ink-500);
}

/* Sticky toolbar: title + count + search, then category chips */
.toolbar {
  position: sticky;
  top: var(--safe-top);
  z-index: 5;
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* lets the chip row scroll instead of overflowing */
  gap: var(--s-3);
  padding: var(--s-4) var(--gutter) var(--s-4);
  background: var(--cream);
  transition: box-shadow var(--dur) var(--ease);
}
.toolbar.is-stuck {
  box-shadow: 0 8px 12px -10px rgba(44, 36, 23, 0.35);
}
.toolbar__title {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--hit);
}
.toolbar__title h2 {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.toolbar__count {
  font: var(--t-small);
  color: var(--ink-500);
  white-space: nowrap;
}
.toolbar__search {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--hit);
}
.toolbar__field {
  flex: 1;
  min-width: 0;
}
.toolbar__cancel {
  min-height: var(--hit);
  padding: 0 var(--s-1);
  font: 600 14px var(--font-label);
  color: var(--brand-600);
  white-space: nowrap;
}
.site-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  padding: var(--s-1) var(--gutter) var(--s-6);
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.swap-enter-from,
.swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
