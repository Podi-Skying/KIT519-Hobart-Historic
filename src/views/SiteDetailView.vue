<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPage from '@/components/layout/AppPage.vue'
import IconButton from '@/components/base/IconButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import GalleryRail from '@/components/site/GalleryRail.vue'
import { getSiteById } from '@/data/sites'
import { pluralize } from '@/lib/format'
import { useFavoritesStore } from '@/stores/favorites'
import { useTripStore } from '@/stores/trip'
import { useGoBack } from '@/composables/useGoBack'

const props = defineProps({
  id: { type: Number, required: true },
})

const HERO_HEIGHT = 320

const router = useRouter()
const favorites = useFavoritesStore()
const trip = useTripStore()
const goBack = useGoBack({ name: 'home' })

const site = computed(() => getSiteById(props.id))
const liked = computed(() => favorites.isLiked(props.id))

function startRoute() {
  trip.setDestination(props.id)
  router.push({ name: 'navigate', params: { id: props.id } })
}
</script>

<template>
  <AppPage :safe-top="false" :solid-after="HERO_HEIGHT - 48">
    <div class="hero" :style="{ height: `${HERO_HEIGHT}px` }">
      <img :src="site.image" :alt="site.name" class="img-placeholder" fetchpriority="high" />
      <div class="hero__bar">
        <IconButton icon="back" label="Back" @click="goBack" />
        <IconButton
          icon="heart"
          :label="liked ? 'Remove from favourites' : 'Add to favourites'"
          :pressed="liked"
          :filled="liked"
          class="hero__like"
          @click="favorites.toggle(site.id)"
        />
      </div>
    </div>

    <article class="sheet">
      <p class="t-caption">{{ site.categoryLabel }} · {{ site.area }}</p>
      <h1 class="t-display sheet__title">{{ site.name }}</h1>

      <ul class="facts" aria-label="Key facts">
        <li><BaseBadge icon="clock">Built {{ site.builtYear }}</BaseBadge></li>
        <li><BaseBadge icon="walk">{{ site.walkMinutes }} min walk</BaseBadge></li>
        <li v-if="site.accessible"><BaseBadge tone="success" icon="accessible">Accessible</BaseBadge></li>
        <li>
          <BaseBadge tone="brand" icon="heart" icon-filled>{{ favorites.likeCount(site) }} likes</BaseBadge>
        </li>
      </ul>

      <p class="t-body sheet__description">{{ site.description }}</p>

      <BaseButton block icon="navigate" @click="startRoute">Start walking route</BaseButton>
      <div class="sheet__actions">
        <BaseButton variant="secondary" icon="headphones" :to="{ name: 'audio', params: { id: site.id } }">
          Audio tour
        </BaseButton>
        <BaseButton variant="secondary" icon="ar" :to="{ name: 'ar' }">View in AR</BaseButton>
      </div>
    </article>

    <SectionHeader title="Through the years" :meta="pluralize(site.gallery.length, 'photo')" />
    <GalleryRail :site="site" class="gallery" />
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
  top: 50px;
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
  margin-top: 6px;
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
