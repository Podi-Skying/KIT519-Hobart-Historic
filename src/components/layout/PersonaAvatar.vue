<script setup>
/**
 * Illustrated avatars for the three evaluation personas (desktop "Scenario Task" panel).
 * Original flat drawings in the app's palette — one visual system, no stock photos:
 * P1 Minzi (22, art & design student: black bob, beret), P2 Margaret (71: silver curls, round
 * glasses, cardigan), P3 Sam (teacher: short hair, glasses, shirt). Decorative: the name is
 * always next to it, so the SVG is aria-hidden.
 */
defineProps({
  persona: { type: String, required: true }, // 'P1' | 'P2' | 'P3'
  size: { type: Number, default: 40 },
})
const uid = `pa-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <svg class="avatar" :class="`avatar--${persona.toLowerCase()}`" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <clipPath :id="uid"><circle cx="32" cy="32" r="32" /></clipPath>
    </defs>
    <g :clip-path="`url(#${uid})`">
      <rect class="avatar__bg" width="64" height="64" />

      <!-- P1 Minzi -->
      <template v-if="persona === 'P1'">
        <path class="avatar__hair" d="M19 38 C16 20 24 11 32 11 C40 11 48 20 45 38 C43 40 41 38 41 35 L41 25 C37 23 27 23 23 25 L23 35 C23 38 21 40 19 38 Z" />
        <path class="avatar__cloth" d="M9 64 C11 49 21 43 32 43 C43 43 53 49 55 64 Z" />
        <rect class="avatar__skin" x="28" y="34" width="8" height="10" rx="3" />
        <ellipse class="avatar__skin" cx="32" cy="28" rx="10" ry="11.5" />
        <path class="avatar__hair" d="M21.5 27 C21 18 26 15 32 15 C38 15 43 18 42.5 27 C39 23 36 22 32 22 C28 22 25 23 21.5 27 Z" />
        <ellipse class="avatar__beret" cx="30" cy="13.5" rx="12.5" ry="4.5" transform="rotate(-10 30 13.5)" />
        <circle class="avatar__beret" cx="29" cy="8.8" r="1.6" />
      </template>

      <!-- P2 Margaret -->
      <template v-else-if="persona === 'P2'">
        <path class="avatar__cloth" d="M9 64 C11 49 21 43 32 43 C43 43 53 49 55 64 Z" />
        <path class="avatar__collar" d="M26 44 L32 52 L38 44 Z" />
        <rect class="avatar__skin" x="28" y="34" width="8" height="10" rx="3" />
        <ellipse class="avatar__skin" cx="32" cy="29" rx="10" ry="11.5" />
        <g class="avatar__hair">
          <circle cx="22.5" cy="24" r="5.5" />
          <circle cx="27" cy="18" r="6" />
          <circle cx="33.5" cy="16.5" r="6.5" />
          <circle cx="40" cy="19.5" r="6" />
          <circle cx="42.5" cy="26" r="4.8" />
          <circle cx="21.8" cy="30" r="3.6" />
        </g>
        <g class="avatar__glasses">
          <circle cx="27.8" cy="29.5" r="3.6" />
          <circle cx="36.2" cy="29.5" r="3.6" />
          <path d="M31.4 29.5 H32.6" />
        </g>
        <path class="avatar__smile" d="M29.5 35.2 Q32 37 34.5 35.2" />
      </template>

      <!-- P3 Sam -->
      <template v-else>
        <path class="avatar__cloth" d="M9 64 C11 49 21 43 32 43 C43 43 53 49 55 64 Z" />
        <path class="avatar__collar" d="M27 44 L32 49 L37 44 L35 43 L32 46 L29 43 Z" />
        <rect class="avatar__skin" x="28" y="34" width="8" height="10" rx="3" />
        <ellipse class="avatar__skin" cx="32" cy="28.5" rx="10" ry="11.5" />
        <path class="avatar__hair" d="M21.5 27 C20.5 15 27 12.5 33 12.5 C40 12.5 44.5 17 42.5 27 C41 21.5 37 19.5 31.5 19.5 C27 19.5 23.5 22 21.5 27 Z" />
        <g class="avatar__glasses">
          <rect x="23.8" y="26.2" width="7.2" height="5.6" rx="1.6" />
          <rect x="33" y="26.2" width="7.2" height="5.6" rx="1.6" />
          <path d="M31 28.5 H33" />
        </g>
        <path class="avatar__smile" d="M29.5 35 Q32 36.6 34.5 35" />
      </template>

      <!-- eyes (behind the glasses for P2 and P3) -->
      <g class="avatar__eyes">
        <circle cx="28" :cy="persona === 'P2' ? 29.5 : 29" r="1.1" />
        <circle cx="36" :cy="persona === 'P2' ? 29.5 : 29" r="1.1" />
      </g>
      <path v-if="persona === 'P1'" class="avatar__smile" d="M29.5 34.2 Q32 35.8 34.5 34.2" />
    </g>
  </svg>
</template>

<style scoped>
.avatar {
  display: block;
  flex-shrink: 0;
  border-radius: 50%;
}
.avatar__skin {
  fill: var(--avatar-skin);
}
.avatar__hair {
  fill: var(--avatar-hair);
}
.avatar__cloth {
  fill: var(--avatar-cloth);
}
.avatar__bg {
  fill: var(--avatar-bg);
}
.avatar__collar {
  fill: var(--paper);
}
.avatar__beret {
  fill: var(--accent-500);
}
.avatar__glasses,
.avatar__smile {
  fill: none;
  stroke: var(--ink-900);
  stroke-width: 1.3;
  stroke-linecap: round;
}
.avatar__eyes circle {
  fill: var(--ink-900);
}
/* one palette per persona, all from the design tokens */
.avatar--p1 {
  --avatar-bg: var(--brand-50);
  --avatar-skin: var(--avatar-skin-light);
  --avatar-hair: var(--ink-900);
  --avatar-cloth: var(--brand-600);
}
.avatar--p2 {
  --avatar-bg: var(--accent-100);
  --avatar-skin: var(--avatar-skin-light);
  --avatar-hair: var(--avatar-silver);
  --avatar-cloth: var(--success-600);
}
.avatar--p3 {
  --avatar-bg: var(--sand);
  --avatar-skin: var(--avatar-skin-warm);
  --avatar-hair: var(--avatar-brown);
  --avatar-cloth: var(--ink-700);
}
</style>
