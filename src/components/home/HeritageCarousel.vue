<script setup>
/**
 * "Top 5" ranked carousel.
 * Controls sit *below* the slides (‹ • • • • • ›) so they read as belonging to the
 * carousel — the thumb reaches them easily and the header stays uncluttered.
 */
import SectionHeader from '@/components/base/SectionHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useCarousel } from '@/composables/useCarousel'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  sites: { type: Array, required: true },
})

const { track, index, goTo, onScroll, dragHandlers } = useCarousel()
</script>

<template>
  <section class="carousel" :aria-label="title" aria-roledescription="carousel">
    <SectionHeader :title="title" :meta="subtitle" />

    <div ref="track" class="carousel__track" @scroll.passive="onScroll" v-on="dragHandlers">
      <RouterLink
        v-for="(site, rank) in sites"
        :key="site.id"
        :to="{ name: 'site', params: { id: site.id } }"
        class="rank-card"
        draggable="false"
        aria-roledescription="slide"
        :aria-label="`${rank + 1} of ${sites.length}: ${site.name}`"
      >
        <div class="rank-card__media">
          <img
            :src="site.image"
            alt=""
            class="img-placeholder"
            :loading="rank < 2 ? 'eager' : 'lazy'"
            decoding="async"
            draggable="false"
          />
          <span class="rank-card__rank">#{{ rank + 1 }}</span>
          <div class="rank-card__caption">
            <span class="rank-card__category">{{ site.categoryLabel }}</span>
            <h3 class="rank-card__name">{{ site.name }}</h3>
          </div>
        </div>
        <div class="rank-card__meta">
          <span>{{ site.area }} • {{ site.walkMinutes }} min walk</span>
          <span v-if="site.accessible" class="rank-card__accessible">
            <AppIcon name="accessible" :size="14" /> Accessible
          </span>
        </div>
      </RouterLink>
    </div>

    <div class="controls">
      <button
        type="button"
        class="controls__arrow"
        aria-label="Previous heritage site"
        :disabled="index === 0"
        @click="goTo(index - 1)"
      >
        <AppIcon name="back" :size="18" :stroke-width="2.4" />
      </button>

      <div class="controls__dots" role="tablist" aria-label="Choose a site">
        <button
          v-for="(site, i) in props.sites"
          :key="site.id"
          type="button"
          role="tab"
          class="controls__dot"
          :class="{ 'is-active': i === index }"
          :aria-selected="i === index"
          :aria-label="`Show #${i + 1} ${site.name}`"
          @click="goTo(i)"
        >
          <i />
        </button>
      </div>

      <button
        type="button"
        class="controls__arrow"
        aria-label="Next heritage site"
        :disabled="index === props.sites.length - 1"
        @click="goTo(index + 1)"
      >
        <AppIcon name="chevron" :size="18" :stroke-width="2.4" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.carousel {
  padding-bottom: var(--s-3);
  background: var(--paper);
  border-bottom: 1px solid var(--sand);
}
.carousel__track {
  display: flex;
  gap: var(--s-3);
  padding: 0 var(--gutter) 2px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--gutter);
  scrollbar-width: none;
  cursor: grab;
}
.carousel__track::-webkit-scrollbar {
  display: none;
}
.rank-card {
  flex: 0 0 290px;
  scroll-snap-align: start;
  overflow: hidden;
  border: 1.5px solid var(--sand);
  border-radius: var(--r-lg);
  background: var(--paper);
  user-select: none;
}
.rank-card__media {
  position: relative;
  height: 160px;
}
.rank-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rank-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 38%, rgba(44, 36, 23, 0.8));
}
.rank-card__rank {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  padding: 3px 8px;
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.94);
  color: var(--ink-900);
  font: 700 12px var(--font-label);
}
.rank-card__caption {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 12px;
  z-index: 1;
  color: var(--paper);
}
.rank-card__category {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--brand-600);
  font: 600 11px var(--font-label);
}
.rank-card__name {
  margin-top: 6px;
  font: 700 18px/1.25 var(--font-heading);
}
.rank-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  font: 400 12px var(--font-body);
  color: var(--ink-500);
}
.rank-card__accessible {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--success-600);
  font-weight: 600;
}

/* ---- ‹ • • • • • › controls ---- */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--s-2);
  padding-top: var(--s-3);
}
.controls__arrow {
  width: var(--hit);
  height: var(--hit);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--ink-900);
  transition: background var(--dur-fast) var(--ease), opacity var(--dur) var(--ease);
}
.controls__arrow:hover:not(:disabled) {
  background: var(--parchment);
}
.controls__arrow:disabled {
  opacity: 0.3;
  cursor: default;
}
.controls__dots {
  display: flex;
  align-items: center;
}
/* 24px hit area around a 6px dot */
.controls__dot {
  width: 24px;
  height: var(--hit);
  display: flex;
  align-items: center;
  justify-content: center;
}
.controls__dot i {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--sand-dark);
  transition: width var(--dur) var(--ease), background var(--dur) var(--ease);
}
.controls__dot.is-active i {
  width: 18px;
  background: var(--brand-600);
}
.controls__dot:focus-visible {
  box-shadow: none;
}
.controls__dot:focus-visible i {
  box-shadow: var(--focus-ring);
}
</style>
