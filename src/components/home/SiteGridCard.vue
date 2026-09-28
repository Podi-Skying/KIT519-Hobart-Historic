<script setup>
/**
 * Compact site card for the two-column grid.
 * Uses the "stretched link" pattern so the like button is not nested in the link.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps({
  site: { type: Object, required: true },
})

const { t } = useI18n()
const favorites = useFavoritesStore()
const liked = computed(() => favorites.isLiked(props.site.id))
const likes = computed(() => favorites.likeCount(props.site))
</script>

<template>
  <article class="grid-card">
    <div class="grid-card__media">
      <img :src="site.image" alt="" class="img-placeholder" loading="lazy" decoding="async" />
      <button
        type="button"
        class="grid-card__like pressable"
        :class="{ 'is-liked': liked }"
        :aria-pressed="liked"
        :aria-label="t(liked ? 'home.unlike' : 'home.like', { name: site.name, n: likes })"
        @click="favorites.toggle(site.id)"
      >
        <AppIcon name="heart" :size="12" :filled="liked" :stroke-width="2.6" />
        {{ likes }}
      </button>
    </div>
    <div class="grid-card__body">
      <h3 class="grid-card__name">
        <RouterLink :to="{ name: 'site', params: { id: site.id } }" class="grid-card__link">{{ site.name }}</RouterLink>
      </h3>
      <p class="grid-card__meta">{{ site.area }}</p>
    </div>
  </article>
</template>

<style scoped>
.grid-card {
  position: relative;
  overflow: hidden;
  border: 1.5px solid var(--sand);
  border-radius: var(--r-lg);
  background: var(--paper);
  transition: box-shadow var(--dur) var(--ease), scale var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
/* The whole card is the link (stretched ::after), so the card itself shows the press. */
.grid-card:has(.grid-card__link:active) {
  scale: var(--press-scale-card);
  transition-duration: 0ms;
}
@media (prefers-reduced-motion: reduce) {
  .grid-card:has(.grid-card__link:active) {
    opacity: 0.7; /* no shrink: the press still shows, as a dim */
  }
}
@media (hover: hover) {
  .grid-card:hover {
    box-shadow: var(--e-1);
  }
}
.grid-card__media {
  position: relative;
  height: 108px;
}
.grid-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.grid-card__like {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2; /* above the stretched link */
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 1.625rem;
  padding: 0 0.625rem;
  border-radius: var(--r-pill);
  background: var(--like-glass);
  color: var(--paper);
  font: var(--t-micro);
  font-weight: 700;
}
.grid-card__like::before {
  content: '';
  position: absolute;
  inset: -9px -6px; /* invisible 44×44 touch area around a smaller visual (Apple HIG minimum) */
}
.grid-card__like.is-liked {
  background: var(--brand-600);
}
.grid-card__body {
  padding: 0.5625rem 0.6875rem 0.6875rem;
}
.grid-card__name {
  font: var(--t-card-title);
  color: var(--ink-900);
}
.grid-card__link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}
.grid-card__link:focus-visible {
  box-shadow: none;
}
.grid-card:has(.grid-card__link:focus-visible) {
  box-shadow: var(--focus-ring);
}
.grid-card__meta {
  margin-top: 0.1875rem;
  font: var(--t-meta);
  color: var(--ink-500);
}
</style>
