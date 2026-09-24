<script setup>
/**
 * Glowing call-to-action: frosted translucent core, two static halos, three pulses.
 * Sized from its parent's container (cqh/cqw) so the halos and pulses always fit the space
 * the splash gives it and never cover the copy, on any screen height.
 */
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
  /* the outer halo and the pulse peak are 1.55× the core, so 60cqh keeps them inside the box */
  --tap: clamp(84px, min(60cqh, 40cqw), 148px);
  position: relative;
  display: block;
  width: var(--tap);
  height: var(--tap);
}
.tap__halo,
.tap__pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
}
.tap__halo--inner {
  transform: scale(1.3);
  background: rgba(245, 239, 230, 0.12);
}
.tap__halo--outer {
  transform: scale(1.55);
  background: rgba(245, 239, 230, 0.06);
}
.tap__pulse {
  background: rgba(245, 239, 230, 0.26);
  animation: pulse 2.7s cubic-bezier(0.25, 0.6, 0.35, 1) infinite;
}
.tap__core {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18% 0 calc(18% + 0.22em); /* keeps the label on the bright centre; optically centred */
  border-radius: 50%;
  text-align: center;
  line-height: 1.5;
  /* frosted, so the photo shows through; the blur keeps the label ≥ 4.5:1 on any background.
     No border: the fill and the blur both fade out towards the rim, so the edge melts into the photo. */
  background: radial-gradient(
    circle closest-side,
    rgba(255, 253, 249, 0.82) 0 58%,
    rgba(245, 239, 230, 0.5) 80%,
    rgba(245, 239, 230, 0) 100%
  );
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  -webkit-mask-image: radial-gradient(circle closest-side, #000 72%, transparent 100%);
  mask-image: radial-gradient(circle closest-side, #000 72%, transparent 100%);
  color: var(--brand-600);
  font: 700 clamp(10px, calc(var(--tap) * 0.08), 12px) var(--font-label);
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}
</style>
