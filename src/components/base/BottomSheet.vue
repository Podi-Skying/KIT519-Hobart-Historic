<script setup>
/** Modal bottom sheet with scrim. Closes on scrim tap or Escape. */
import { onBeforeUnmount, onMounted } from 'vue'

defineProps({
  label: { type: String, required: true },
})
const emit = defineEmits(['close'])

const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="label">
      <span class="sheet__grip" aria-hidden="true" />
      <slot />
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  background: var(--scrim);
  animation: fade var(--dur) var(--ease);
}
.sheet {
  width: 100%;
  background: var(--cream);
  color: var(--ink-700);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  padding: var(--s-3) var(--gutter) var(--s-6);
  animation: rise var(--dur-slow) var(--ease);
}
.sheet__grip {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto var(--s-4);
  border-radius: 2px;
  background: var(--sand-dark);
}
@keyframes fade {
  from { opacity: 0; }
}
@keyframes rise {
  from { transform: translateY(40px); }
}
</style>
