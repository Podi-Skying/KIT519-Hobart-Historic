<script setup>
/**
 * Desktop only: callouts in the dark space either side of the phone, each tied by a leader line
 * to the control it describes (elements marked data-req="FR3" …), like an annotated screen
 * figure. Text is quoted verbatim from docs/a3/rtm.csv and personas.md — never rewritten here
 * (assignment GenAI rule). Nothing is drawn over the phone except a highlight while you hover
 * a note. Loaded as its own chunk, so phones never download it.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import rtmCsv from '../../../docs/a3/rtm.csv?raw'
import personasMd from '../../../docs/a3/personas.md?raw'
import AppIcon from '@/components/base/AppIcon.vue'
import { EVERY_SCREEN, ROUTE_REQUIREMENTS, layoutColumn, notesFor, parseCsv, parsePersonas } from '@/lib/designNotes'

const props = defineProps({ open: { type: Boolean, default: true } })
const emit = defineEmits(['toggle'])

const { t, te } = useI18n()
const route = useRoute()
const rows = parseCsv(rtmCsv)
const docs = parsePersonas(personasMd)

const screen = computed(() => (ROUTE_REQUIREMENTS[route.name] ? route.name : 'home'))
const screenName = computed(() => (te(`designNotes.screens.${screen.value}`) ? t(`designNotes.screens.${screen.value}`) : ''))
const notes = computed(() => [
  ...notesFor(ROUTE_REQUIREMENTS[screen.value], rows, docs),
  ...notesFor(EVERY_SCREEN, rows, docs).map((n) => ({ ...n, everywhere: true })),
])
const hovered = ref(null)

/* ---- per-frame placement (no re-render: styles and paths are written directly) ---- */
const layer = ref(null)
const head = ref(null)
const cards = new Map() // id -> element
const leaders = new Map() // id -> <path>
const highlight = ref(null)
const setCard = (id) => (el) => (el ? cards.set(id, el) : cards.delete(id))
const setLeader = (id) => (el) => (el ? leaders.set(id, el) : leaders.delete(id))

const GAP_PHONE = 44 // between the phone and the notes: the leader lines run here
const EDGE = 24
const MAX_W = 272
const MIN_W = 168
let raf = 0
const written = new WeakMap()
function write(el, key, value, apply) {
  const prev = written.get(el) ?? {}
  if (prev[key] === value) return
  prev[key] = value
  written.set(el, prev)
  apply(value)
}

function findAnchor(id, device, dev) {
  for (const el of device.querySelectorAll(`[data-req~="${id}"]`)) {
    const r = el.getBoundingClientRect()
    const top = Math.max(r.top, dev.top)
    const bottom = Math.min(r.bottom, dev.bottom)
    const left = Math.max(r.left, dev.left)
    const right = Math.min(r.right, dev.right)
    if (r.width < 2 || bottom - top < 6 || right - left < 6) continue // hidden or scrolled away
    if (getComputedStyle(el).visibility === 'hidden') continue
    return { top, bottom, left, right }
  }
  return null
}

function frame() {
  raf = requestAnimationFrame(frame)
  const device = document.querySelector('.device')
  if (!device || !layer.value || !props.open) return
  const dev = device.getBoundingClientRect()
  const vw = window.innerWidth
  const widthL = Math.min(MAX_W, dev.left - GAP_PHONE - EDGE)
  const widthR = Math.min(MAX_W, vw - dev.right - GAP_PHONE - EDGE)
  const room = Math.min(widthL, widthR) >= MIN_W
  write(layer.value, 'vis', room ? 'visible' : 'hidden', (v) => (layer.value.style.visibility = v))
  if (!room) return

  const xL = dev.left - GAP_PHONE - widthL
  const xR = dev.right + GAP_PHONE
  if (head.value) {
    write(head.value, 'box', `${xL},${widthL}`, () => {
      head.value.style.left = `${xL}px`
      head.value.style.width = `${widthL}px`
    })
  }
  const headBottom = head.value ? head.value.getBoundingClientRect().bottom + 16 : dev.top
  const mid = (dev.left + dev.right) / 2

  // anchor + side for each note
  const placed = { left: [], right: [] }
  let spare = 0
  for (const note of notes.value) {
    const el = cards.get(note.id)
    if (!el) continue
    const a = note.everywhere ? null : findAnchor(note.id, device, dev)
    let side
    if (a) side = (a.left + a.right) / 2 < mid ? 'left' : 'right'
    else side = spare++ % 2 ? 'left' : 'right' // unanchored: shared out, at the bottom
    const y = a ? Math.min(Math.max((a.top + a.bottom) / 2, dev.top + 36), dev.bottom - 36) : Infinity
    placed[side].push({ note, el, a, want: y, h: el.offsetHeight })
  }

  let hl = ''
  for (const side of ['left', 'right']) {
    const list = placed[side]
    const top = side === 'left' ? Math.max(headBottom, dev.top) : dev.top
    const tops = layoutColumn(list, { top, bottom: dev.bottom, gap: 10 })
    list.forEach((it, i) => {
      const x = side === 'left' ? xL : xR
      const w = side === 'left' ? widthL : widthR
      write(it.el, 'box', `${x},${tops[i]},${w}`, () => {
        it.el.style.transform = `translate3d(${x}px, ${tops[i]}px, 0)`
        it.el.style.width = `${w}px`
      })
      const path = leaders.get(it.note.id)
      let d = ''
      if (it.a) {
        // card edge → elbow in the gap → the phone's edge, level with the control
        const cy = Math.min(Math.max(it.want, tops[i] + 16), tops[i] + it.h - 16)
        const cx = side === 'left' ? x + w : x
        const px = side === 'left' ? dev.left - 6 : dev.right + 6
        const ex = side === 'left' ? dev.left - GAP_PHONE / 2 : dev.right + GAP_PHONE / 2
        d = `M${cx},${cy} H${ex} V${it.want} H${px}`
        if (hovered.value === it.note.id) {
          hl = `M${it.a.left + 10},${it.a.top} H${it.a.right - 10} Q${it.a.right},${it.a.top} ${it.a.right},${it.a.top + 10} V${it.a.bottom - 10} Q${it.a.right},${it.a.bottom} ${it.a.right - 10},${it.a.bottom} H${it.a.left + 10} Q${it.a.left},${it.a.bottom} ${it.a.left},${it.a.bottom - 10} V${it.a.top + 10} Q${it.a.left},${it.a.top} ${it.a.left + 10},${it.a.top} Z`
        }
      }
      if (path) write(path, 'd', d, (v) => path.setAttribute('d', v))
    })
  }
  if (highlight.value) write(highlight.value, 'd', hl, (v) => highlight.value.setAttribute('d', v))
}

onMounted(() => (raf = requestAnimationFrame(frame)))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div v-if="!open" class="notes-toggle">
    <button type="button" class="notes__show pressable" @click="emit('toggle')">{{ t('designNotes.show') }}</button>
  </div>
  <div v-else ref="layer" class="notes" :aria-label="t('designNotes.title')" role="complementary">
    <svg class="notes__lines" aria-hidden="true">
      <defs>
        <marker id="notes-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" class="notes__arrowhead" />
        </marker>
      </defs>
      <path ref="highlight" class="notes__highlight" d="" />
      <path
        v-for="note in notes"
        :key="note.id"
        :ref="setLeader(note.id)"
        class="notes__leader"
        :class="{ 'is-hovered': hovered === note.id }"
        d=""
        marker-end="url(#notes-arrow)"
      />
    </svg>

    <header ref="head" class="notes__head">
      <div>
        <p class="notes__eyebrow">{{ t('designNotes.title') }}</p>
        <h2 class="notes__screen">{{ screenName }}</h2>
        <p class="notes__subtitle">{{ t('designNotes.subtitle') }}</p>
      </div>
      <button type="button" class="notes__hide pressable-dim" :aria-label="t('designNotes.hide')" @click="emit('toggle')">
        <AppIcon name="close" :size="18" />
      </button>
    </header>

    <article
      v-for="note in notes"
      :key="`${screen}-${note.id}`"
      :ref="setCard(note.id)"
      class="note"
      :class="{ 'note--quiet': note.everywhere, 'is-hovered': hovered === note.id }"
      tabindex="0"
      lang="en"
      @mouseenter="hovered = note.id"
      @mouseleave="hovered = null"
      @focus="hovered = note.id"
      @blur="hovered = null"
    >
      <p class="note__title">
        <b>{{ note.id }}</b>
        <span v-if="note.everywhere" class="note__tag">{{ t('designNotes.everyScreen') }}</span>
      </p>
      <p class="note__req">{{ note.requirement }}</p>
      <!-- the details open on hover / focus, so the resting figure stays calm -->
      <dl v-if="hovered === note.id" class="note__facts">
        <dt>{{ t('designNotes.why') }}</dt>
        <dd>{{ note.why }}</dd>
        <template v-if="note.personas.length">
          <dt>{{ t('designNotes.whoFor') }}</dt>
          <dd>
            <span v-for="p in note.personas" :key="p.id" class="note__line">{{ p.id }} {{ p.name }}</span>
            <span v-for="w in note.workflows" :key="w.id" class="note__line">{{ w.id }} {{ w.title }}</span>
          </dd>
        </template>
        <template v-if="note.evidence">
          <dt>{{ t('designNotes.evidence') }}</dt>
          <dd>{{ note.evidence }}</dd>
        </template>
        <dt>{{ note.priority }}</dt>
        <dd>{{ note.status }}</dd>
      </dl>
    </article>
  </div>
</template>

<style scoped>
.notes,
.notes__lines {
  position: fixed;
  inset: 0;
  pointer-events: none; /* never blocks the phone */
}
.notes {
  z-index: 5;
  visibility: hidden; /* shown by the first frame, once everything has a place */
  color: var(--cream);
}
.notes__lines {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.notes__leader {
  fill: none;
  stroke: var(--stage-leader);
  stroke-width: 1.5;
  transition: stroke var(--dur-fast) var(--ease);
}
.notes__leader.is-hovered {
  stroke: var(--accent-100);
}
.notes__arrowhead {
  fill: var(--stage-leader);
}
.notes__highlight {
  fill: none;
  stroke: var(--accent-100);
  stroke-width: 2;
}
.notes__head {
  position: absolute;
  top: var(--s-6); /* left and width follow the left-hand column (set each frame) */
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
  pointer-events: auto;
}
.notes__eyebrow {
  margin: 0;
  font: var(--t-caption);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--accent-100);
}
.notes__screen {
  margin: var(--s-1) 0 0;
  font: var(--t-h1);
  letter-spacing: var(--track-h1);
  color: var(--cream);
}
.notes__subtitle {
  margin: var(--s-1) 0 0;
  font: var(--t-meta);
  color: var(--ink-300);
}
.notes__hide {
  flex-shrink: 0;
  width: var(--hit);
  height: var(--hit);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: calc(-1 * var(--s-2)) 0 0;
  border-radius: 50%;
  color: var(--ink-300);
}
.notes-toggle {
  position: fixed;
  top: var(--s-6);
  left: var(--s-6);
  z-index: 5;
}
.notes__show {
  min-height: var(--hit);
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  color: var(--cream);
  font: var(--t-button);
}
.note {
  position: absolute;
  top: 0;
  left: 0;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-md);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  pointer-events: auto;
  cursor: default;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.note.is-hovered {
  border-color: var(--accent-100);
  background: var(--stage-card-strong);
}
.note:focus-visible {
  box-shadow: 0 0 0 2px var(--accent-100);
}
.note__title {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin: 0;
  font: var(--t-label);
  color: var(--accent-100);
}
.note__tag {
  font: var(--t-micro);
  color: var(--ink-300);
}
.note__req {
  margin: 0.125rem 0 0;
  font: var(--t-body-sm);
  color: var(--cream);
}
.note--quiet {
  opacity: 0.8;
}
.note__facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--s-1) var(--s-3);
  margin: var(--s-2) 0 0;
  padding-top: var(--s-2);
  border-top: 1px solid var(--stage-line);
  font: var(--t-meta);
}
.note__facts dt {
  color: var(--ink-300);
}
.note__facts dd {
  margin: 0;
  color: var(--cream);
}
.note__line {
  display: block;
}
</style>
