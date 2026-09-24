<script setup>
/**
 * "Through time" for one site: every photo of it (today's view, the gallery, archival
 * views), newest first. The photo fills the screen and cross-fades between eras; the
 * card below names the year and tells that photo's story, and a thumbnail timeline
 * jumps anywhere. Older/newer buttons, swiping the photo and arrow keys on the
 * timeline all move one step, so no gesture is the only way (WCAG 2.5.7).
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { useContent } from '@/i18n/content'
import { useGoBack } from '@/composables/useGoBack'
import { siteTimeline } from '@/lib/sites'

const props = defineProps({
  id: { type: Number, required: true },
})

/** Horizontal travel (px) that counts as a swipe on the photo. */
const SWIPE = 48

const { t } = useI18n()
const { siteById } = useContent()
const site = computed(() => siteById(props.id))
const photos = computed(() => siteTimeline(site.value))

const current = ref(0)
/** The photo underneath while the new one fades in, so the cross-fade never dips to black. */
const previous = ref(0)
const photo = computed(() => photos.value[current.value])
const yearLabel = (p) => (p.year && Number.isFinite(p.sortYear) ? p.year : t('compare.today'))

function show(index) {
  const next = Math.min(Math.max(index, 0), photos.value.length - 1)
  if (next === current.value) return
  previous.value = current.value
  current.value = next
}
const older = () => show(current.value + 1)
const newer = () => show(current.value - 1)

watch(
  () => props.id,
  () => {
    current.value = 0
    previous.value = 0
  },
)

// ---- swipe on the photo: left = older, right = newer ----
let swipeX = null
const swipe = {
  pointerdown: (e) => (swipeX = e.clientX),
  pointerup: (e) => {
    if (swipeX === null) return
    const dx = e.clientX - swipeX
    swipeX = null
    if (dx < -SWIPE) older()
    else if (dx > SWIPE) newer()
  },
  pointercancel: () => (swipeX = null),
}

// ---- timeline: keep the chosen thumbnail in view; arrow keys move (radiogroup pattern) ----
const strip = ref(null)
watch(current, async (i) => {
  await nextTick()
  const thumb = strip.value?.children[i]
  thumb?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
})
async function onKey(e) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  const jump = { Home: 0, End: photos.value.length - 1 }[e.key]
  if (step === undefined && jump === undefined) return
  e.preventDefault()
  show(jump ?? current.value + step)
  await nextTick()
  strip.value?.children[current.value]?.focus()
}

const goBack = useGoBack({ name: 'ar', params: { id: props.id } })
</script>

<template>
  <div class="compare">
    <!-- Photos: the current one fades in over the previous one -->
    <div class="compare__stage" v-on="swipe">
      <img
        v-for="(p, i) in photos"
        :key="p.image"
        class="compare__layer"
        :class="{ 'is-current': i === current, 'is-previous': i === previous && i !== current }"
        :src="p.image"
        :alt="i === current ? t('compare.photoAlt', { name: site.name, year: yearLabel(p) }) : ''"
        :aria-hidden="i === current ? undefined : 'true'"
        :loading="i < 2 ? 'eager' : 'lazy'"
      />
    </div>
    <div class="compare__veil" />

    <header class="compare__top">
      <IconButton variant="glass" icon="back" :label="t('common.back')" @click="goBack" />
      <p class="compare__title">
        <span>{{ t('compare.title') }}</span>
        <b>{{ site.shortName }}</b>
      </p>
      <span class="compare__count" aria-live="polite">{{ t('compare.counter', { n: current + 1, total: photos.length }) }}</span>
    </header>

    <IconButton
      class="compare__step compare__step--newer"
      variant="glass"
      icon="back"
      :label="t('compare.newer')"
      :disabled="current === 0"
      @click="newer"
    />
    <IconButton
      class="compare__step compare__step--older"
      variant="glass"
      icon="chevron"
      :label="t('compare.older')"
      :disabled="current === photos.length - 1"
      @click="older"
    />

    <section class="caption-card text-zoom">
      <div class="caption-card__head">
        <Transition name="year" mode="out-in">
          <p :key="current" class="caption-card__year">{{ yearLabel(photo) }}</p>
        </Transition>
        <BaseBadge v-if="photo.archival" tone="accent" icon="clock" size="sm">{{ t('compare.archival') }}</BaseBadge>
      </div>
      <p class="caption-card__title">{{ photo.title }}</p>
      <p class="caption-card__text">{{ photo.text }}</p>

      <p class="caption-card__order" aria-hidden="true">
        <span>{{ t('compare.newest') }}</span>
        <span class="caption-card__rail" />
        <span>{{ t('compare.oldest') }}</span>
      </p>
      <div
        ref="strip"
        class="timeline"
        role="radiogroup"
        :aria-label="t('compare.timeline', { name: site.name })"
        @keydown="onKey"
      >
        <button
          v-for="(p, i) in photos"
          :key="p.image"
          type="button"
          role="radio"
          class="timeline__item"
          :class="{ 'is-on': i === current }"
          :aria-checked="i === current"
          :tabindex="i === current ? 0 : -1"
          :aria-label="`${yearLabel(p)} · ${p.title}`"
          @click="show(i)"
        >
          <img :src="p.image" alt="" loading="lazy" />
          <span>{{ yearLabel(p) }}</span>
        </button>
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
  opacity: 0;
  user-select: none;
  -webkit-user-drag: none;
}
.compare__layer.is-previous {
  opacity: 1;
}
.compare__layer.is-current {
  z-index: 1;
  opacity: 1;
  animation: fade-in 0.7s var(--ease);
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(1.03);
  }
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
.compare__step {
  position: absolute;
  top: 34%;
  z-index: 3;
}
.compare__step--newer {
  left: var(--gutter);
}
.compare__step--older {
  right: var(--gutter);
}
.compare__step:disabled {
  opacity: 0;
  pointer-events: none;
}
.caption-card {
  position: absolute;
  left: var(--gutter);
  right: var(--gutter);
  bottom: 18px;
  z-index: 3;
  padding: var(--s-4) var(--s-4) var(--s-3);
  border-radius: var(--r-lg);
  background: var(--cream);
  box-shadow: var(--e-2);
}
.caption-card__head {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.caption-card__year {
  font: 700 26px/1.1 var(--font-heading);
  color: var(--ink-900);
}
.caption-card__title {
  margin-top: 2px;
  font: 600 13px var(--font-label);
  color: var(--ink-700);
}
.caption-card__text {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font: 400 14px/21px var(--font-body);
  color: var(--ink-900);
}
.caption-card__order {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin: var(--s-3) 0 var(--s-2);
  font: 600 10px var(--font-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-500);
}
.caption-card__rail {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--sand-dark), var(--sand));
}
.timeline {
  display: flex;
  gap: var(--s-2);
  margin: 0 calc(-1 * var(--s-4));
  padding: 4px var(--s-4) 2px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}
.timeline::-webkit-scrollbar {
  display: none;
}
.timeline__item {
  flex: 0 0 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  scroll-snap-align: center;
  font: 600 11px var(--font-label);
  color: var(--ink-500);
  white-space: nowrap;
}
.timeline__item img {
  width: 56px;
  height: 56px;
  border-radius: var(--r-md);
  object-fit: cover;
  outline: 2px solid transparent;
  outline-offset: 2px;
  opacity: 0.75;
  transition: opacity var(--dur) var(--ease), outline-color var(--dur) var(--ease);
}
.timeline__item.is-on {
  color: var(--brand-600);
}
.timeline__item.is-on img {
  outline-color: var(--brand-600);
  opacity: 1;
}
.year-enter-active,
.year-leave-active {
  transition: opacity 0.2s var(--ease), transform 0.2s var(--ease);
}
.year-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.year-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
