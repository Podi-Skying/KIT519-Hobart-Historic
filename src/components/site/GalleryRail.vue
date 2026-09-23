<script setup>
/** Horizontal photo rail ("Through the years"); each card opens the gallery. */
defineProps({
  site: { type: Object, required: true },
})
</script>

<template>
  <div class="rail">
    <RouterLink
      v-for="(photo, i) in site.gallery"
      :key="photo.image"
      :to="{ name: 'gallery', params: { id: site.id, index: i } }"
      class="rail__card"
    >
      <img :src="photo.image" :alt="photo.caption" class="img-placeholder" loading="lazy" decoding="async" />
      <span class="rail__year">{{ photo.year }}</span>
      <span class="rail__caption">{{ photo.caption }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  gap: var(--s-3);
  padding: 0 var(--gutter) var(--s-2);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--gutter);
  scrollbar-width: none;
}
.rail::-webkit-scrollbar {
  display: none;
}
.rail__card {
  flex: 0 0 150px;
  scroll-snap-align: start;
}
.rail__card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: var(--r-md);
  border: 1.5px solid var(--sand);
}
.rail__year {
  display: block;
  margin-top: var(--s-2);
  font: var(--t-caption);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-700);
}
.rail__caption {
  display: block;
  margin-top: 2px;
  font: 600 13px/18px var(--font-label);
  color: var(--ink-900);
}
</style>
