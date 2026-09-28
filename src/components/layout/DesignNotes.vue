<script setup>
/**
 * Desktop only: the requirements this screen implements and why — quoted verbatim from the
 * team's RTM (docs/a3/rtm.csv) and personas (docs/a3/personas.md), never rewritten here
 * (assignment GenAI rule). Loaded as its own chunk, so phones never download it.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import rtmCsv from '../../../docs/a3/rtm.csv?raw'
import personasMd from '../../../docs/a3/personas.md?raw'
import AppIcon from '@/components/base/AppIcon.vue'
import { EVERY_SCREEN, ROUTE_REQUIREMENTS, notesFor, parseCsv, parsePersonas } from '@/lib/designNotes'

defineProps({ open: { type: Boolean, default: true } })
const emit = defineEmits(['toggle'])

const { t, te } = useI18n()
const route = useRoute()
const rows = parseCsv(rtmCsv)
const docs = parsePersonas(personasMd)

const screen = computed(() => (ROUTE_REQUIREMENTS[route.name] ? route.name : 'home'))
const screenName = computed(() => (te(`designNotes.screens.${screen.value}`) ? t(`designNotes.screens.${screen.value}`) : ''))
const notes = computed(() => notesFor(ROUTE_REQUIREMENTS[screen.value], rows, docs))
const everywhere = notesFor(EVERY_SCREEN, rows, docs)
</script>

<template>
  <aside class="notes" :aria-label="t('designNotes.title')">
    <button v-if="!open" type="button" class="notes__show pressable" @click="emit('toggle')">
      {{ t('designNotes.show') }}
    </button>
    <template v-else>
      <header class="notes__head">
        <div>
          <p class="notes__eyebrow">{{ t('designNotes.title') }}</p>
          <h2 class="notes__screen">{{ screenName }}</h2>
        </div>
        <button type="button" class="notes__hide pressable-dim" :aria-label="t('designNotes.hide')" @click="emit('toggle')">
          <AppIcon name="close" :size="18" />
        </button>
      </header>
      <p class="notes__subtitle">{{ t('designNotes.subtitle') }}</p>

      <Transition name="notes-swap" mode="out-in">
        <div :key="screen" class="notes__scroll">
          <p class="notes__label">{{ t('designNotes.thisScreen') }}</p>
          <article v-for="note in notes" :key="note.id" class="note" lang="en">
            <p class="note__meta">
              <b>{{ note.id }}</b> · {{ note.priority }} · {{ note.status }}
            </p>
            <p class="note__req">{{ note.requirement }}</p>
            <dl class="note__facts">
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
            </dl>
          </article>

          <p class="notes__label">{{ t('designNotes.everyScreen') }}</p>
          <article v-for="note in everywhere" :key="note.id" class="note note--quiet" lang="en">
            <p class="note__meta"><b>{{ note.id }}</b> · {{ note.priority }} · {{ note.status }}</p>
            <p class="note__req">{{ note.requirement }}</p>
          </article>
        </div>
      </Transition>
    </template>
  </aside>
</template>

<style scoped>
.notes {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  color: var(--cream);
}
.notes__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
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
  margin: var(--s-2) 0 var(--s-4);
  font: var(--t-body-sm);
  color: var(--ink-300);
}
.notes__hide {
  width: var(--hit);
  height: var(--hit);
  margin: calc(-1 * var(--s-2)) calc(-1 * var(--s-2)) 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--ink-300);
}
.notes__show {
  align-self: flex-start;
  min-height: var(--hit);
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  color: var(--cream);
  font: var(--t-button);
}
.notes__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--s-2);
  scrollbar-width: thin;
  scrollbar-color: var(--stage-line) transparent;
}
.notes__label {
  margin: var(--s-4) 0 var(--s-2);
  font: var(--t-caption);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--ink-300);
}
.notes__label:first-child {
  margin-top: 0;
}
.note {
  margin-bottom: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-md);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
}
.note__meta {
  margin: 0;
  font: var(--t-label-sm);
  color: var(--ink-300);
}
.note__meta b {
  color: var(--accent-100);
}
.note__req {
  margin: var(--s-1) 0 0;
  font: var(--t-reading);
  font-weight: 600;
  color: var(--cream);
}
.note__facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--s-1) var(--s-3);
  margin: var(--s-2) 0 0;
  font: var(--t-body-sm);
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
.note--quiet .note__req {
  font-weight: 400;
}
.notes-swap-enter-active,
.notes-swap-leave-active {
  transition: opacity var(--dur) var(--ease);
}
.notes-swap-enter-from,
.notes-swap-leave-to {
  opacity: 0;
}
</style>
