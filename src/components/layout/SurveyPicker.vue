<script setup>
/**
 * Desktop "Scenario Task" panel: choose one of the three persona scenarios, read the persona and
 * its three tasks (word for word from that Google Form, data/surveyForms.js), then answer the form
 * — scan the QR code with a phone, or click it / "Google Form Link" here. Esc closes.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import personasMd from '../../../docs/a3/personas.md?raw'
import AppIcon from '@/components/base/AppIcon.vue'
import PersonaAvatar from './PersonaAvatar.vue'
import { SURVEY_FORMS } from '@/data/surveyForms'
import { parsePersonas } from '@/lib/designNotes'

const emit = defineEmits(['close'])
const { t } = useI18n()

const { personas } = parsePersonas(personasMd)
const scenarios = SURVEY_FORMS.map((f) => {
  const p = personas[f.persona] ?? { name: f.persona, age: null, role: '' }
  // name on its own line; age and role underneath in small type (never "(Age: 22)" in brackets)
  const meta = [p.age && `Age ${p.age}`, p.role].filter(Boolean).join(' · ')
  return { ...f, name: p.name, meta }
})

/** The chosen persona is shared with DesignNotes, which shows its Task 1–3 on the right-hand side. */
const chosen = defineModel('chosen', { type: String, default: null })
const current = computed(() => scenarios.find((s) => s.persona === chosen.value))
const close = () => emit('close')
</script>

<template>
  <section id="survey-panel" class="survey" :aria-label="t('survey.title')" @keydown.esc="close">
    <Transition name="survey-swap" mode="out-in">
      <!-- step 1: pick a persona -->
      <div v-if="!current" key="list" class="survey__step">
        <h3 class="survey__title">{{ t('survey.title') }}</h3>
        <p class="survey__lead">{{ t('survey.lead') }}</p>
        <ul class="survey__list">
          <li v-for="s in scenarios" :key="s.persona">
            <button type="button" class="scenario pressable-card" @click="chosen = s.persona">
              <PersonaAvatar :persona="s.persona" :size="40" />
              <span class="scenario__text" lang="en">
                <b>{{ s.name }}</b>
                <small>{{ s.meta }}</small>
              </span>
              <AppIcon name="chevron" :size="18" class="scenario__chevron" />
            </button>
          </li>
        </ul>
      </div>

      <!-- step 2: the scenario's tasks (scroll inside) + its questionnaire (always in view) -->
      <div v-else key="detail" class="survey__step survey__step--detail">
        <div class="survey__scroll">
          <button type="button" class="survey__back pressable-dim" @click="chosen = null">
            <AppIcon name="back" :size="16" />
            {{ t('survey.back') }}
          </button>
          <div class="survey__who" lang="en">
            <PersonaAvatar :persona="current.persona" :size="56" />
            <div>
              <h3 class="survey__title">{{ current.name }}</h3>
              <p class="survey__role">{{ current.meta }}</p>
            </div>
          </div>
          <p class="survey__intro" lang="en">{{ current.intro }}</p>
          <p class="survey__hint">{{ t('survey.tasksRight') }}</p>
        </div>
        <div class="survey__answer">
          <p class="survey__label">{{ t('survey.answer', { form: current.form }) }}</p>
          <div class="survey__ways">
            <!-- the QR code is a link too: click it on a big screen, scan it with a phone -->
            <a :href="current.url" target="_blank" rel="noopener" class="survey__qr-link pressable" :aria-label="t('survey.qrAlt', { form: current.form })">
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
            </a>
            <p class="survey__how">{{ t('survey.scan') }}</p>
          </div>
          <!-- full panel width: never pokes out of the panel on a narrow column -->
          <a :href="current.url" target="_blank" rel="noopener" class="survey__open pressable">
            {{ t('survey.open') }}
            <AppIcon name="chevron" :size="16" />
          </a>
        </div>
      </div>
    </Transition>
  </section>
</template>
<style scoped>
.survey {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--s-4);
  border-radius: var(--r-lg);
  background: var(--stage-card-strong);
  border: 1px solid var(--stage-line);
  box-shadow: var(--e-2);
}
.survey__step {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--stage-line) transparent;
}
.survey__step--detail {
  overflow: visible;
}
.survey__scroll {
  flex: 1 1 auto;
  min-height: 4rem;
  overflow-y: auto; /* long task lists scroll here; the form below always stays in view */
  scrollbar-width: thin;
  scrollbar-color: var(--stage-line) transparent;
}
.survey__answer {
  flex-shrink: 0;
  margin-top: var(--s-2);
  padding-top: var(--s-1);
  border-top: 1px solid var(--stage-line);
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
.survey__who {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.survey__role {
  margin: 0.125rem 0 0;
  font: var(--t-meta);
  color: var(--ink-300);
}
.survey__intro {
  margin: var(--s-3) 0 0;
  font: var(--t-body-sm);
  color: var(--cream);
}
.survey__hint {
  display: flex;
  align-items: center;
  gap: var(--s-1);
  margin: var(--s-3) 0 0;
  font: var(--t-label-sm);
  color: var(--accent-100);
}
.survey__label {
  margin: var(--s-3) 0 var(--s-1);
  font: var(--t-caption);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--ink-300);
}
.survey__qr {
  display: block;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: var(--r-md);
}
.survey__qr-bg {
  fill: var(--paper); /* dark modules on white with a quiet zone: every phone camera reads it */
}
.survey__qr-dots {
  fill: var(--ink-900);
}
.survey__ways {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.survey__qr-link {
  flex-shrink: 0;
  display: block;
  border-radius: var(--r-md);
  transition: scale var(--dur) var(--ease), box-shadow var(--dur-fast) var(--ease);
}
@media (hover: hover) {
  .survey__qr-link:hover {
    box-shadow: 0 0 0 3px var(--accent-100);
  }
}
.survey__how {
  flex: 1;
  min-width: 0;
  margin: 0;
  font: var(--t-body-sm);
  color: var(--ink-300);
}
.survey__open {
  /* the panel's one primary action: a filled pill in the dark-surface action colour, full width */
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: var(--s-3);
  gap: var(--s-1);
  min-height: var(--hit);
  padding: 0 var(--s-3) 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--accent-100);
  color: var(--ink-900);
  font: var(--t-button);
  white-space: nowrap;
  transition: scale var(--dur) var(--ease);
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
