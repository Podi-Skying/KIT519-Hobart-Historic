<script setup>
/**
 * Compact site card for the two-column grid.
 * Uses the "stretched link" pattern so the like button is not nested in the link.
 */
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps({
  site: { type: Object, required: true },
})

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
        class="grid-card__like"
        :class="{ 'is-liked': liked }"
        :aria-pressed="liked"
        :aria-label="`${liked ? 'Unlike' : 'Like'} ${site.name}, ${likes} likes`"
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
      <p class="grid-card__meta">{{ site.area }} • {{ site.walkMinutes }} min walk</p>
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
  transition: box-shadow var(--dur) var(--ease);
}
.grid-card:hover {
  box-shadow: var(--e-1);
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
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--r-pill);
  background: rgba(125, 48, 69, 0.88);
  color: var(--paper);
  font: 700 11px var(--font-label);
}
.grid-card__like.is-liked {
  background: var(--brand-600);
}
.grid-card__body {
  padding: 9px 11px 11px;
}
.grid-card__name {
  font: 700 13.5px/1.3 var(--font-heading);
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
  margin-top: 3px;
  font: 400 11px var(--font-body);
  color: var(--ink-500);
}
</style>
