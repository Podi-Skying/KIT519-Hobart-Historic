<script setup>
/**
 * Floating AR hotspot. Tap → emits `select`; drag → emits `move` with the new
 * position as a percentage of the parent (clamped to keep it on screen).
 */
import { ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  position: { type: Object, required: true }, // { x, y } in %
  active: { type: Boolean, default: false },
  bounds: { type: Object, default: () => ({ minX: 12, maxX: 88, minY: 32, maxY: 74 }) },
})
const emit = defineEmits(['select', 'move'])

const DRAG_THRESHOLD = 6
const el = ref(null)
let gesture = null

function onPointerDown(e) {
  gesture = { x: e.clientX, y: e.clientY, moved: false, rect: el.value.parentElement.getBoundingClientRect() }
  el.value.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!gesture) return
  if (!gesture.moved && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) < DRAG_THRESHOLD) return
  gesture.moved = true
  const { rect } = gesture
  const { minX, maxX, minY, maxY } = props.bounds
  emit('move', {
    x: Math.min(maxX, Math.max(minX, ((e.clientX - rect.left) / rect.width) * 100)),
    y: Math.min(maxY, Math.max(minY, ((e.clientY - rect.top) / rect.height) * 100)),
  })
}

function onPointerUp() {
  if (gesture && !gesture.moved) emit('select')
  gesture = null
}
</script>

<template>
  <button
    ref="el"
    type="button"
    class="bubble"
    :class="{ 'is-active': active }"
    :style="{ left: `${position.x}%`, top: `${position.y}%` }"
    :aria-label="label"
    :aria-pressed="active"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="gesture = null"
    @keydown.enter.prevent="emit('select')"
    @keydown.space.prevent="emit('select')"
  >
    <span class="bubble__circle"><AppIcon :name="icon" :size="24" /></span>
    <span class="bubble__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.bubble {
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);
  touch-action: none;
  animation: pop 0.35s var(--ease) backwards;
}
.bubble__circle {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--cream);
  color: var(--ink-900);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.35), var(--e-2);
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.bubble.is-active .bubble__circle {
  background: var(--brand-600);
  color: var(--paper);
  box-shadow: 0 0 0 4px rgba(125, 48, 69, 0.35), var(--e-2);
}
.bubble__label {
  padding: 3px 9px;
  border-radius: var(--r-pill);
  background: var(--glass);
  color: var(--cream);
  font: 600 11px var(--font-label);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4);
  }
}
</style>
