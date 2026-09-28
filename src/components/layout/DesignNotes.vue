<script setup>
/**
 * Desktop only: an annotated screen figure. Callouts in the dark space either side of the phone,
 * each tied by a leader line to the control it describes (elements marked data-req="FR3" …).
 * Each note = design rationale (data/designRationale.js: title, why, principle, evidence,
 * trade-off) + its trace to the RTM (docs/a3/rtm.csv, personas.md, quoted as written).
 * Screens are numbered S1–S11. Nothing is drawn over the phone except a highlight while you
 * hover a note. Loaded as its own chunk, so phones never download it.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import rtmCsv from '../../../docs/a3/rtm.csv?raw'
import personasMd from '../../../docs/a3/personas.md?raw'
import AppIcon from '@/components/base/AppIcon.vue'
import SurveyPicker from './SurveyPicker.vue'
import { RATIONALE, SCREENS } from '@/data/designRationale'
import { SURVEY_FORMS } from '@/data/surveyForms'
import { EVERY_SCREEN, ROUTE_REQUIREMENTS, layoutColumn, notesFor, parseCsv, parsePersonas } from '@/lib/designNotes'

const props = defineProps({ open: { type: Boolean, default: true } })
const emit = defineEmits(['toggle'])

const { t } = useI18n()
const route = useRoute()
const rows = parseCsv(rtmCsv)
const docs = parsePersonas(personasMd)

/** S1 Leading Page is an overlay on Home at launch, not a route: the frame loop notices it. */
const splash = ref(false)
const screen = computed(() => (splash.value ? 'splash' : ROUTE_REQUIREMENTS[route.name] ? route.name : 'home'))
const meta = computed(() => SCREENS.find((s) => s.key === screen.value))
const withRationale = (key) => (n) => ({ ...n, ...(RATIONALE[`${key}:${n.id}`] ?? RATIONALE[`*:${n.id}`]) })
const notes = computed(() => [
  ...notesFor(ROUTE_REQUIREMENTS[screen.value], rows, docs).map(withRationale(screen.value)),
  ...notesFor(EVERY_SCREEN, rows, docs).map((n) => ({ ...withRationale('*')(n), everywhere: true })),
])
const hovered = ref(null)
watch(
  () => props.open,
  () => (hovered.value = null),
)
/** While a participant picks a scenario, the callouts step aside (focus on one task). */
const surveyOpen = ref(false)
/** The persona picked in the Scenario Task panel: its Task 1–3 sit on the right, so the left
    column holds who you are and where to answer, and neither side gets crowded. */
const chosen = ref(null)
const chosenForm = computed(() => SURVEY_FORMS.find((f) => f.persona === chosen.value))
watch(surveyOpen, (on) => on || (chosen.value = null))

/* ---- per-frame placement (no re-render: styles and paths are written directly) ---- */
const layer = ref(null)
const bar = ref(null)
const tasksEl = ref(null)
const clip = ref(null)
const ring = ref(null)
const cards = new Map() // id -> element
const leaders = new Map() // id -> <path>
const setCard = (id) => (el) => (el ? cards.set(id, el) : cards.delete(id))
const setLeader = (id) => (el) => (el ? leaders.set(id, el) : leaders.delete(id))

const GAP_PHONE = 44 // between the phone and the notes: the leader lines run here
const EDGE = 24
const MAX_W = 272
const MIN_W = 168
const RING_OUTSET = 0 // the ring box is the control itself; its halo + brand stroke sit just outside the edge
let raf = 0
const written = new WeakMap()
/** Resting (collapsed) height per card: an opened note floats over its neighbours instead of
    pushing them — nothing moves that you aren't pointing at. */
const restH = new WeakMap()
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
    return { el, rect: r, top, bottom, left, right }
  }
  return null
}

/** The control's own corner radius (px, % or pill), so the ring follows its shape. */
function radiusOf(el, r) {
  const raw = getComputedStyle(el).borderTopLeftRadius
  const short = Math.min(r.width, r.height)
  const v = parseFloat(raw) || 0
  return Math.min(raw.endsWith('%') ? (v / 100) * short : v, short / 2)
}

function frame() {
  raf = requestAnimationFrame(frame)
  const device = document.querySelector('.device')
  if (!device || !layer.value) return
  const splashOn = Boolean(device.querySelector('.splash'))
  if (splashOn !== splash.value) splash.value = splashOn
  const dev = device.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const widthL = Math.min(MAX_W, dev.left - GAP_PHONE - EDGE)
  const widthR = Math.min(MAX_W, vw - dev.right - GAP_PHONE - EDGE)
  const room = Math.min(widthL, widthR) >= MIN_W
  write(layer.value, 'vis', room ? 'visible' : 'hidden', (v) => (layer.value.style.visibility = v))
  if (!room) return

  const xL = dev.left - GAP_PHONE - widthL
  const xR = dev.right + GAP_PHONE
  if (bar.value) {
    write(bar.value, 'box', `${xL},${widthL}`, () => {
      bar.value.style.left = `${xL}px`
      bar.value.style.width = `${widthL}px`
    })
  }
  if (tasksEl.value) {
    write(tasksEl.value, 'box', `${xR},${widthR}`, () => {
      tasksEl.value.style.left = `${xR}px`
      tasksEl.value.style.width = `${widthR}px`
      tasksEl.value.style.visibility = 'visible' // hidden until it has its place (no flash at the left edge)
    })
  }
  if (clip.value) {
    write(clip.value, 'box', `${dev.left},${dev.top},${dev.width},${dev.height}`, () => {
      Object.assign(clip.value.style, { left: `${dev.left}px`, top: `${dev.top}px`, width: `${dev.width}px`, height: `${dev.height}px` })
    })
  }
  let ringBox = 'off'
  if (props.open && !surveyOpen.value) {
    const headBottom = bar.value ? bar.value.getBoundingClientRect().bottom + 16 : dev.top
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
      if (hovered.value !== note.id || !restH.has(el)) restH.set(el, el.offsetHeight)
      placed[side].push({ note, el, a, want: y, h: restH.get(el) })
    }

    for (const side of ['left', 'right']) {
      const list = placed[side]
      // each leader gets its own elbow lane in the gap, so vertical runs never sit on top of each other
      const lanes = list.filter((it) => it.a).sort((p, q) => p.want - q.want)
      const top = side === 'left' ? Math.max(headBottom, dev.top) : dev.top
      const tops = layoutColumn(list, { top, bottom: dev.bottom, gap: 10 })
      list.forEach((it, i) => {
        const x = side === 'left' ? xL : xR
        const w = side === 'left' ? widthL : widthR
        let y = tops[i]
        // an opened note that would run off the bottom of the window slides up to fit
        if (hovered.value === it.note.id) y = Math.max(EDGE, Math.min(y, vh - EDGE - it.el.offsetHeight))
        write(it.el, 'box', `${x},${y},${w}`, () => {
          it.el.style.transform = `translate3d(${x}px, ${y}px, 0)`
          it.el.style.width = `${w}px`
          it.el.style.setProperty('--placed', '1') // fades in only once it is where it belongs (a style, so Vue's class patching can't undo it)
        })
        const path = leaders.get(it.note.id)
        let d = ''
        if (it.a) {
          // card edge → elbow in the gap → the phone's edge, level with the control
          const h = hovered.value === it.note.id ? it.el.offsetHeight : it.h
          const cy = Math.min(Math.max(it.want, y + 16), y + h - 16)
          const cx = side === 'left' ? x + w : x
          const px = side === 'left' ? dev.left - 6 : dev.right + 6
          const lane = 12 + ((lanes.indexOf(it) * 7) % 26) // 12…33 px from the phone
          const ex = side === 'left' ? dev.left - lane : dev.right + lane
          d = `M${cx},${cy} H${ex} V${it.want} H${px}`
          if (hovered.value === it.note.id) {
            const r = it.a.rect
            const rad = radiusOf(it.a.el, r) + RING_OUTSET
            ringBox = `${r.left - dev.left - RING_OUTSET},${r.top - dev.top - RING_OUTSET},${r.width + RING_OUTSET * 2},${r.height + RING_OUTSET * 2},${rad}`
          }
        }
        if (path) write(path, 'd', d, (v) => path.setAttribute('d', v))
      })
    }
  }
  if (ring.value) {
    write(ring.value, 'box', ringBox, (v) => {
      if (v === 'off') return ring.value.classList.remove('is-on')
      const [x, y, w, h, rad] = v.split(',')
      Object.assign(ring.value.style, { transform: `translate(${x}px, ${y}px)`, width: `${w}px`, height: `${h}px`, borderRadius: `${rad}px` })
      ring.value.classList.add('is-on')
    })
  }
}

onMounted(() => (raf = requestAnimationFrame(frame)))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div
    ref="layer"
    class="notes"
    :class="{ 'is-surveying': surveyOpen, 'is-closed': !open }"
    :aria-label="t('designNotes.title')"
    role="complementary"
  >
    <svg class="notes__lines" aria-hidden="true">
      <defs>
        <marker id="notes-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" class="notes__arrowhead" />
        </marker>
        <marker id="notes-arrow-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" class="notes__arrowhead notes__arrowhead--on" />
        </marker>
      </defs>
      <template v-if="open">
        <path
          v-for="note in notes"
          :key="note.id"
          :ref="setLeader(note.id)"
          class="notes__leader"
          :class="{ 'is-hovered': hovered === note.id }"
          d=""
          :marker-end="hovered === note.id ? 'url(#notes-arrow-on)' : 'url(#notes-arrow)'"
        />
      </template>
    </svg>

    <!-- the hovered note's control, ringed like a focus ring (clipped to the phone's screen) -->
    <div ref="clip" class="notes__clip" aria-hidden="true"><span ref="ring" class="notes__ring" /></div>

    <div ref="bar" class="notes__bar">
      <!-- two peers: show/hide the notes · take part in the evaluation -->
      <div class="notes__buttons">
        <button type="button" class="stage-btn pressable" :class="{ 'is-on': open }" :aria-pressed="open" @click="emit('toggle')">
          <AppIcon name="info" :size="18" />
          {{ t('designNotes.show') }}
        </button>
        <button
          type="button"
          class="stage-btn pressable"
          :class="{ 'is-on': surveyOpen }"
          :aria-expanded="surveyOpen"
          aria-controls="survey-panel"
          @click="surveyOpen = !surveyOpen"
        >
          <AppIcon name="check" :size="18" :stroke-width="2.4" />
          {{ t('survey.button') }}
        </button>
      </div>

      <Transition name="bar-swap" mode="out-in">
        <SurveyPicker v-if="surveyOpen" key="survey" v-model:chosen="chosen" class="notes__panel" @close="surveyOpen = false" />
        <header v-else-if="open" key="head" class="notes__head">
          <p class="notes__eyebrow">{{ t('designNotes.title') }}</p>
          <h2 class="notes__screen" lang="en">
            <span class="notes__num">{{ meta?.id }}</span> {{ meta?.name }}
          </h2>
          <p class="notes__intent" lang="en">{{ meta?.intent }}</p>
          <p class="notes__subtitle">{{ t('designNotes.subtitle') }}</p>
        </header>
      </Transition>
    </div>

    <!-- Scenario Task: the chosen persona's tasks, in the right-hand column -->
    <Transition name="tasks-in">
      <section v-if="surveyOpen && chosenForm" ref="tasksEl" :key="chosenForm.persona" class="notes__tasks" lang="en" :aria-label="t('survey.tasks')">
        <p class="notes__eyebrow">{{ t('survey.tasks') }}</p>
        <ol class="notes__task-list">
          <li v-for="(task, i) in chosenForm.tasks" :key="task.title" class="notes__task">
            <b>Task {{ i + 1 }}</b>
            <span><strong>{{ task.title }}</strong> {{ task.text }}</span>
          </li>
        </ol>
      </section>
    </Transition>

    <template v-if="open">
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
          <span class="note__name">{{ note.title }}</span>
          <span v-if="note.everywhere" class="note__tag">{{ t('designNotes.everyScreen') }}</span>
        </p>
        <p class="note__req">{{ note.why }}</p>
        <!-- the details open on hover / focus, so the resting figure stays calm -->
        <dl v-if="hovered === note.id" class="note__facts">
          <dt>{{ t('designNotes.principle') }}</dt>
          <dd>{{ note.principle }}</dd>
          <dt>{{ t('designNotes.evidence') }}</dt>
          <dd>{{ note.evidence }}</dd>
          <dt>{{ t('designNotes.tradeoff') }}</dt>
          <dd>{{ note.tradeoff }}</dd>
          <dt>{{ t('designNotes.requirement') }}</dt>
          <dd>{{ note.requirement }}</dd>
          <template v-if="note.personas.length">
            <dt>{{ t('designNotes.whoFor') }}</dt>
            <dd>
              <span v-for="p in note.personas" :key="p.id" class="note__line">{{ p.id }} {{ p.name }}</span>
              <span v-for="w in note.workflows" :key="w.id" class="note__line">{{ w.id }} {{ w.title }}</span>
            </dd>
          </template>
          <dt>{{ note.priority }}</dt>
          <dd>{{ note.status }}</dd>
        </dl>
      </article>
    </template>
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
.notes.is-surveying .note,
.notes.is-surveying .notes__lines {
  visibility: hidden;
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
.notes__arrowhead--on {
  fill: var(--accent-100);
}
.notes__clip {
  position: fixed;
  overflow: hidden;
  border-radius: 44px; /* the phone's screen corners: the ring never spills onto the frame */
  pointer-events: none;
}
.notes__ring {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  /* a focus ring: a thin paper halo, then the brand colour, so it reads on cream screens and
     on camera views alike, and it hugs the control's own shape */
  box-shadow: 0 0 0 2px var(--paper), 0 0 0 4.5px var(--brand-600), 0 0 18px 4px var(--brand-halo);
  transition: opacity var(--dur-fast) var(--ease);
}
.notes__ring.is-on {
  opacity: 1;
}
.notes.is-closed .notes__lines,
.notes.is-closed .notes__clip {
  display: none;
}
.notes__bar {
  position: absolute;
  top: var(--s-6); /* left and width follow the left-hand column (set each frame) */
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  max-height: calc(100vh - 2 * var(--s-6)); /* the page never scrolls; a long panel scrolls inside */
  pointer-events: auto;
}
.notes__buttons {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--s-2);
}
.stage-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--hit);
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  color: var(--cream);
  font: var(--t-button);
  text-align: left;
  transition: scale var(--dur) var(--ease), background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.stage-btn.is-on {
  background: var(--accent-100); /* on: the action colour on dark surfaces (README §5.2) */
  border-color: var(--accent-100);
  color: var(--ink-900);
}
.notes__tasks {
  position: absolute;
  top: var(--s-6); /* left and width follow the right-hand column (set each frame) */
  visibility: hidden;
  max-height: calc(100vh - 2 * var(--s-6)); /* the page never scrolls; long tasks scroll inside */
  overflow-y: auto;
  padding: var(--s-4);
  border-radius: var(--r-lg);
  background: var(--stage-card-strong);
  border: 1px solid var(--stage-line);
  box-shadow: var(--e-2);
  pointer-events: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--stage-line) transparent;
}
.notes__task {
  padding: var(--s-3) 0;
  border-top: 1px solid var(--stage-line);
}
.notes__task:first-child {
  border-top: 0;
  padding-top: var(--s-1);
}
.notes__task-list {
  display: grid;
  margin: var(--s-2) 0 0;
  padding: 0;
  list-style: none;
  font: var(--t-body-sm);
  color: var(--cream);
}
.notes__task-list li {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.notes__task-list strong {
  display: block;
  font-weight: 600;
}
.notes__task-list b {
  color: var(--accent-100);
}
.tasks-in-enter-active,
.tasks-in-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.tasks-in-enter-from,
.tasks-in-leave-to {
  opacity: 0;
  transform: translateX(calc(12px * var(--motion))); /* arrives from, and leaves to, the right */
}
.notes__panel {
  flex: 1 1 auto;
  min-height: 0;
}
.bar-swap-enter-active,
.bar-swap-leave-active {
  transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.bar-swap-enter-from,
.bar-swap-leave-to {
  opacity: 0;
  transform: translateY(calc(-6px * var(--motion)));
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
.notes__num {
  color: var(--accent-100);
}
.notes__intent {
  margin: var(--s-2) 0 0;
  font: var(--t-body-sm);
  color: var(--cream);
}
.notes__subtitle {
  margin: var(--s-2) 0 0;
  font: var(--t-meta);
  color: var(--ink-300);
}
.note {
  position: absolute;
  max-height: calc(100vh - 3rem); /* a very long opened note scrolls inside, never off-screen */
  overflow-y: auto;
  top: 0;
  left: 0;
  opacity: calc(var(--placed, 0) * var(--rest-opacity, 1));
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-md);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  pointer-events: auto;
  cursor: default;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease),
    opacity var(--dur) var(--ease);
}
.note--quiet {
  --rest-opacity: 0.8;
}
.note.is-hovered {
  z-index: 1; /* opened: floats over the notes below */
  box-shadow: var(--e-2);
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
.note__name {
  color: var(--cream);
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
