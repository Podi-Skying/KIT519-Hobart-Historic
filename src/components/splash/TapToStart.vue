<script setup>
/** Glowing call-to-action: solid core, two static halos, three filled pulses radiating out. */
defineProps({
  label: { type: String, default: 'Tap to start' },
})
</script>

<template>
  <span class="tap" aria-hidden="true">
    <span class="tap__halo tap__halo--outer" />
    <span class="tap__halo tap__halo--inner" />
    <span v-for="n in 3" :key="n" class="tap__pulse" :style="{ animationDelay: `${(n - 1) * 0.9}s` }" />
    <span class="tap__core">{{ label }}</span>
  </span>
</template>

<style scoped>
.tap {
  position: relative;
  display: block;
  width: 148px;
  height: 148px;
}
.tap__halo,
.tap__pulse {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  pointer-events: none;
}
.tap__halo--inner {
  width: 206px;
  height: 206px;
  margin: -103px 0 0 -103px;
  background: rgba(245, 239, 230, 0.2);
}
.tap__halo--outer {
  width: 272px;
  height: 272px;
  margin: -136px 0 0 -136px;
  background: rgba(245, 239, 230, 0.1);
}
.tap__pulse {
  width: 148px;
  height: 148px;
  margin: -74px 0 0 -74px;
  background: rgba(245, 239, 230, 0.4);
  animation: pulse 2.7s cubic-bezier(0.25, 0.6, 0.35, 1) infinite;
}
.tap__core {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 0.22em; /* optically centre the tracked text */
  border-radius: 50%;
  white-space: nowrap;
  background: radial-gradient(circle, #fffdf9 0 46%, var(--cream) 70%, var(--sand) 100%);
  box-shadow: 0 0 36px 8px rgba(245, 225, 196, 0.5);
  color: var(--brand-600);
  font: 700 12px var(--font-label);
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.1);
    opacity: 0;
  }
}
</style>
