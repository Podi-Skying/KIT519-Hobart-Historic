<script setup>
/**
 * Status-bar strip. On desktop it is a simulated iOS status bar (time, signal, battery) inside the
 * phone mock-up; on a real phone the OS shows its own, so only the strip remains — as tall as the
 * notch area (0 in a browser tab) — to carry the scrolled-page material behind the real status bar.
 */
defineProps({
  tone: { type: String, default: 'dark', validator: (v) => ['dark', 'light'].includes(v) },
  background: { type: String, default: 'transparent' },
})
</script>

<template>
  <div
    class="status-bar no-print"
    :class="[`status-bar--${tone}`, { 'is-material': background !== 'transparent' }]"
    :style="{ background }"
    aria-hidden="true"
  >
    <span class="status-bar__sim">9:41</span>
    <span class="status-bar__icons status-bar__sim">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
        <rect x="0" y="7" width="3" height="4" rx="1" />
        <rect x="4.5" y="5" width="3" height="6" rx="1" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
        <rect x="13.5" y="0" width="3" height="11" rx="1" />
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12">
        <rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" />
        <rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" />
        <rect x="23" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.status-bar {
  position: absolute;
  inset: 0 0 auto;
  z-index: 30;
  height: var(--safe-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 28px 0;
  font: var(--t-input);
  font-weight: 600;
  pointer-events: none;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.status-bar.is-material {
  -webkit-backdrop-filter: var(--material-blur);
  backdrop-filter: var(--material-blur);
}
.status-bar--dark {
  color: var(--ink-900);
}
.status-bar--light {
  color: var(--paper);
}
.status-bar__sim {
  display: none;
}
@media (min-width: 601px) and (hover: hover) and (pointer: fine) {
  .status-bar__sim {
    display: inline;
  }
  .status-bar__icons.status-bar__sim {
    display: flex;
  }
}
.status-bar__icons {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
