<script setup>
/** Illustrated street map (static SVG). Colours come from the --map-* tokens. */
const BLOCKS = [
  [20, 20, 80, 60], [120, 40, 70, 50], [20, 110, 60, 70], [200, 120, 60, 60], [110, 190, 70, 50],
  [230, 210, 60, 40], [20, 220, 70, 50], [140, 300, 60, 60], [260, 470, 90, 40],
]
const MAJOR_ROADS = ['M-10 95 Q180 80 400 110', 'M-10 285 Q200 260 400 300']
const MINOR_ROADS = [
  ['M100 -10 Q120 200 90 530', 10],
  ['M200 -10 Q215 250 250 530', 10],
  ['M-10 190 L400 170', 7],
  ['M-10 390 Q150 380 400 440', 7],
  ['M300 -10 L330 530', 6],
]
const LABELS = [
  { x: 14, y: 88, text: 'Macquarie St' },
  { x: 250, y: 292, text: 'Davey St', rotate: 4 },
  { x: 40, y: 358, text: 'Franklin Sq' },
  { x: 190, y: 446, text: 'Princes Park' },
  { x: 318, y: 60, text: 'Sullivans Cove' },
]
</script>

<template>
  <svg class="backdrop" viewBox="0 0 390 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="390" height="520" fill="var(--map-land)" />
    <path d="M250 0 Q300 120 390 170 L390 0Z" fill="var(--map-water)" />
    <path d="M300 260 Q340 330 390 330 L390 420 Q330 400 290 330Z" fill="var(--map-water)" />
    <rect x="30" y="300" width="90" height="70" rx="10" fill="var(--map-park)" />
    <rect x="170" y="400" width="120" height="80" rx="10" fill="var(--map-park)" />
    <rect v-for="(b, i) in BLOCKS" :key="i" :x="b[0]" :y="b[1]" :width="b[2]" :height="b[3]" rx="6" fill="var(--map-block)" />
    <g fill="none" stroke="var(--map-road)" stroke-linecap="round">
      <path v-for="d in MAJOR_ROADS" :key="d" :d="d" stroke-width="12" />
      <path v-for="[d, w] in MINOR_ROADS" :key="d" :d="d" :stroke-width="w" />
    </g>
    <g class="backdrop__labels">
      <text
        v-for="label in LABELS"
        :key="label.text"
        :x="label.x"
        :y="label.y"
        :transform="label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined"
      >
        {{ label.text }}
      </text>
    </g>
    <slot />
  </svg>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.backdrop__labels {
  font: 600 9px var(--font-label);
  fill: var(--map-label);
}
</style>
