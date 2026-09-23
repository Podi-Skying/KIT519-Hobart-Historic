<script setup>
/** Language picker: switches all UI text, site content and narration voice. */
import { useI18n } from 'vue-i18n'
import BottomSheet from '@/components/base/BottomSheet.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { LOCALES, setLocale } from '@/i18n'

const emit = defineEmits(['close'])
const { t, locale } = useI18n()

function choose(code, dismiss) {
  setLocale(code)
  dismiss()
}
</script>

<template>
  <BottomSheet :label="t('language.title')" :title="t('language.title')" :subtitle="t('language.subtitle')" @close="emit('close')">
    <template #default="{ dismiss }">
      <ul class="languages" role="radiogroup" :aria-label="t('language.title')">
        <li v-for="option in LOCALES" :key="option.code">
          <button
            type="button"
            role="radio"
            class="language"
            :class="{ 'is-selected': locale === option.code }"
            :aria-checked="locale === option.code"
            :lang="option.code"
            @click="choose(option.code, dismiss)"
          >
            <span class="language__text">
              <b>{{ option.label }}</b>
              <small lang="en">{{ option.english }}</small>
            </span>
            <span class="language__check" aria-hidden="true">
              <AppIcon v-if="locale === option.code" name="check" :size="16" :stroke-width="3" />
            </span>
          </button>
        </li>
      </ul>
    </template>
  </BottomSheet>
</template>

<style scoped>
.languages {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.language {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: left;
  transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.language.is-selected {
  border-color: var(--brand-600);
  background: var(--brand-50);
}
.language__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.language__text b {
  font: 600 16px/22px var(--font-label);
  color: var(--ink-900);
}
.language__text small {
  font: 400 12px var(--font-body);
  color: var(--ink-500);
}
.language__check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--sand-dark);
  color: var(--paper);
}
.language.is-selected .language__check {
  border-color: var(--brand-600);
  background: var(--brand-600);
}
</style>
