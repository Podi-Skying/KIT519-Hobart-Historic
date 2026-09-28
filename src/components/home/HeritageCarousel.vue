<script setup>
/**
 * "Top 5" ranked carousel.
 * Controls sit *below* the slides (‹ • • • • • ›) so they read as belonging to the
 * carousel — the thumb reaches them easily and the header stays uncluttered.
 */
import { useI18n } from 'vue-i18n'
import SectionHeader from '@/components/base/SectionHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useCarousel } from '@/composables/useCarousel'
import { haptic } from '@/services/haptics'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  sites: { type: Array, required: true },
})

const { t } = useI18n()
const { track, index, goTo, onScroll, dragHandlers } = useCarousel()

/**
 * The dot row works like an iOS page control: press anywhere on it and slide
 * to scrub through the slides (each dot is only 24px wide on its own).
 */
let press = null // { x, id, scrubbing }
function dotIndexAt(e) {
  const dots = [...e.currentTarget.querySelectorAll('.controls__dot')]
  let best = 0
  dots.forEach((dot, i) => {
    if (e.clientX >= dot.getBoundingClientRect().left) best = i
  })
  return best
}
const scrub = {
  pointerdown(e) {
    if (e.button !== 0) return
    press = { x: e.clientX, id: e.pointerId, scrubbing: false }
  },
  pointermove(e) {
    if (!press || e.pointerId !== press.id) return
    if (!press.scrubbing) {
      if (Math.abs(e.clientX - press.x) < 6) return // still a tap on one dot
      press.scrubbing = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const i = dotIndexAt(e)
    if (i !== index.value) {
      goTo(i)
      haptic('selection') // a tick per slide while scrubbing, like an iOS picker
    }
  },
  pointerup() {
    press = null
  },
  pointercancel() {
    press = null
  },
}
</script>

<template>
  <section class="carousel" :aria-label="title" aria-roledescription="carousel">
    <SectionHeader :title="title" :meta="subtitle" />

    <div ref="track" class="carousel__track" @scroll.passive="onScroll" v-on="dragHandlers">
      <RouterLink
        v-for="(site, rank) in sites"
        :key="site.id"
        :to="{ name: 'site', params: { id: site.id } }"
        class="rank-card pressable-card"
        draggable="false"
        aria-roledescription="slide"
        :aria-label="t('home.slide', { n: rank + 1, total: sites.length, name: site.name })"
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
          <span>{{ site.area }}</span>
          <span v-if="site.accessible" class="rank-card__accessible">
            <AppIcon name="accessible" :size="14" /> {{ t('common.accessible') }}
          </span>
        </div>
      </RouterLink>
    </div>

    <div class="controls">
      <button
        type="button"
        class="controls__arrow pressable"
        :aria-label="t('home.prevSite')"
        :disabled="index === 0"
        @click="goTo(index - 1)"
      >
        <AppIcon name="back" :size="18" :stroke-width="2.4" />
      </button>

      <div class="controls__dots" role="tablist" :aria-label="t('home.chooseSite')" v-on="scrub">
        <button
          v-for="(site, i) in props.sites"
          :key="site.id"
          type="button"
          role="tab"
          class="controls__dot pressable-dim"
          :class="{ 'is-active': i === index }"
          :aria-selected="i === index"
          :aria-label="t('home.showSite', { n: i + 1, name: site.name })"
          @click="goTo(i)"
        >
          <i />
        </button>
        <!-- One capsule slides to the active dot (transform only — no layout per frame) -->
        <span class="controls__indicator" aria-hidden="true" :style="{ transform: `translateX(${index * 24}px)` }" />
      </div>

      <button
        type="button"
        class="controls__arrow pressable"
        :aria-label="t('home.nextSite')"
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
  padding: 0 var(--gutter) 0.125rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--gutter);
  scrollbar-width: none;
  cursor: grab;
}
.carousel__track::-webkit-scrollbar {
  display: none;
}
/* A mouse drag-to-scroll is not a press on the card under the pointer. */
.carousel__track[data-dragging] .rank-card {
  scale: 1;
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
  padding: 0.1875rem 0.5rem;
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.94);
  color: var(--ink-900);
  font: var(--t-label-sm);
  font-weight: 700;
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
  padding: 0.25rem 0.625rem;
  border-radius: var(--r-pill);
  background: var(--brand-600);
  font: var(--t-micro);
}
.rank-card__name {
  margin-top: 0.375rem;
  font: var(--t-title);
}
.rank-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6875rem 0.875rem;
  font: var(--t-meta);
  color: var(--ink-500);
}
.rank-card__accessible {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
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
  transition: background var(--dur-fast) var(--ease), opacity var(--dur) var(--ease), scale var(--dur) var(--ease);
}
.controls__arrow:active:not(:disabled) {
  background: var(--parchment);
}
@media (hover: hover) {
  .controls__arrow:hover:not(:disabled) {
    background: var(--parchment);
  }
}
.controls__arrow:disabled {
  opacity: var(--disabled-opacity);
  cursor: default;
}
.controls__dots {
  position: relative;
  display: flex;
  align-items: center;
  touch-action: pan-y; /* horizontal slides scrub the dots */
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
  border-radius: var(--r-pill);
  background: var(--outline);
}
.controls__indicator {
  position: absolute;
  top: 50%;
  left: 3px; /* centred on a 24px dot slot */
  width: 18px;
  height: 6px;
  margin-top: -3px;
  border-radius: var(--r-pill);
  background: var(--brand-600);
  pointer-events: none;
  transition: transform calc(var(--dur-page) * var(--motion)) var(--ease-page);
}
.controls__dot:focus-visible {
  box-shadow: none;
}
.controls__dot:focus-visible i {
  box-shadow: var(--focus-ring);
}
</style>
