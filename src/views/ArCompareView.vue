<script setup>
/**
 * "Through time" for one site: every photo of it (today's view, the gallery, archival
 * views), newest first. One slider blends continuously from photo to photo, the way
 * the original past ↔ today slider did for two; the compact card names the nearest
 * photo's year and story so the photo keeps most of the screen. Arrow keys on the
 * slider (and swiping the photo) jump a whole photo.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import { useContent } from '@/i18n/content'
import { useGoBack } from '@/composables/useGoBack'
import { siteTimeline } from '@/lib/sites'

const props = defineProps({
  id: { type: Number, required: true },
})

/** Slider units per photo. */
const STEP = 100
/** Horizontal travel (px) that counts as a swipe on the photo. */
const SWIPE = 48

const { t } = useI18n()
const { siteById } = useContent()
const site = computed(() => siteById(props.id))
const photos = computed(() => siteTimeline(site.value))
const last = computed(() => photos.value.length - 1)

/** 0 = newest photo … last × STEP = oldest; values in between blend two neighbours. */
const blend = ref(0)
watch(() => props.id, () => (blend.value = 0))

const position = computed(() => blend.value / STEP)
const nearest = computed(() => Math.round(position.value))
const photo = computed(() => photos.value[nearest.value])
const yearLabel = (p) => (p.year && Number.isFinite(p.sortYear) ? p.year : t('compare.today'))

/** The lower photo of the pair stays opaque; the next one fades in over it. */
function opacityOf(i) {
  const lower = Math.floor(position.value)
  if (i === lower) return 1
  if (i === lower + 1) return position.value - lower
  return 0
}

const goTo = (i) => (blend.value = Math.min(Math.max(i, 0), last.value) * STEP)
function onKey(e) {
  const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
  if (step === undefined) return
  e.preventDefault()
  goTo(nearest.value + step)
}

// Swipe the photo: left = older, right = newer
let swipeX = null
const swipe = {
  pointerdown: (e) => (swipeX = e.clientX),
  pointerup: (e) => {
    if (swipeX === null) return
    const dx = e.clientX - swipeX
    swipeX = null
    if (dx < -SWIPE) goTo(nearest.value + 1)
    else if (dx > SWIPE) goTo(nearest.value - 1)
  },
  pointercancel: () => (swipeX = null),
}

const goBack = useGoBack({ name: 'ar', params: { id: props.id } })
</script>

<template>
  <div class="compare">
    <div class="compare__stage" v-on="swipe">
      <img
        v-for="(p, i) in photos"
        :key="p.image"
        class="compare__layer"
        :class="{ 'is-animated': blend % STEP === 0 }"
        :src="p.image"
        :alt="i === nearest ? t('compare.photoAlt', { name: site.name, year: yearLabel(p) }) : ''"
        :aria-hidden="i === nearest ? undefined : 'true'"
        :style="{ opacity: opacityOf(i) }"
      />
    </div>
    <div class="compare__veil" />

    <header class="compare__top">
      <IconButton variant="glass" icon="back" :label="t('common.back')" @click="goBack" />
      <p class="compare__title">
        <span>{{ t('compare.title') }}</span>
        <b>{{ site.shortName }}</b>
      </p>
      <span class="compare__count">{{ t('compare.counter', { n: nearest + 1, total: photos.length }) }}</span>
    </header>

    <section class="caption-card text-zoom">
      <p class="caption-card__head">
        <b>{{ yearLabel(photo) }}</b>
        <span v-if="photo.archival" class="caption-card__tag">{{ t('compare.archival') }}</span>
        · {{ photo.title }}
      </p>
      <p class="caption-card__text" aria-live="polite">{{ photo.text }}</p>
      <input
        v-model.number="blend"
        class="caption-card__slider"
        type="range"
        min="0"
        :max="last * STEP"
        :aria-label="t('compare.timeline', { name: site.name })"
        :aria-valuetext="`${yearLabel(photo)} · ${photo.title}`"
        @keydown="onKey"
      />
      <div class="caption-card__ends" aria-hidden="true">
        <span>{{ yearLabel(photos[0]) }}</span>
        <span class="caption-card__ticks">
          <i v-for="(p, i) in photos" :key="p.image" :class="{ 'is-on': i === nearest }" />
        </span>
        <span>{{ yearLabel(photos[last]) }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.compare {
  position: relative;
  overflow: hidden;
  background: var(--ink-900);
}
.compare__stage {
  position: absolute;
  inset: 0;
  touch-action: pan-y; /* horizontal swipes step through time */
}
.compare__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}
/* Jumps (keys, swipe) fade; dragging the slider follows the thumb directly */
.compare__layer.is-animated {
  transition: opacity 0.5s var(--ease);
}
.compare__veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 26%);
  pointer-events: none;
}
.compare__top {
  position: absolute;
  top: 50px;
  left: var(--gutter);
  right: var(--gutter);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  color: var(--cream);
}
.compare__title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
}
.compare__title span {
  font: 600 11px var(--font-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.9;
}
.compare__title b {
  overflow: hidden;
  font: 700 18px var(--font-heading);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.compare__count {
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font: 600 12px var(--font-label);
  white-space: nowrap;
}
.caption-card {
  position: absolute;
  left: var(--s-3);
  right: var(--s-3);
  bottom: var(--s-3);
  z-index: 3;
  padding: var(--s-3) var(--s-4) var(--s-2);
  border-radius: var(--r-lg);
  background: var(--cream);
  box-shadow: var(--e-2);
}
.caption-card__head {
  overflow: hidden;
  font: 600 12px var(--font-label);
  color: var(--ink-700);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.caption-card__head b {
  font: 700 16px var(--font-heading);
  color: var(--ink-900);
}
.caption-card__tag {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  background: var(--brand-50);
  color: var(--brand-600);
  font: 700 10px var(--font-label);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: 2px;
}
.caption-card__text {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font: 400 13px/19px var(--font-body);
  color: var(--ink-900);
}
.caption-card__slider {
  width: 100%;
  margin: var(--s-2) 0 0;
  accent-color: var(--brand-600);
}
.caption-card__ends {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font: 600 11px var(--font-label);
  color: var(--ink-700);
}
.caption-card__ticks {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
}
.caption-card__ticks i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--sand-dark);
}
.caption-card__ticks i.is-on {
  background: var(--brand-600);
}
</style>
