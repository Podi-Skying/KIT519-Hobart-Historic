<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useContent } from '@/i18n/content'
import { useSwipePager } from '@/composables/useSwipePager'
import { pagerStep, rubberband } from '@/lib/gesture'
import { createSpringAnimator, SPRINGS } from '@/lib/spring'
import { useKeydown } from '@/composables/useKeydown'

const props = defineProps({
  id: { type: Number, required: true },
  index: { type: Number, default: 0 },
})

const router = useRouter()
const { t } = useI18n()
const { siteById } = useContent()
const site = computed(() => siteById(props.id))
const count = computed(() => site.value.gallery.length)
const current = computed(() => Math.min(props.index, count.value - 1))
const photo = computed(() => site.value.gallery[current.value])

// ---- Spring pager (Apple: direct manipulation + springs + velocity hand-off + interruptible) ----
// Two photos are on stage: the current one and its neighbour on the side it is moving towards.
// `offset` (px) is the only motion value: the finger drives it 1:1, a spring drives it after
// release — from the finger's speed — and a new touch stops the spring right where it is.
const stage = ref(null)
const offset = ref(0)
/** Photo on its way in when arrows / thumbnails / keys started the move (may be non-adjacent). */
const pending = ref(null) // { index, dir }
const spring = createSpringAnimator((x) => (offset.value = x))
onBeforeUnmount(() => spring.stop())
const width = () => stage.value?.clientWidth || 320
const wrap = (i) => (i + count.value) % count.value
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function commit(index) {
  router.replace({ name: 'gallery', params: { id: props.id, index: wrap(index) } })
}
// Route changed: the neighbour is now the current photo, in place. Same <img> element (keyed by
// image), so it doesn't reload or jump.
watch(current, () => {
  spring.stop()
  offset.value = 0
  pending.value = null
})

/** The neighbour that is (or will be) visible, and which side it sits on. */
const neighbour = computed(() => {
  if (count.value < 2) return null
  const dir = pending.value?.dir ?? (offset.value < 0 ? 1 : offset.value > 0 ? -1 : 0)
  if (!dir) return null
  const index = pending.value?.index ?? wrap(current.value + dir)
  return { index, dir, photo: site.value.gallery[index] }
})

/** Slide to `dir` (1 next, -1 previous) and land on `index`, starting at `velocity` px/s. */
function slideTo(index, dir, velocity = 0) {
  if (reduceMotion()) return commit(index) // no slide; the new photo fades in (CSS)
  pending.value = { index: wrap(index), dir }
  spring.animate({ from: offset.value, to: -dir * width(), velocity, spring: SPRINGS.page, done: () => commit(index) })
}

function show(i) {
  const index = wrap(i)
  if (index === current.value) return
  if (spring.running && pending.value) {
    // A second tap while sliding: land the first move now, then start the next from there.
    spring.stop()
    return commit(index)
  }
  slideTo(index, index > current.value ? 1 : -1)
}
const step = (delta) => {
  if (spring.running && pending.value) {
    spring.stop()
    return commit(pending.value.index + delta)
  }
  slideTo(current.value + delta, delta)
}

let dragBase = 0
/** Let go of a photo that was caught but not dragged: finish or undo the slide from where it is. */
function settle(velocity = 0) {
  const dir = count.value < 2 ? 0 : pagerStep(offset.value, velocity, width())
  if (dir) {
    const index = pending.value?.dir === dir ? pending.value.index : current.value + dir
    slideTo(index, dir, velocity * 1000)
  } else if (offset.value !== 0) {
    pending.value = null
    spring.animate({ from: offset.value, to: 0, velocity: velocity * 1000, spring: SPRINGS.sheet })
  }
}
const pager = useSwipePager({
  onPress: () => spring.stop(), // touch-down catches a sliding photo where it is
  onStart() {
    dragBase = offset.value
  },
  onSettle: () => settle(0),
  onMove(dx) {
    const x = dragBase + dx
    if (count.value < 2) {
      offset.value = rubberband(x, width()) // nothing to page to: soft edge
      return
    }
    // Reversed direction mid-way: the neighbour on the other side takes over.
    if (pending.value && Math.sign(-x) !== pending.value.dir && x !== 0) pending.value = null
    offset.value = x
  },
  onRelease: ({ velocity }) => settle(velocity),
})
const slideStyle = (pos) => ({ transform: `translateX(calc(${pos * 100}% + ${offset.value}px))` })
useKeydown({ ArrowLeft: () => step(-1), ArrowRight: () => step(1) })
</script>

<template>
  <AppPage>
    <PageHeader :title="site.name" :fallback="{ name: 'site', params: { id } }">
      <span class="counter">{{ current + 1 }} / {{ count }}</span>
    </PageHeader>

    <figure class="viewer">
      <div ref="stage" class="viewer__stage" v-on="pager.handlers">
        <!-- Keyed by image: when the neighbour becomes current it is the same element — no reload, no jump -->
        <img
          :key="photo.image"
          :src="photo.image"
          :alt="photo.caption"
          class="viewer__img img-placeholder"
          :style="slideStyle(0)"
          draggable="false"
        />
        <img
          v-if="neighbour && neighbour.photo.image !== photo.image"
          :key="neighbour.photo.image"
          :src="neighbour.photo.image"
          alt=""
          class="viewer__img img-placeholder"
          :style="slideStyle(neighbour.dir)"
          draggable="false"
        />
        <button type="button" class="viewer__nav viewer__nav--prev pressable" :aria-label="t('gallery.previous')" @click="step(-1)">
          <AppIcon name="back" :size="20" :stroke-width="2.4" />
        </button>
        <button type="button" class="viewer__nav viewer__nav--next pressable" :aria-label="t('gallery.next')" @click="step(1)">
          <AppIcon name="chevron" :size="20" :stroke-width="2.4" />
        </button>
      </div>
      <figcaption class="viewer__caption" aria-live="polite">
        <span class="viewer__year">{{ photo.year }}</span>
        <h2 class="t-h1">{{ photo.caption }}</h2>
        <p class="t-body">{{ photo.description }}</p>
      </figcaption>
    </figure>

    <div class="thumbs" role="tablist" :aria-label="t('gallery.photos')">
      <button
        v-for="(item, i) in site.gallery"
        :key="item.image"
        type="button"
        role="tab"
        class="thumbs__item pressable"
        :class="{ 'is-active': i === current }"
        :aria-selected="i === current"
        :aria-label="item.caption"
        @click="show(i)"
      >
        <img :src="item.image" alt="" loading="lazy" decoding="async" />
      </button>
    </div>
  </AppPage>
</template>

<style scoped>
.counter {
  font: var(--t-label);
  color: var(--ink-500);
}
.viewer {
  margin: var(--s-2) 0 0;
}
.viewer__stage {
  position: relative;
  margin: 0 var(--gutter);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--r-lg);
  border: 1.5px solid var(--sand);
  touch-action: pan-y;
  user-select: none;
}
.viewer__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform; /* moved every frame by the finger or the spring */
}
.viewer__nav {
  position: absolute;
  top: 50%;
  width: var(--hit);
  height: var(--hit);
  margin-top: calc(var(--hit) / -2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink-900);
  box-shadow: var(--e-1);
}
.viewer__nav--prev {
  left: 10px;
}
.viewer__nav--next {
  right: 10px;
}
.viewer__caption {
  padding: var(--s-5) var(--gutter) var(--s-4);
}
.viewer__caption h2 {
  margin: 6px 0;
}
.viewer__year {
  font: var(--t-caption);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--accent-700);
}
.thumbs {
  display: flex;
  gap: var(--s-2);
  padding: 0 var(--gutter) var(--s-6);
  overflow-x: auto;
}
.thumbs__item {
  flex: 0 0 68px;
  height: 68px;
  overflow: hidden;
  border-radius: var(--r-md); /* same as the photo rail on the site page */
  border: 2px solid transparent;
  opacity: 0.55;
  transition: opacity var(--dur) var(--ease), border-color var(--dur) var(--ease), scale var(--dur) var(--ease);
}
.thumbs__item.is-active {
  opacity: 1;
  border-color: var(--brand-600);
}
.thumbs__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Reduced motion: no slide — the new photo cross-fades in. */
@media (prefers-reduced-motion: reduce) {
  .viewer__img {
    animation: photo-fade var(--dur) var(--ease);
  }
}
@keyframes photo-fade {
  from {
    opacity: 0;
  }
}
</style>
