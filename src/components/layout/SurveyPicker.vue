<script setup>
/**
 * Desktop design notes › "Take part": choose one of the three persona scenarios, read its tasks
 * (quoted from evaluation-plan.md), then answer that persona's Google Form — scan the QR code
 * with a phone or open the link here. Grows out of its button (anchored origin) and closes back
 * into it; Esc closes.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import planMd from '../../../docs/a3/evaluation/evaluation-plan.md?raw'
import personasMd from '../../../docs/a3/personas.md?raw'
import AppIcon from '@/components/base/AppIcon.vue'
import { SURVEY_FORMS } from '@/data/surveyForms'
import { parsePersonas, parseTasks, scenarioFor } from '@/lib/designNotes'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['update:open'])
const { t } = useI18n()

const { personas } = parsePersonas(personasMd)
const tasks = parseTasks(planMd)
const scenarios = SURVEY_FORMS.map((f) => {
  const [name, role = ''] = (personas[f.persona] ?? f.persona).split(/:\s*/)
  return { ...f, name, role, tasks: scenarioFor(f.persona, tasks) }
})

const chosen = ref(null)
const current = computed(() => scenarios.find((s) => s.persona === chosen.value))
const toggle = () => {
  emit('update:open', !props.open)
  if (props.open) chosen.value = null
}
function close() {
  emit('update:open', false)
  chosen.value = null
}
</script>

<template>
  <div class="survey" @keydown.esc="close">
    <button
      type="button"
      class="survey__button pressable"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      aria-controls="survey-panel"
      @click="toggle"
    >
      <AppIcon name="check" :size="18" :stroke-width="2.4" />
      {{ t('survey.button') }}
    </button>

    <Transition name="survey-grow">
      <section v-if="open" id="survey-panel" class="survey__panel" :aria-label="t('survey.title')">
        <Transition name="survey-swap" mode="out-in">
          <!-- step 1: pick a persona -->
          <div v-if="!current" key="list">
            <h3 class="survey__title">{{ t('survey.title') }}</h3>
            <p class="survey__lead">{{ t('survey.lead') }}</p>
            <ul class="survey__list">
              <li v-for="s in scenarios" :key="s.persona">
                <button type="button" class="scenario pressable-card" @click="chosen = s.persona">
                  <span class="scenario__tile" lang="en">{{ s.persona }}</span>
                  <span class="scenario__text" lang="en">
                    <b>{{ s.name }}</b>
                    <small>{{ s.role }} · Form {{ s.form }}</small>
                  </span>
                  <AppIcon name="chevron" :size="18" class="scenario__chevron" />
                </button>
              </li>
            </ul>
          </div>

          <!-- step 2: the scenario's tasks + its questionnaire -->
          <div v-else key="detail">
            <button type="button" class="survey__back pressable-dim" @click="chosen = null">
              <AppIcon name="back" :size="16" />
              {{ t('survey.back') }}
            </button>
            <h3 class="survey__title" lang="en">{{ current.persona }} · {{ current.name }}</h3>
            <p class="survey__label">{{ t('survey.tasks') }}</p>
            <ol class="survey__tasks" lang="en">
              <li v-for="task in current.tasks" :key="task.id">
                <b>{{ task.id }}</b>
                <span>{{ task.scenario }}</span>
              </li>
            </ol>
            <p class="survey__label">{{ t('survey.answer', { form: current.form }) }}</p>
            <div class="survey__answer">
              <svg
                class="survey__qr"
                :viewBox="`-4 -4 ${current.qr.size + 8} ${current.qr.size + 8}`"
                role="img"
                :aria-label="t('survey.qrAlt', { form: current.form })"
                shape-rendering="crispEdges"
              >
                <rect x="-4" y="-4" :width="current.qr.size + 8" :height="current.qr.size + 8" class="survey__qr-bg" />
                <path :d="current.qr.path" class="survey__qr-dots" />
              </svg>
              <div class="survey__ways">
                <p>{{ t('survey.scan') }}</p>
                <a :href="current.url" target="_blank" rel="noopener" class="survey__open pressable">
                  {{ t('survey.open', { form: current.form }) }}
                  <AppIcon name="chevron" :size="16" />
                </a>
              </div>
            </div>
          </div>
        </Transition>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.survey {
  margin-top: var(--s-3);
}
.survey__button {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--hit);
  padding: 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--accent-100); /* the action colour on dark surfaces (README §5.2) */
  color: var(--ink-900);
  font: var(--t-button);
  transition: scale var(--dur) var(--ease), background var(--dur) var(--ease);
}
.survey__button.is-open {
  background: var(--cream);
}
.survey__panel {
  margin-top: var(--s-2);
  padding: var(--s-4);
  max-height: calc(100vh - 16rem);
  overflow-y: auto;
  border-radius: var(--r-lg);
  background: var(--stage-card-strong);
  border: 1px solid var(--stage-line);
  box-shadow: var(--e-2);
  transform-origin: 0 0; /* grows out of the button above it */
  scrollbar-width: thin;
  scrollbar-color: var(--stage-line) transparent;
}
.survey__title {
  margin: 0;
  font: var(--t-title);
  color: var(--cream);
}
.survey__lead {
  margin: var(--s-1) 0 var(--s-3);
  font: var(--t-body-sm);
  color: var(--ink-300);
}
.survey__list {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.scenario {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--hit);
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-md);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  color: var(--cream);
  text-align: left;
  transition: scale var(--dur) var(--ease), border-color var(--dur-fast) var(--ease);
}
@media (hover: hover) {
  .scenario:hover {
    border-color: var(--accent-100);
  }
}
.scenario__tile {
  width: var(--row-icon);
  height: var(--row-icon);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md); /* same list-row tile as the app's sheets */
  background: var(--accent-100);
  color: var(--ink-900);
  font: var(--t-label);
}
.scenario__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.scenario__text b {
  font: var(--t-h3);
  font-weight: 600;
}
.scenario__text small {
  font: var(--t-meta);
  color: var(--ink-300);
}
.scenario__chevron {
  color: var(--ink-300);
}
.survey__back {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  min-height: var(--hit);
  margin: calc(-1 * var(--s-3)) 0 0 calc(-1 * var(--s-1));
  padding: 0 var(--s-1);
  color: var(--accent-100);
  font: var(--t-button);
}
.survey__label {
  margin: var(--s-3) 0 var(--s-1);
  font: var(--t-caption);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--ink-300);
}
.survey__tasks {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font: var(--t-body-sm);
  color: var(--cream);
}
.survey__tasks li {
  display: grid;
  grid-template-columns: 1.75rem 1fr;
}
.survey__tasks b {
  color: var(--accent-100);
}
.survey__answer {
  display: flex;
  flex-wrap: wrap; /* narrow window: the link drops under the QR code */
  align-items: center;
  gap: var(--s-3);
}
.survey__qr {
  width: 132px;
  height: 132px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
}
.survey__qr-bg {
  fill: var(--paper); /* dark modules on white with a quiet zone: every phone camera reads it */
}
.survey__qr-dots {
  fill: var(--ink-900);
}
.survey__ways {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  min-width: 0;
}
.survey__ways p {
  margin: 0;
  font: var(--t-body-sm);
  color: var(--ink-300);
}
.survey__open {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  min-height: var(--hit);
  color: var(--accent-100);
  font: var(--t-button);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: scale var(--dur) var(--ease);
}
/* grows from the button and shrinks back into it (same path both ways) */
.survey-grow-enter-active,
.survey-grow-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.survey-grow-enter-from,
.survey-grow-leave-to {
  opacity: 0;
  transform: scale(calc(1 - 0.06 * var(--motion))) translateY(calc(-6px * var(--motion)));
}
.survey-swap-enter-active,
.survey-swap-leave-active {
  transition: opacity var(--dur-fast) var(--ease);
}
.survey-swap-enter-from,
.survey-swap-leave-to {
  opacity: 0;
}
</style>
