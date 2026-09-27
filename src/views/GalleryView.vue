<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useContent } from '@/i18n/content'
import { useSwipePager } from '@/composables/useSwipePager'
import { releaseEasing, rubberband } from '@/lib/gesture'
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

/** Which way the photos travel: 1 = next slides in from the right, -1 = previous from the left. */
const direction = ref(1)
/** Velocity hand-off from a swipe to the slide animation (lib/gesture releaseEasing). */
const easing = ref(undefined)

function show(i, dir = Math.sign(i - current.value) || 1) {
  direction.value = dir
  easing.value = undefined // arrows, thumbnails, keys: default curve
  const next = (i + count.value) % count.value
  router.replace({ name: 'gallery', params: { id: props.id, index: next } })
}
const step = (delta) => show(current.value + delta, delta)

// ---- 1:1 swipe: the photo follows the finger, a flick throws it to the next one ----
const stage = ref(null)
const SLIDE_MS = 380 // var(--dur-page)
const pager = useSwipePager({
  resist: (dx) => (count.value > 1 ? dx : rubberband(dx, stage.value?.clientWidth || 320)),
  onRelease({ offset, velocity, projected }) {
    const width = stage.value?.clientWidth || 320
    if (count.value > 1 && Math.abs(projected) > width / 2) {
      const dir = projected < 0 ? 1 : -1
      // Keep the photo where the finger left it until the route changes (see watch below),
      // then it continues out at the finger's speed.
      step(dir)
      easing.value = releaseEasing(Math.abs(velocity), width - Math.abs(offset), SLIDE_MS)
    } else {
      easing.value = releaseEasing(-Math.sign(offset) * velocity, offset, SLIDE_MS)
      pager.offset.value = 0 // spring back
    }
  },
})
// The new photo starts centred; the leaving one keeps its last offset and slides on from there.
watch(current, () => {
  pager.offset.value = 0
})
const photoStyle = computed(() => ({
  '--dx': `${pager.offset.value}px`,
  ...(easing.value ? { '--release-ease': easing.value } : {}),
}))
useKeydown({ ArrowLeft: () => step(-1), ArrowRight: () => step(1) })
</script>

<template>
  <AppPage>
    <PageHeader :title="site.name" :fallback="{ name: 'site', params: { id } }">
      <span class="counter">{{ current + 1 }} / {{ count }}</span>
    </PageHeader>

    <figure class="viewer">
      <div ref="stage" class="viewer__stage" :class="{ 'is-dragging': pager.dragging.value }" v-on="pager.handlers">
        <Transition :name="direction > 0 ? 'photo-next' : 'photo-prev'">
          <img
            :key="photo.image"
            :src="photo.image"
            :alt="photo.caption"
            class="viewer__img img-placeholder"
            :style="photoStyle"
            draggable="false"
          />
        </Transition>
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
  transform: translateX(var(--dx, 0px));
  transition: transform var(--dur-page) var(--release-ease, var(--ease-page));
}
.viewer__stage.is-dragging .viewer__img {
  transition: none; /* 1:1 with the finger */
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
/* Next/previous: both photos move together (reduced motion: --motion 0 → a cross-fade). */
.photo-next-enter-active,
.photo-next-leave-active,
.photo-prev-enter-active,
.photo-prev-leave-active {
  transition: transform var(--dur-page) var(--release-ease, var(--ease-page)),
    opacity var(--dur-page) var(--ease-page);
}
.photo-next-enter-from,
.photo-prev-leave-to {
  transform: translateX(calc(100% * var(--motion)));
  opacity: var(--motion);
}
.photo-next-leave-to,
.photo-prev-enter-from {
  transform: translateX(calc(-100% * var(--motion)));
  opacity: var(--motion);
}
</style>
