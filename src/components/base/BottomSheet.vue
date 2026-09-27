<script setup>
/**
 * Modal bottom sheet.
 * Dismiss by: dragging the grip/header down, the ✕ button, tapping the scrim, or Escape.
 * Every dismissal animates out, then emits `close` (parent removes it with v-if).
 * The drag itself is composables/useSheetDrag (shared with the Map panel).
 */
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from './IconButton.vue'
import { useSheetDrag } from '@/composables/useSheetDrag'

const { t } = useI18n()

const props = defineProps({
  label: { type: String, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  /** Show the header button (defaults to on when the sheet has a title). */
  closable: { type: Boolean, default: undefined },
  /** Header button: ✕ to dismiss, or a green ✓ to confirm once the user has made a choice. */
  confirm: { type: Boolean, default: false },
  closeLabel: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const sheetEl = ref(null)
/** Same gesture as the Map panel: spring physics with velocity hand-off, projection, rubber-band, interruptible. */
const { handlers, swallowClick, style, dragging, leaving, dismiss, progress, tracking } = useSheetDrag(() => emit('close'), {
  element: () => sheetEl.value,
})
/** Buttons, Escape and the scrim animate out the same way a drag does. */
const close = () => dismiss()

/**
 * The page behind recedes while the sheet is up (base.css › Modal depth) and comes forward as
 * the sheet is dragged down — continuously, 1:1 with the sheet, not on/off at the end.
 */
function frame() {
  return sheetEl.value?.closest('.device')
}
watchEffect(() => {
  const device = frame()
  if (!device) return
  device.style.setProperty('--sheet-progress', progress.value.toFixed(4))
  device.classList.toggle('is-sheet-tracking', tracking.value)
})
onBeforeUnmount(() => {
  const device = frame()
  device?.style.removeProperty('--sheet-progress')
  device?.classList.remove('is-sheet-tracking')
})

const onKey = (e) => e.key === 'Escape' && close()
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const showClose = () => props.closable ?? Boolean(props.title)
</script>

<template>
  <!-- Rendered above the page (App.vue #sheet-layer) so the page itself can recede behind it. -->
  <Teleport to="#sheet-layer" defer>
    <div
      class="scrim"
      :class="{ 'is-leaving': leaving, 'is-tracking': tracking }"
      :style="{ opacity: leaving && !tracking ? undefined : 1 - progress }"
      @click.self="close"
    >
      <section
        ref="sheetEl"
        class="sheet"
        :class="{ 'is-dragging': dragging, 'is-leaving': leaving }"
        :style="style"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
      >
        <!-- Drag handle area: grip + header -->
        <div
          class="sheet__handle text-zoom"
          v-on="handlers"
          @click.capture="swallowClick"
        >
          <span class="sheet__grip" aria-hidden="true" />
          <header v-if="title || showClose()" class="sheet__header">
            <div>
              <h2 v-if="title" class="sheet__title">{{ title }}</h2>
              <p v-if="subtitle" class="sheet__subtitle">{{ subtitle }}</p>
            </div>
            <Transition name="swap" mode="out-in">
              <IconButton
                v-if="showClose()"
                :key="confirm ? 'confirm' : 'close'"
                :icon="confirm ? 'check' : 'close'"
                :label="closeLabel || (confirm ? t('common.done') : t('common.close'))"
                :variant="confirm ? 'success' : 'sand'"
                @click="close"
              />
            </Transition>
          </header>
        </div>
        <div class="sheet__body text-zoom">
          <slot :dismiss="close" />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  background: var(--scrim);
  animation: fade-in var(--dur) var(--ease);
  transition: opacity var(--dur) var(--ease);
}
.scrim.is-leaving {
  opacity: 0;
}
.scrim.is-tracking {
  transition: none; /* its opacity follows the sheet frame by frame */
}
.sheet {
  width: 100%;
  max-height: 78%;
  display: flex;
  flex-direction: column;
  background: var(--cream);
  color: var(--ink-700);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  /* 2nd shadow = a cream skirt below the sheet, so an upward rubber-band pull never shows a gap */
  box-shadow: var(--e-3), 0 160px 0 0 var(--cream);
  animation: slide-in var(--dur-slow) var(--ease);
  /* transform is driven frame by frame by a spring (useSheetDrag → lib/spring), so no CSS transition on it */
  transition: opacity var(--dur) var(--ease);
}
.sheet.is-dragging {
  transition: none;
  animation: none; /* grabbed mid-entrance: the finger takes over from where it was caught */
}
.sheet__handle {
  flex-shrink: 0;
  padding: var(--s-3) var(--gutter) var(--s-2);
  touch-action: none;
  cursor: grab;
}
.sheet.is-dragging .sheet__handle {
  cursor: grabbing;
}
.sheet__grip {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto var(--s-3);
  border-radius: var(--r-pill);
  background: var(--sand-dark);
}
.sheet__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--s-3);
}
.sheet__title {
  font: var(--t-h1);
  letter-spacing: var(--track-h1);
  color: var(--ink-900);
}
.sheet__subtitle {
  margin-top: 2px;
  font: var(--t-small);
  color: var(--ink-500);
}
.swap-enter-active,
.swap-leave-active {
  transition: transform var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease);
}
.swap-enter-from,
.swap-leave-to {
  transform: scale(calc(1 - 0.4 * var(--motion)));
  opacity: 0;
}
.sheet__body {
  overflow-y: auto;
  padding: var(--s-2) var(--gutter) var(--s-6);
}
@keyframes fade-in {
  from { opacity: 0; }
}
@keyframes slide-in {
  from { transform: translateY(calc(100% * var(--motion))); opacity: var(--motion); }
}
</style>
