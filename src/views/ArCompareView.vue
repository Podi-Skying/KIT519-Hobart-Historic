<script setup>
/** "Then vs now" for one site: blend the archival view over today's. */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from '@/components/base/IconButton.vue'
import { useContent } from '@/i18n/content'
import { useGoBack } from '@/composables/useGoBack'

const props = defineProps({
  id: { type: Number, required: true },
})

const PRESENT = 100
const PAST = 0

const { t } = useI18n()
const { siteById } = useContent()
const site = computed(() => siteById(props.id))
const past = computed(() => site.value.timeTravel)

/** 0 = fully past, 100 = fully present */
const blend = ref(PRESENT)
const showingPast = computed(() => blend.value < 50)
const goBack = useGoBack({ name: 'ar', params: { id: props.id } })
</script>

<template>
  <div class="compare">
    <img class="compare__layer" :src="past.presentImage" :alt="t('compare.todayAlt', { name: site.name })" />
    <img
      class="compare__layer"
      :src="past.pastImage"
      :alt="t('compare.pastAlt', { name: site.name, year: past.pastYear })"
      :style="{ opacity: (100 - blend) / 100 }"
    />
    <div class="compare__veil" />

    <IconButton class="compare__back" variant="glass" icon="back" :label="t('common.back')" @click="goBack" />

    <div class="segmented" role="radiogroup" :aria-label="t('compare.period')">
      <button type="button" role="radio" :aria-checked="showingPast" :class="{ 'is-on': showingPast }" @click="blend = PAST">
        {{ past.pastYear }}
      </button>
      <button type="button" role="radio" :aria-checked="!showingPast" :class="{ 'is-on': !showingPast }" @click="blend = PRESENT">
        {{ t('compare.today') }}
      </button>
    </div>

    <section class="caption-card">
      <p class="t-caption">{{ site.name }} · {{ showingPast ? past.pastYear : t('compare.today') }}</p>
      <p class="caption-card__text" aria-live="polite">{{ showingPast ? past.pastCaption : past.presentCaption }}</p>
      <input
        v-model.number="blend"
        class="caption-card__slider"
        type="range"
        min="0"
        max="100"
        :aria-label="t('compare.blend', { year: past.pastYear })"
      />
      <div class="caption-card__ends">
        <span>{{ past.pastYear }}</span><span>{{ t('compare.today') }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.compare {
  position: relative;
  overflow: hidden;
  background: #000;
}
.compare__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.compare__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--photo-veil-top), transparent 26%);
  pointer-events: none;
}
.compare__back {
  position: absolute;
  top: 50px;
  left: var(--gutter);
  z-index: 3;
}
.segmented {
  position: absolute;
  top: 50px;
  left: 50%;
  z-index: 3;
  display: flex;
  padding: 4px;
  border-radius: var(--r-pill);
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform: translateX(-50%);
}
.segmented button {
  height: 36px;
  padding: 0 18px;
  border-radius: var(--r-pill);
  color: var(--cream);
  font: 600 13px var(--font-label);
  white-space: nowrap;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.segmented button.is-on {
  background: var(--cream);
  color: var(--ink-900);
}
.caption-card {
  position: absolute;
  left: var(--gutter);
  right: var(--gutter);
  bottom: 18px;
  z-index: 3;
  padding: var(--s-4);
  border-radius: var(--r-lg);
  background: var(--cream);
  box-shadow: var(--e-2);
}
.caption-card__text {
  margin-top: 4px;
  font: 400 14px/21px var(--font-body);
  color: var(--ink-900);
}
.caption-card__slider {
  width: 100%;
  margin: var(--s-3) 0 var(--s-1);
  accent-color: var(--brand-600);
}
.caption-card__ends {
  display: flex;
  justify-content: space-between;
  font: 600 12px var(--font-label);
  color: var(--ink-900);
}
</style>
