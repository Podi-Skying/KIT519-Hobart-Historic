<script setup>
/**
 * Desktop "Scenario Task" › the chosen persona's Task 1–3 (right-hand card), one at a time:
 * a segmented progress bar on top, finished tasks folded to one line (tap to reopen), the
 * current task open with one clear "Done" button, later tasks locked until it's their turn.
 * Progress is remembered per browser, per persona. When all three are done a short celebration
 * points to the questionnaire (the QR code on the left). Reduced motion: no burst, just a fade.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/base/AppIcon.vue'
import PersonaAvatar from './PersonaAvatar.vue'

const props = defineProps({
  form: { type: Object, required: true }, // an entry of SURVEY_FORMS
  person: { type: Object, default: null }, // { name, age, role } from personas.md
})
const { t } = useI18n()

const KEY = 'scenario-task-progress'
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
const progress = ref(load())
const total = computed(() => props.form.tasks.length)
/** Tasks are done in order, so progress is one number: how many are finished. */
const step = computed(() => {
  const done = progress.value[props.form.persona] ?? []
  const first = props.form.tasks.findIndex((_, i) => !done[i])
  return first === -1 ? total.value : first
})
const allDone = computed(() => step.value === total.value)

/** The burst plays only when the last task is finished now, not when reopening a finished scenario. */
const celebrate = ref(false)
watch(step, (now, before) => (celebrate.value = now === total.value && before < total.value))
watch(
  () => props.form.persona,
  () => (celebrate.value = false),
)

function setStep(n) {
  progress.value = { ...progress.value, [props.form.persona]: props.form.tasks.map((_, i) => i < n) }
  try {
    localStorage.setItem(KEY, JSON.stringify(progress.value))
  } catch {
    /* not remembered, still works */
  }
}
const finish = () => setStep(step.value + 1)
/** Reopening a finished task puts you back on it (and re-locks the ones after it). */
const reopen = (i) => setStep(i)

const meta = computed(() => [props.person?.age && `Age ${props.person.age}`, props.person?.role].filter(Boolean).join(' · '))
</script>

<template>
  <div class="tasks" lang="en">
    <header class="tasks__who">
      <PersonaAvatar :persona="form.persona" :size="40" />
      <div class="tasks__who-text">
        <p class="tasks__eyebrow">{{ t('survey.tasks') }}</p>
        <p class="tasks__name">{{ person?.name ?? form.persona }}</p>
        <p class="tasks__meta">{{ meta }}</p>
      </div>
    </header>

    <!-- segmented progress: one segment per task, filled as each is finished -->
    <div
      class="tasks__progress"
      role="progressbar"
      :aria-valuemin="0"
      :aria-valuemax="total"
      :aria-valuenow="step"
      :aria-valuetext="t('survey.progress', { n: step, total })"
    >
      <span v-for="(task, i) in form.tasks" :key="task.title" class="tasks__segment" :class="{ 'is-done': i < step, 'is-current': i === step }">
        <i />
      </span>
    </div>
    <p class="tasks__count">{{ allDone ? t('survey.done') : t('survey.stepOf', { n: step + 1, total }) }}</p>

    <ol class="tasks__list">
      <li
        v-for="(task, i) in form.tasks"
        :key="task.title"
        class="task"
        :class="{ 'is-done': i < step, 'is-current': i === step, 'is-locked': i > step }"
      >
        <!-- finished: one line, tap to reopen -->
        <button v-if="i < step" type="button" class="task__row pressable-dim" :aria-label="t('survey.reopen', { n: i + 1 })" @click="reopen(i)">
          <span class="task__badge task__badge--done"><AppIcon name="check" :size="14" :stroke-width="3" /></span>
          <span class="task__row-text"><b>Task {{ i + 1 }}</b> {{ task.title }}</span>
        </button>

        <!-- current: open, with one clear action -->
        <div v-else-if="i === step" class="task__open">
          <p class="task__num"><span class="task__badge">{{ i + 1 }}</span> Task {{ i + 1 }}</p>
          <p class="task__title">{{ task.title }}</p>
          <p class="task__text">{{ task.text }}</p>
          <button type="button" class="task__done pressable" @click="finish">
            <AppIcon name="check" :size="18" :stroke-width="2.6" />
            {{ i + 1 < total ? t('survey.doneNextTask') : t('survey.doneLast') }}
          </button>
        </div>

        <!-- later: locked until it's their turn -->
        <p v-else class="task__row task__row--locked">
          <span class="task__badge task__badge--locked"><AppIcon name="lock" :size="13" :stroke-width="2.2" /></span>
          <span class="task__row-text"><b>Task {{ i + 1 }}</b> {{ t('survey.locked', { n: i }) }}</span>
        </p>
      </li>
    </ol>

    <Transition name="tasks-done">
      <div v-if="allDone" class="tasks__done" :class="{ 'is-celebrating': celebrate }" role="status">
        <span class="tasks__burst" aria-hidden="true">
          <i v-for="n in 12" :key="n" :style="{ '--a': `${n * 30}deg`, '--d': `${(n % 3) * 40}ms` }" />
          <span class="tasks__medal"><AppIcon name="check" :size="26" :stroke-width="3" /></span>
        </span>
        <p class="tasks__done-title">{{ t('survey.done') }}</p>
        <p class="tasks__done-text">{{ t('survey.doneNext', { form: form.form }) }}</p>
        <button type="button" class="tasks__reset pressable-dim" @click="setStep(0)">{{ t('survey.reset') }}</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tasks__who {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.tasks__who-text {
  flex: 1;
  min-width: 0;
}
.tasks__eyebrow {
  margin: 0;
  font: var(--t-caption);
  letter-spacing: var(--track-caption);
  text-transform: uppercase;
  color: var(--accent-100);
}
.tasks__name {
  margin: 0.125rem 0 0;
  font: var(--t-title);
  color: var(--cream);
}
.tasks__meta {
  margin: 0;
  font: var(--t-meta);
  color: var(--ink-300);
}
/* ---- progress ---- */
.tasks__progress {
  display: flex;
  gap: var(--s-1);
  margin-top: var(--s-4);
}
.tasks__segment {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--stage-line);
}
.tasks__segment i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent-100);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur-slow) var(--ease-page);
}
.tasks__segment.is-done i {
  transform: scaleX(1); /* fills left to right, the way the tasks run */
}
.tasks__segment.is-current {
  background: var(--stage-leader);
}
.tasks__count {
  margin: var(--s-2) 0 0;
  font: var(--t-label-sm);
  color: var(--ink-300);
}
/* ---- tasks ---- */
.tasks__list {
  margin: var(--s-2) 0 0;
  padding: 0;
  list-style: none;
}
.task {
  border-top: 1px solid var(--stage-line);
}
.task__row {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  width: 100%;
  min-height: var(--hit);
  margin: 0;
  padding: 0;
  color: var(--ink-300);
  font: var(--t-body-sm);
  text-align: left;
  transition: opacity var(--dur) var(--ease);
}
.task__row-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task__row-text b {
  color: var(--cream);
  font-weight: 600;
}
.task__row--locked .task__badge {
  opacity: 0.7; /* only the lock fades: the text keeps its 6:1 contrast on the stage card */
}
.task__badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent-100);
  color: var(--ink-900);
  font: var(--t-label-sm);
}
.task__badge--done {
  background: var(--accent-100);
}
.task__badge--locked {
  background: none;
  border: 1.5px solid var(--stage-leader);
  color: var(--ink-300);
}
.task__open {
  padding: var(--s-3) 0 var(--s-4);
}
.task__num {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin: 0;
  font: var(--t-label-sm);
  color: var(--accent-100);
}
.task__title {
  margin: var(--s-2) 0 0;
  font: var(--t-row-title);
  color: var(--cream);
}
.task__text {
  margin: var(--s-1) 0 0;
  font: var(--t-body-sm);
  color: var(--cream);
}
.task__done {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--s-2);
  width: 100%;
  min-height: var(--hit);
  margin-top: var(--s-4);
  border-radius: var(--r-pill);
  background: var(--accent-100);
  color: var(--ink-900);
  font: var(--t-button);
  transition: scale var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
/* ---- all done ---- */
.tasks__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-1);
  margin-top: var(--s-2);
  padding: var(--s-4);
  border-radius: var(--r-md);
  background: var(--stage-card);
  border: 1px solid var(--accent-100);
  text-align: center;
}
.tasks__burst {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: var(--s-1);
}
.tasks__medal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent-100);
  color: var(--ink-900);
}
.tasks__burst i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: var(--accent-500);
  opacity: 0;
}
.tasks__burst i:nth-child(3n) {
  background: var(--brand-100);
}
.tasks__burst i:nth-child(3n + 1) {
  background: var(--accent-100);
}
.is-celebrating .tasks__medal {
  animation: medal-pop 520ms var(--ease-page) both;
}
.is-celebrating .tasks__burst i {
  animation: burst 700ms var(--ease) var(--d) both;
}
@keyframes medal-pop {
  0% { scale: 0.4; opacity: 0; }
  60% { scale: 1.12; opacity: 1; }
  100% { scale: 1; }
}
@keyframes burst {
  0% { opacity: 1; transform: rotate(var(--a)) translateY(0); }
  100% { opacity: 0; transform: rotate(var(--a)) translateY(-46px); }
}
@media (prefers-reduced-motion: reduce) {
  .is-celebrating .tasks__medal,
  .is-celebrating .tasks__burst i {
    animation: none;
  }
  .tasks__segment i {
    transition-duration: 0ms;
  }
}
.tasks__done-title {
  margin: 0;
  font: var(--t-title);
  color: var(--cream);
}
.tasks__done-text {
  margin: 0;
  font: var(--t-body-sm);
  color: var(--ink-300);
}
.tasks__reset {
  min-height: var(--hit);
  padding: 0 var(--s-3);
  color: var(--ink-300);
  font: var(--t-label-sm);
}
.tasks-done-enter-active,
.tasks-done-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.tasks-done-enter-from,
.tasks-done-leave-to {
  opacity: 0;
  transform: translateY(calc(8px * var(--motion)));
}
</style>
