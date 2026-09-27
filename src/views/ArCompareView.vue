<script setup>
/**
 * "Through time" for one site: every photo of it (today's view, the gallery, archival
 * views), newest first. One slider blends continuously from photo to photo, the way
 * the original past ↔ today slider did for two; the compact card names the nearest
 * photo's year and story so the photo keeps most of the screen. Arrow keys on the
 * slider jump a whole photo; dragging on the photo scrubs the blend 1:1 (one screen width =
 * one photo) and a flick carries on to wherever its momentum lands.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import { useContent } from '@/i18n/content'
import { useGoBack } from '@/composables/useGoBack'
import { siteTimeline } from '@/lib/sites'
import { useSwipePager } from '@/composables/useSwipePager'
import { createSpringAnimator, SPRINGS } from '@/lib/spring'

const props = defineProps({
  id: { type: Number, required: true },
})

/** Slider units per photo. */
const STEP = 100

const { t } = useI18n()
const { siteById } = useContent()
const site = computed(() => siteById(props.id))
const photos = computed(() => siteTimeline(site.value))
const last = computed(() => photos.value.length - 1)

/** 0 = newest photo … last × STEP = oldest; values in between blend two neighbours. */
const blend = ref(0)

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

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
/** Snaps are a critically damped spring on the blend itself, so they start at the finger's speed
 *  and a new drag can catch them mid-way. Reduced motion: jump, and let CSS cross-fade (.is-animated). */
const blendSpring = createSpringAnimator((value) => (blend.value = value), { epsilon: 0.1 }) // 100 units ≈ one screen
onBeforeUnmount(() => blendSpring.stop())
/** @param {number} velocity blend units per second (from a flick) */
function goTo(i, velocity = 0) {
  const target = Math.min(Math.max(i, 0), last.value) * STEP
  if (reduceMotion()) {
    blendSpring.stop()
    blend.value = target
    return
  }
  blendSpring.animate({ from: blend.value, to: target, velocity, spring: SPRINGS.sheet })
}

watch(
  () => props.id,
  () => {
    blendSpring.stop()
    blend.value = 0
  },
)
function onKey(e) {
  const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
  if (step === undefined) return
  e.preventDefault()
  goTo(nearest.value + step)
}

// Drag the photo: left = older, right = newer. The blend follows the finger continuously
// (continuous feedback during the gesture), holds at the newest/oldest photo, and on
// release snaps to the photo nearest to where the flick's momentum would carry it.
const stage = ref(null)
let dragStart = 0
const widthPx = () => stage.value?.clientWidth || 360
const pager = useSwipePager({
  onPress: () => blendSpring.stop(), // touch-down catches a snap mid-way
  onStart: () => (dragStart = blend.value),
  onSettle: () => blend.value % STEP !== 0 && goTo(Math.round(blend.value / STEP)),
  onMove(dx) {
    blend.value = Math.min(Math.max(dragStart - (dx / widthPx()) * STEP, 0), last.value * STEP)
  },
  onRelease({ projected, velocity }) {
    // px/ms of finger → blend units/s (left = older = up)
    goTo(Math.round((dragStart - (projected / widthPx()) * STEP) / STEP), (-velocity * 1000 * STEP) / widthPx())
  },
})

const goBack = useGoBack({ name: 'ar', params: { id: props.id } })
</script>

<template>
  <div class="compare">
    <div ref="stage" class="compare__stage" v-on="pager.handlers">
      <img
        v-for="(p, i) in photos"
        :key="p.image"
        class="compare__layer"
        :class="{ 'is-animated': blend % STEP === 0 && !pager.dragging.value && reduceMotion() }"
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
        @pointerdown="blendSpring.stop()"
        class="caption-card__slider slider"
        :style="{ '--fill': `${last ? (blend / (last * STEP)) * 100 : 0}%` }"
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
  font: var(--t-micro);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  opacity: 0.9;
}
.compare__title b {
  overflow: hidden;
  font: var(--t-title);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.compare__count {
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: var(--glass);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  font: var(--t-label-sm);
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
  font: var(--t-label-sm);
  color: var(--ink-700);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.caption-card__head b {
  font: var(--t-title);
  color: var(--ink-900);
}
.caption-card__tag {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  background: var(--brand-50);
  color: var(--brand-600);
  font: var(--t-micro);
  font-weight: 700;
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  vertical-align: 2px;
}
.caption-card__text {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font: var(--t-body-sm);
  color: var(--ink-900);
}
.caption-card__slider {
  margin: 0 0 calc(-1 * var(--s-2));
}
.caption-card__ends {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font: var(--t-micro);
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
  background: var(--outline);
}
.caption-card__ticks i.is-on {
  background: var(--brand-600);
}
</style>
