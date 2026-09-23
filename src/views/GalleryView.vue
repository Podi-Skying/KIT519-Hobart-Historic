<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useContent } from '@/i18n/content'
import { useSwipe } from '@/composables/useSwipe'
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

function show(i) {
  const next = (i + count.value) % count.value
  router.replace({ name: 'gallery', params: { id: props.id, index: next } })
}
const step = (delta) => show(current.value + delta)

const swipe = useSwipe(step)
useKeydown({ ArrowLeft: () => step(-1), ArrowRight: () => step(1) })
</script>

<template>
  <AppPage>
    <PageHeader :title="site.name" :fallback="{ name: 'site', params: { id } }">
      <span class="counter">{{ current + 1 }} / {{ count }}</span>
    </PageHeader>

    <figure class="viewer">
      <div class="viewer__stage" v-on="swipe">
        <Transition name="photo" mode="out-in">
          <img :key="photo.image" :src="photo.image" :alt="photo.caption" class="img-placeholder" draggable="false" />
        </Transition>
        <button type="button" class="viewer__nav viewer__nav--prev" :aria-label="t('gallery.previous')" @click="step(-1)">
          <AppIcon name="back" :size="20" :stroke-width="2.4" />
        </button>
        <button type="button" class="viewer__nav viewer__nav--next" :aria-label="t('gallery.next')" @click="step(1)">
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
        class="thumbs__item"
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
.viewer__stage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.viewer__nav {
  position: absolute;
  top: 50%;
  width: 40px;
  height: 40px;
  margin-top: -20px;
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
  letter-spacing: 0.08em;
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
  border-radius: var(--r-sm);
  border: 2px solid transparent;
  opacity: 0.55;
  transition: opacity var(--dur) var(--ease), border-color var(--dur) var(--ease);
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
.photo-enter-active,
.photo-leave-active {
  transition: opacity var(--dur-fast) ease;
}
.photo-enter-from,
.photo-leave-to {
  opacity: 0;
}
</style>
