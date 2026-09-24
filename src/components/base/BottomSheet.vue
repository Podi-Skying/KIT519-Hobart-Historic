<script setup>
/**
 * Modal bottom sheet.
 * Dismiss by: dragging the grip/header down, the ✕ button, tapping the scrim, or Escape.
 * Every dismissal animates out, then emits `close` (parent removes it with v-if).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from './IconButton.vue'

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

/** Drag further than this (px) — or flick faster than FLICK px/ms — to dismiss. */
const DISMISS_DISTANCE = 96
const FLICK_VELOCITY = 0.6
const LEAVE_MS = 220

const offset = ref(0)
const dragging = ref(false)
const leaving = ref(false)
let drag = null

function dismiss() {
  if (leaving.value) return
  leaving.value = true
  setTimeout(() => emit('close'), LEAVE_MS)
}

/** Pointer capture keeps the drag alive outside the handle; it can throw for stale pointers, which is harmless. */
function capture(e, method) {
  try {
    e.currentTarget[method](e.pointerId)
  } catch {
    /* pointer already released */
  }
}

function onPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return
  if (e.target.closest('button')) return // let the ✕ button click through
  drag = { y: e.clientY, t: performance.now() }
  dragging.value = true
  capture(e, 'setPointerCapture')
}
function onPointerMove(e) {
  if (!drag) return
  offset.value = Math.max(0, e.clientY - drag.y) // only downward
}
function onPointerUp(e) {
  if (!drag) return
  const velocity = offset.value / Math.max(1, performance.now() - drag.t)
  drag = null
  dragging.value = false
  if (offset.value > DISMISS_DISTANCE || velocity > FLICK_VELOCITY) dismiss()
  else offset.value = 0 // snap back
  capture(e, 'releasePointerCapture')
}

const onKey = (e) => e.key === 'Escape' && dismiss()
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const showClose = () => props.closable ?? Boolean(props.title)
</script>

<template>
  <div class="scrim" :class="{ 'is-leaving': leaving }" @click.self="dismiss">
    <section
      class="sheet"
      :class="{ 'is-dragging': dragging, 'is-leaving': leaving }"
      :style="!leaving && offset ? { transform: `translateY(${offset}px)` } : null"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
    >
      <!-- Drag handle area: grip + header -->
      <div
        class="sheet__handle text-zoom"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
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
              @click="dismiss"
            />
          </Transition>
        </header>
      </div>
      <div class="sheet__body text-zoom">
        <slot :dismiss="dismiss" />
      </div>
    </section>
  </div>
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
.sheet {
  width: 100%;
  max-height: 78%;
  display: flex;
  flex-direction: column;
  background: var(--cream);
  color: var(--ink-700);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  box-shadow: var(--e-3);
  animation: slide-in var(--dur-slow) var(--ease);
  transition: transform var(--dur) var(--ease);
}
.sheet.is-dragging {
  transition: none;
}
.sheet.is-leaving {
  transform: translateY(100%);
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
  border-radius: 2px;
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
  transform: scale(0.6);
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
  from { transform: translateY(100%); }
}
</style>
