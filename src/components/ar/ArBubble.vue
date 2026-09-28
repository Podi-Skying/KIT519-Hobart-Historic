<script setup>
/**
 * Floating AR hotspot. Tap → emits `select`; drag → emits `move` with the new
 * position as a percentage of the parent. Horizontally it can go right to the visible screen
 * edge (lib/bubble — the layer moves with the parallax); past a limit it rubber-bands and
 * springs back on release instead of hitting an invisible wall.
 */
import { ref } from 'vue'
import { clamp, horizontalRange, softClamp } from '@/lib/bubble'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  position: { type: Object, required: true }, // { x, y } in %
  active: { type: Boolean, default: false },
  /** Vertical limits in % of the layer (below the status pill, above the bottom card). */
  bounds: { type: Object, default: () => ({ minY: 32, maxY: 74 }) },
})
const emit = defineEmits(['select', 'move'])

const DRAG_THRESHOLD = 6
const el = ref(null)
let gesture = null
const settling = ref(false)

function onPointerDown(e) {
  const layer = el.value.parentElement
  const rect = layer.getBoundingClientRect()
  const stage = (layer.parentElement ?? layer).getBoundingClientRect()
  // keep the grab offset: the bubble doesn't jump to centre on the finger
  const grab = { x: e.clientX - (rect.left + (props.position.x / 100) * rect.width), y: e.clientY - (rect.top + (props.position.y / 100) * rect.height) }
  gesture = { x: e.clientX, y: e.clientY, moved: false, rect, grab, range: horizontalRange(stage, rect, el.value.offsetWidth) }
  settling.value = false
  el.value.setPointerCapture(e.pointerId)
}

function limits() {
  return { ...gesture.range, minY: props.bounds.minY, maxY: props.bounds.maxY }
}

function onPointerMove(e) {
  if (!gesture) return
  if (!gesture.moved && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) < DRAG_THRESHOLD) return
  gesture.moved = true
  const { rect, grab } = gesture
  const { minX, maxX, minY, maxY } = limits()
  emit('move', {
    x: softClamp(((e.clientX - grab.x - rect.left) / rect.width) * 100, minX, maxX),
    y: softClamp(((e.clientY - grab.y - rect.top) / rect.height) * 100, minY, maxY),
  })
}

/** A cancelled press never selects; a cancelled drag still springs back inside. */
function onPointerCancel() {
  if (gesture && !gesture.moved) gesture = null
  else onPointerUp()
}

function onPointerUp() {
  if (gesture && !gesture.moved) emit('select')
  else if (gesture) {
    // released past an edge: spring back inside
    const { minX, maxX, minY, maxY } = limits()
    const x = clamp(props.position.x, minX, maxX)
    const y = clamp(props.position.y, minY, maxY)
    if (x !== props.position.x || y !== props.position.y) {
      settling.value = true
      emit('move', { x, y })
    }
  }
  gesture = null
}
</script>

<template>
  <button
    ref="el"
    type="button"
    class="bubble pressable"
    :class="{ 'is-active': active, 'is-settling': settling }"
    :style="{ left: `${position.x}%`, top: `${position.y}%` }"
    :aria-label="label"
    :aria-pressed="active"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
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
  gap: 0.375rem;
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
  box-shadow: 0 0 0 4px var(--ar-glow), var(--e-2); /* same muted AR tone as the arrows and scan frame */
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.bubble.is-active .bubble__circle {
  background: var(--brand-600);
  color: var(--paper);
  box-shadow: 0 0 0 4px var(--brand-halo), var(--e-2);
}
.bubble__label {
  padding: 0.1875rem 0.5625rem;
  border-radius: var(--r-pill);
  background: var(--glass);
  color: var(--cream);
  font: var(--t-label-sm); /* 12px 600: small text over live imagery needs the extra size */
}
.bubble.is-settling {
  transition: left var(--dur-page) var(--ease), top var(--dur-page) var(--ease);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(calc(1 - 0.6 * var(--motion)));
  }
}
</style>
