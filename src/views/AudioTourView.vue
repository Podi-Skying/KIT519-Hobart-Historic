<script setup>
import { watchEffect } from 'vue'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatClock } from '@/lib/format'
import { usePlayerStore } from '@/stores/player'

const props = defineProps({
  id: { type: Number, required: true },
})

const SKIP_SECONDS = 15
const WAVE_BARS = 22

const player = usePlayerStore()
watchEffect(() => player.load(props.id))
</script>

<template>
  <AppPage>
    <PageHeader title="Audio tour" :fallback="{ name: 'site', params: { id } }">
      <BaseButton variant="secondary" size="sm" :aria-label="`Narration language: ${player.language}`" @click="player.cycleLanguage">
        {{ player.language }}
      </BaseButton>
    </PageHeader>

    <div class="artwork">
      <img :src="player.site.image" :alt="player.site.name" class="img-placeholder" />
      <div class="wave" :class="{ 'is-playing': player.playing }" aria-hidden="true">
        <i v-for="n in WAVE_BARS" :key="n" :style="{ animationDelay: `${(n % 7) * 0.11}s` }" />
      </div>
    </div>

    <section class="track">
      <p class="t-caption">Chapter {{ player.narration.chapter }} of {{ player.narration.chapterCount }}</p>
      <h1 class="t-h1 track__title">{{ player.narration.title }}</h1>
      <p class="muted">{{ player.site.name }}</p>

      <input
        class="track__seek"
        type="range"
        min="0"
        :max="player.duration"
        :value="player.position"
        aria-label="Playback position"
        @input="player.seek(Number($event.target.value))"
      />
      <div class="track__times">
        <span>{{ formatClock(player.position) }}</span>
        <span>-{{ formatClock(player.remaining) }}</span>
      </div>

      <div class="controls">
        <button type="button" class="controls__skip" :aria-label="`Back ${SKIP_SECONDS} seconds`" @click="player.skip(-SKIP_SECONDS)">
          <AppIcon name="rewind" :size="26" />{{ SKIP_SECONDS }}
        </button>
        <button type="button" class="controls__play" :aria-label="player.playing ? 'Pause' : 'Play'" @click="player.toggle">
          <AppIcon :name="player.playing ? 'pause' : 'play'" :size="28" />
        </button>
        <button type="button" class="controls__skip" :aria-label="`Forward ${SKIP_SECONDS} seconds`" @click="player.skip(SKIP_SECONDS)">
          <AppIcon name="forward" :size="26" />{{ SKIP_SECONDS }}
        </button>
      </div>

      <BaseButton variant="secondary" block class="track__toggle" :aria-expanded="player.showTranscript" @click="player.toggleTranscript">
        {{ player.showTranscript ? 'Hide transcript' : 'Read transcript' }}
      </BaseButton>

      <ol v-if="player.showTranscript" class="transcript">
        <li
          v-for="(line, i) in player.narration.transcript"
          :key="i"
          :class="{ 'is-current': i === player.currentLine }"
          :aria-current="i === player.currentLine ? 'true' : undefined"
        >
          {{ line }}
        </li>
      </ol>
    </section>
  </AppPage>
</template>

<style scoped>
.artwork {
  position: relative;
  margin: var(--s-2) var(--gutter) 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--r-lg);
}
.artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.artwork::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--photo-veil-bottom), transparent 55%);
}
.wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 16px;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 4px;
  height: 28px;
}
.wave i {
  width: 4px;
  height: 5px;
  border-radius: 2px;
  background: var(--cream);
}
.wave.is-playing i {
  animation: wave 0.9s ease-in-out infinite;
}
.track {
  padding: var(--s-5) var(--gutter) var(--s-6);
}
.track__title {
  margin-top: 4px;
}
.track__seek {
  width: 100%;
  margin: var(--s-4) 0 var(--s-1);
  accent-color: var(--brand-600);
}
.track__times {
  display: flex;
  justify-content: space-between;
  font: 600 12px var(--font-label);
  color: var(--ink-500);
}
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 36px;
  padding-top: var(--s-4);
}
.controls__skip {
  min-width: var(--hit);
  display: flex;
  flex-direction: column;
  align-items: center;
  font: 600 11px var(--font-label);
  color: var(--ink-700);
}
.controls__play {
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--brand-600);
  color: var(--paper);
  box-shadow: 0 10px 24px rgba(125, 48, 69, 0.3);
}
.track__toggle {
  margin-top: var(--s-6);
}
.transcript {
  margin-top: var(--s-4);
  padding: var(--s-4) var(--s-4) var(--s-4) var(--s-8);
  border: 1.5px solid var(--sand);
  border-radius: var(--r-md);
  background: var(--paper);
  font: 400 14px/22px var(--font-body);
}
.transcript li + li {
  margin-top: var(--s-2);
}
.transcript li.is-current {
  color: var(--ink-900);
  font-weight: 600;
}
@keyframes wave {
  0%,
  100% {
    height: 5px;
  }
  50% {
    height: 26px;
  }
}
</style>
