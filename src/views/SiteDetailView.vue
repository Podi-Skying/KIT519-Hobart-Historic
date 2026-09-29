<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import IconButton from '@/components/base/IconButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import GalleryRail from '@/components/site/GalleryRail.vue'
import { useContent } from '@/i18n/content'
import { useFavoritesStore } from '@/stores/favorites'
import { useTripStore } from '@/stores/trip'
import { useGoBack } from '@/composables/useGoBack'

const props = defineProps({
  id: { type: Number, required: true },
})

const HERO_HEIGHT = 320

const router = useRouter()
const { t } = useI18n()
const { siteById } = useContent()
const favorites = useFavoritesStore()
const trip = useTripStore()
const goBack = useGoBack({ name: 'home' })

const site = computed(() => siteById(props.id))
const liked = computed(() => favorites.isLiked(props.id))

function startRoute() {
  trip.setDestination(props.id)
  router.push({ name: 'navigate-map', params: { id: props.id } })
}
</script>

<template>
  <AppPage :safe-top="false" :solid-after="HERO_HEIGHT - 48">
    <div class="hero" :style="{ height: `${HERO_HEIGHT}px` }">
      <img :src="site.image" :alt="site.name" class="img-placeholder" fetchpriority="high" />
      <div class="hero__bar">
        <IconButton icon="back" :label="t('common.back')" @click="goBack" />
        <IconButton
          icon="heart"
          :label="liked ? t('site.removeFavourite') : t('site.addFavourite')"
          :pressed="liked"
          :filled="liked"
          class="hero__like"
          data-req="FR16"
          @click="favorites.toggle(site.id)"
        />
      </div>
    </div>

    <article class="sheet">
      <p class="t-caption">{{ site.categoryLabel }} · {{ site.area }}</p>
      <h1 class="t-display sheet__title">{{ site.name }}</h1>

      <ul class="facts" data-req="FR5" :aria-label="t('site.keyFacts')">
        <li><BaseBadge icon="clock">{{ t('common.built', { year: site.builtYear }) }}</BaseBadge></li>
        <li v-if="site.accessible"><BaseBadge tone="success" icon="accessible">{{ t('common.accessible') }}</BaseBadge></li>
        <li>
          <BaseBadge tone="brand" icon="heart" icon-filled>{{ t('common.likes', { n: favorites.likeCount(site) }) }}</BaseBadge>
        </li>
      </ul>

      <p class="t-body sheet__description">{{ site.description }}</p>
      <!-- Provenance: where every fact above comes from (official Tasmanian sources first) -->
      <section v-if="site.sources?.length" class="sources" :aria-labelledby="`sources-${site.id}`">
        <h2 :id="`sources-${site.id}`" class="sources__title">{{ t('site.sources') }}</h2>
        <ul class="sources__list">
          <li v-for="source in site.sources" :key="source.url">
            <a class="source pressable-dim" :href="source.url" target="_blank" rel="noopener">
              <span class="source__text">
                <span class="source__name">{{ source.title }}</span>
                <span class="source__publisher">{{ source.thr ? t('site.sourceThr', { id: source.thr }) : source.publisher }}</span>
              </span>
              <AppIcon name="external" :size="14" class="source__icon" />
            </a>
          </li>
        </ul>
      </section>

      <BaseButton block icon="navigate" data-req="FR8" @click="startRoute">{{ t('site.startRoute') }}</BaseButton>
      <div class="sheet__actions">
        <BaseButton variant="secondary" icon="headphones" :to="{ name: 'audio', params: { id: site.id } }">
          {{ t('site.audioTour') }}
        </BaseButton>
        <BaseButton variant="secondary" icon="ar" :to="{ name: 'ar', params: { id: site.id } }">{{ t('site.viewInAr') }}</BaseButton>
      </div>
    </article>

    <SectionHeader :title="t('site.throughTheYears')" :meta="t('common.photos', site.gallery.length)" />
    <GalleryRail :site="site" class="gallery" data-req="FR7" />
  </AppPage>
</template>

<style scoped>
.hero {
  position: relative;
  flex-shrink: 0;
}
.hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 38%);
  pointer-events: none;
}
.hero__bar {
  position: absolute;
  top: var(--chrome-top);
  left: var(--gutter);
  right: var(--gutter);
  z-index: 1;
  display: flex;
  justify-content: space-between;
}
.hero__like.is-active {
  background: var(--paper);
  color: var(--brand-600);
}
.sheet {
  position: relative;
  margin-top: -24px;
  padding: var(--s-6) var(--gutter) 0;
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  background: var(--cream);
}
.sheet__title {
  margin-top: 0.375rem;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin: var(--s-4) 0 var(--s-5);
  padding: 0;
  list-style: none;
}
.sheet__description {
  margin-bottom: var(--s-6);
}
.sheet__description:has(+ .sources) {
  margin-bottom: var(--s-4);
}
/* Sources read as a footnote to the story: small, secondary ink, a hairline above,
   each row a full 44px tap target that opens the source in a new tab. */
.sources {
  margin-bottom: var(--s-5);
  padding-top: var(--s-3);
  border-top: 1px solid var(--sand);
}
.sources__title {
  font: var(--t-label-sm);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--ink-500);
}
.sources__list {
  margin: var(--s-1) 0 0;
  padding: 0;
  list-style: none;
}
.source {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--hit);
  padding: var(--s-1) 0;
  color: var(--ink-700);
}
.source__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.source__name {
  font: var(--t-body-sm);
  text-decoration: underline;
  text-decoration-color: var(--sand-dark);
  text-underline-offset: 2px;
}
.source__publisher {
  font: var(--t-meta);
  color: var(--ink-500);
}
.source__icon {
  flex-shrink: 0;
  color: var(--ink-500);
}
.sheet__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  margin-top: var(--s-3);
}
.gallery {
  padding-bottom: var(--s-8);
}
</style>
