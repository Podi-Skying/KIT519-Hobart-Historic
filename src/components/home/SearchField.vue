<script setup>
import { onMounted, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps({
  placeholder: { type: String, required: true },
  clearLabel: { type: String, required: true },
  /** Focus as soon as the field appears (e.g. after tapping a search icon). */
  autofocus: { type: Boolean, default: false },
})
const model = defineModel({ type: String, default: '' })
const input = ref(null)

function clear() {
  model.value = ''
  input.value?.focus()
}

onMounted(() => {
  if (props.autofocus) input.value?.focus({ preventScroll: true })
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <label class="search">
    <AppIcon name="search" :size="18" />
    <input
      ref="input"
      v-model="model"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      autocomplete="off"
      enterkeyhint="search"
    />
    <button v-if="model" type="button" class="search__clear" :aria-label="clearLabel" @click="clear">
      <AppIcon name="close" :size="16" />
    </button>
  </label>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  height: var(--hit);
  padding: 0 var(--s-4);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-pill);
  background: var(--paper);
  color: var(--ink-500);
  transition: border-color var(--dur) var(--ease);
}
.search:focus-within {
  border-color: var(--brand-600);
}
.search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: none;
  font: 500 14px var(--font-body);
  color: var(--ink-900);
}
.search input::-webkit-search-cancel-button {
  display: none;
}
.search__clear {
  display: flex;
  color: var(--ink-500);
}
</style>
