<script setup>
/**
 * The evaluation personas' portraits (desktop "Scenario Task" panel), from the team's persona
 * images: P1 Minzi, P2 Margaret, P3 Sam — square head-and-shoulders crops, 192px WebP, shown
 * round. Decorative: the name is always next to it, so alt is empty.
 */
import minzi from '@/assets/images/personas/minzi.webp'
import margaret from '@/assets/images/personas/margaret.webp'
import sam from '@/assets/images/personas/sam.webp'

const PHOTOS = { P1: minzi, P2: margaret, P3: sam }
defineProps({
  persona: { type: String, required: true }, // 'P1' | 'P2' | 'P3'
  size: { type: Number, default: 40 },
})
</script>

<template>
  <img class="avatar" :src="PHOTOS[persona]" alt="" :width="size" :height="size" decoding="async" />
</template>

<style scoped>
.avatar {
  display: block;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  background: var(--stage-card);
  box-shadow: 0 0 0 1px var(--stage-line); /* a hairline edge so light photos don't melt into the panel */
}
</style>
