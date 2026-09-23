<script setup>
/**
 * Home tab.
 * Layout follows content hierarchy: title → featured Top 5 carousel → the full
 * list *with its own filters directly above it*. Search + category chips only
 * affect "All Heritage Sites", so they live with that list (and stick to the top
 * while scrolling it), not in the page header where they'd appear to filter the carousel.
 * Filters are kept in the URL query (?category=convict&q=sal) so they survive
 * back-navigation and can be shared.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppPage from '@/components/layout/AppPage.vue'
import ChipGroup from '@/components/base/ChipGroup.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SearchField from '@/components/home/SearchField.vue'
import HeritageCarousel from '@/components/home/HeritageCarousel.vue'
import SiteGridCard from '@/components/home/SiteGridCard.vue'
import { SITES } from '@/data/sites'
import { ALL_CATEGORIES, CATEGORIES } from '@/data/categories'
import { filterSites } from '@/lib/sites'
import { pluralize } from '@/lib/format'
import { useFavoritesStore } from '@/stores/favorites'

defineOptions({ name: 'HomeView' })

const TOP_COUNT = 5
const STATUS_BAR = 44

const route = useRoute()
const router = useRouter()
const favorites = useFavoritesStore()

// ---- filters (URL-backed) ----
const category = computed(() => String(route.query.category ?? ALL_CATEGORIES))
const query = computed(() => String(route.query.q ?? ''))

function updateQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const key of Object.keys(next)) {
    if (!next[key] || next[key] === ALL_CATEGORIES) delete next[key]
  }
  router.replace({ query: next })
}
const resetFilters = () => router.replace({ query: {} })

const topSites = computed(() => favorites.rankedSites.slice(0, TOP_COUNT))
const results = computed(() => filterSites(SITES, { category: category.value, query: query.value }))

const listTitle = computed(() => {
  if (query.value.trim()) return `Results for “${query.value.trim()}”`
  if (category.value === ALL_CATEGORIES) return 'All Heritage Sites'
  return `${CATEGORIES.find((c) => c.key === category.value)?.label ?? ''} Sites`
})

// ---- layout: status bar turns cream once the white header is gone ----
const header = ref(null)
const headerHeight = ref(120)

// ---- filter bar gets a divider shadow only while it is stuck ----
const page = ref(null)
const sentinel = ref(null)
const filtersStuck = ref(false)
let observer

onMounted(() => {
  headerHeight.value = header.value?.offsetHeight ?? headerHeight.value
  observer = new IntersectionObserver(([entry]) => (filtersStuck.value = !entry.isIntersecting), {
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
      <p class="home-header__eyebrow">Hobart, Tasmania</p>
      <h1 class="t-h1">Heritage Guide</h1>
    </header>

    <HeritageCarousel title="Top 5 Heritages" subtitle="Ranked by likes" :sites="topSites" />

    <section class="directory" aria-label="All heritage sites">
      <SectionHeader :title="listTitle">
        <template #action>
          <span class="directory__count" aria-live="polite">{{ pluralize(results.length, 'site') }}</span>
        </template>
      </SectionHeader>

      <!-- zero-height marker: when it scrolls under the status bar, the filter bar is stuck -->
      <div ref="sentinel" aria-hidden="true" />
      <div class="filters" :class="{ 'is-stuck': filtersStuck }" role="search">
        <SearchField :model-value="query" @update:model-value="(q) => updateQuery({ q })" />
        <ChipGroup
          class="filters__chips"
          label="Filter by category"
          :options="CATEGORIES"
          :model-value="category"
          @update:model-value="(c) => updateQuery({ category: c })"
        />
      </div>

      <div v-if="results.length" class="site-grid">
        <SiteGridCard v-for="site in results" :key="site.id" :site="site" />
      </div>
      <EmptyState v-else title="No sites found" message="Try another name or category.">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">Clear filters</BaseButton>
      </EmptyState>
    </section>
  </AppPage>
</template>

<style scoped>
.home-header {
  padding: 54px var(--gutter) var(--s-2);
  background: var(--paper);
}
.home-header__eyebrow {
  font: 400 13px var(--font-body);
  color: var(--ink-500);
}
.directory__count {
  font: var(--t-small);
  color: var(--ink-500);
}
/* Sticky toolbar: pins just below the floating status bar while the list scrolls */
.filters {
  position: sticky;
  top: var(--safe-top);
  z-index: 5;
  display: grid;
  gap: var(--s-3);
  padding: 0 var(--gutter) var(--s-4);
  background: var(--cream);
  transition: box-shadow var(--dur) var(--ease);
}
.filters.is-stuck {
  padding-top: var(--s-2);
  box-shadow: 0 8px 12px -10px rgba(44, 36, 23, 0.35);
}
.site-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  padding: var(--s-1) var(--gutter) var(--s-6);
}
</style>
