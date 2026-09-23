<script setup>
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'

const emit = defineEmits(['close'])
const { t } = useI18n()
</script>

<template>
  <div class="help" @click.self="emit('close')">
    <section class="help__card" role="dialog" aria-modal="true" aria-labelledby="ar-help-title">
      <h2 id="ar-help-title" class="t-h1">{{ t('ar.helpTitle') }}</h2>
      <ol class="help__steps">
        <li v-for="n in 4" :key="n">{{ t(`ar.help${n}`) }}</li>
      </ol>
      <BaseButton block @click="emit('close')">{{ t('ar.gotIt') }}</BaseButton>
    </section>
  </div>
</template>

<style scoped>
.help {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: var(--scrim);
}
.help__card {
  padding: var(--s-6);
  border-radius: var(--r-lg);
  background: var(--cream);
  color: var(--ink-700);
}
.help__steps {
  margin: var(--s-3) 0 var(--s-5);
  padding-left: var(--s-5);
  font: var(--t-body);
}
.help__steps li + li {
  margin-top: var(--s-2);
}
</style>
