<script setup>
/**
 * Desktop "Scenario Task" › the chosen persona's Task 1–3 (right-hand card). Each task can be
 * ticked off (remembered per browser, per persona); when all three are done a short celebration
 * appears and points to the next step, the Google Form. Reduced motion: no burst, just a fade.
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
const done = computed(() => progress.value[props.form.persona] ?? props.form.tasks.map(() => false))
const count = computed(() => done.value.filter(Boolean).length)
const allDone = computed(() => count.value === props.form.tasks.length)

/** The burst plays only when the last task is ticked now, not when reopening a finished scenario. */
const celebrate = ref(false)
watch(allDone, (now, before) => (celebrate.value = now && before === false))
watch(
  () => props.form.persona,
  () => (celebrate.value = false),
)

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress.value))
  } catch {
    /* not remembered, still works */
  }
}
function toggle(i) {
  const next = [...done.value]
  next[i] = !next[i]
  progress.value = { ...progress.value, [props.form.persona]: next }
  save()
}
function reset() {
  progress.value = { ...progress.value, [props.form.persona]: props.form.tasks.map(() => false) }
  save()
}
const meta = computed(() => [props.person?.age && `Age ${props.person.age}`, props.person?.role].filter(Boolean).join(' · '))
</script>

<template>
  <div class="tasks" lang="en">
    <header class="tasks__who">
      <PersonaAvatar :persona="form.persona" :size="40" />
      <div class="tasks__who-text">
        <!-- the progress pill shares the eyebrow's line, so name and details keep the full width -->
        <p class="tasks__eyebrow">
          {{ t('survey.tasks') }}
          <span class="tasks__count" :class="{ 'is-done': allDone }">{{ t('survey.progress', { n: count, total: form.tasks.length }) }}</span>
        </p>
        <p class="tasks__name">{{ person?.name ?? form.persona }}</p>
        <p class="tasks__meta">{{ meta }}</p>
      </div>
    </header>

    <ol class="tasks__list">
      <li v-for="(task, i) in form.tasks" :key="task.title" class="task" :class="{ 'is-done': done[i] }">
        <button
          type="button"
          role="checkbox"
          class="task__check pressable"
          :aria-checked="done[i]"
          :aria-label="t('survey.markDone', { n: i + 1 })"
          @click="toggle(i)"
        >
          <span class="task__box"><AppIcon name="check" :size="16" :stroke-width="3" /></span>
        </button>
        <div class="task__body">
          <p class="task__num">Task {{ i + 1 }}</p>
          <p class="task__title">{{ task.title }}</p>
          <p class="task__text">{{ task.text }}</p>
        </div>
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
        <a :href="form.url" target="_blank" rel="noopener" class="tasks__form pressable">
          {{ t('survey.open') }}
          <AppIcon name="chevron" :size="16" />
        </a>
        <button type="button" class="tasks__reset pressable-dim" @click="reset">{{ t('survey.reset') }}</button>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
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
.tasks__count {
  margin: 0;
  letter-spacing: 0;
  text-transform: none;
  padding: 0.125rem var(--s-2);
  border-radius: var(--r-pill);
  background: var(--stage-card);
  border: 1px solid var(--stage-line);
  font: var(--t-label-sm);
  color: var(--ink-300);
  white-space: nowrap;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.tasks__count.is-done {
  background: var(--accent-100);
  border-color: var(--accent-100);
  color: var(--ink-900);
}
.tasks__list {
  margin: var(--s-3) 0 0;
  padding: 0;
  list-style: none;
}
.task {
  display: flex;
  gap: var(--s-2);
  padding: var(--s-3) 0;
  border-top: 1px solid var(--stage-line);
}
.task__check {
  flex-shrink: 0;
  width: var(--hit);
  height: var(--hit);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin: calc(-1 * var(--s-2)) 0 0 calc(-1 * var(--s-2));
  padding-top: var(--s-2);
  transition: scale var(--dur) var(--ease);
}
.task__box {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--ink-300);
  color: transparent;
  transition: background var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
@media (hover: hover) {
  .task__check:hover .task__box {
    border-color: var(--accent-100);
  }
}
.task.is-done .task__box {
  background: var(--accent-100);
  border-color: var(--accent-100);
  color: var(--ink-900);
}
.task__body {
  min-width: 0;
  transition: opacity var(--dur) var(--ease);
}
.task.is-done .task__body {
  opacity: 0.6; /* done: steps back, like a ticked reminder */
}
.task__num {
  margin: 0;
  font: var(--t-label-sm);
  color: var(--accent-100);
}
.task__title {
  margin: 0.125rem 0 0;
  font: var(--t-h3);
  font-weight: 600;
  color: var(--cream);
}
.task__text {
  margin: 0.125rem 0 0;
  font: var(--t-body-sm);
  color: var(--cream);
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
}
.tasks__done-title {
  margin: 0;
  font: var(--t-title);
  color: var(--cream);
}
.tasks__done-text {
  margin: 0 0 var(--s-2);
  font: var(--t-body-sm);
  color: var(--ink-300);
}
.tasks__form {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  min-height: var(--hit);
  padding: 0 var(--s-3) 0 var(--s-4);
  border-radius: var(--r-pill);
  background: var(--accent-100);
  color: var(--ink-900);
  font: var(--t-button);
  transition: scale var(--dur) var(--ease);
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
