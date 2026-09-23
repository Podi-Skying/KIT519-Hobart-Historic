<script setup>
/**
 * Audio tour: the narration is read aloud by the device's text-to-speech voice
 * in the app language (Web Speech API — free, no API key). Changing language
 * switches both the script and the voice.
 */
import { computed, onBeforeUnmount, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/layout/AppPage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import LanguageButton from '@/components/layout/LanguageButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatClock } from '@/lib/format'
import { localeInfo } from '@/i18n'
import { useContent } from '@/i18n/content'
import { usePlayerStore } from '@/stores/player'

const props = defineProps({
  id: { type: Number, required: true },
})

const SKIP_SECONDS = 15
const WAVE_BARS = 22

const { t, locale } = useI18n()
const { siteById } = useContent()
const player = usePlayerStore()
const site = computed(() => siteById(props.id))
const languageName = computed(() => localeInfo(locale.value).label)

watchEffect(() => player.load(props.id))
// New language → new script and voice: start again from the top.
watch(locale, () => player.reset())
// Don't keep talking after the listener leaves the page.
onBeforeUnmount(() => player.pause())
</script>

<template>
  <AppPage>
    <PageHeader :title="t('audio.title')" :fallback="{ name: 'site', params: { id } }">
      <LanguageButton />
    </PageHeader>

    <div class="artwork">
      <img :src="site.image" :alt="site.name" class="img-placeholder" />
      <div class="wave" :class="{ 'is-playing': player.playing }" aria-hidden="true">
        <i v-for="n in WAVE_BARS" :key="n" :style="{ animationDelay: `${(n % 7) * 0.11}s` }" />
      </div>
    </div>

    <section class="track">
      <p class="t-caption">{{ t('audio.chapter', { n: player.narration.chapter, total: player.narration.chapterCount }) }}</p>
      <h1 class="t-h1 track__title">{{ player.narration.title }}</h1>
      <p class="muted">{{ site.name }} · {{ t('audio.narratedIn', { language: languageName }) }}</p>

      <input
        class="track__seek"
        type="range"
        min="0"
        :max="player.duration"
        step="1"
        :value="player.position"
        :aria-label="t('audio.position')"
        @change="player.seek(Number($event.target.value))"
      />
      <div class="track__times">
        <span>{{ formatClock(player.position) }}</span>
        <span>-{{ formatClock(player.remaining) }}</span>
      </div>

      <div class="controls">
        <button type="button" class="controls__skip" :aria-label="t('audio.back', { n: SKIP_SECONDS })" @click="player.skip(-SKIP_SECONDS)">
          <AppIcon name="rewind" :size="26" />{{ SKIP_SECONDS }}
        </button>
        <button type="button" class="controls__play" :aria-label="player.playing ? t('audio.pause') : t('audio.play')" @click="player.toggle">
          <AppIcon :name="player.playing ? 'pause' : 'play'" :size="28" />
        </button>
        <button type="button" class="controls__skip" :aria-label="t('audio.forward', { n: SKIP_SECONDS })" @click="player.skip(SKIP_SECONDS)">
          <AppIcon name="forward" :size="26" />{{ SKIP_SECONDS }}
        </button>
      </div>

      <p v-if="player.voiceStatus === 'missing'" class="notice" role="status">
        <AppIcon name="info" :size="16" />{{ t('audio.voiceMissing', { language: languageName }) }}
      </p>
      <p v-else-if="player.voiceStatus === 'unsupported'" class="notice" role="status">
        <AppIcon name="info" :size="16" />{{ t('audio.unsupported') }}
      </p>

      <BaseButton variant="secondary" block class="track__toggle" :aria-expanded="player.showTranscript" @click="player.toggleTranscript">
        {{ player.showTranscript ? t('audio.hideTranscript') : t('audio.readTranscript') }}
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
.notice {
  display: flex;
  gap: var(--s-2);
  margin-top: var(--s-4);
  padding: var(--s-3);
  border-radius: var(--r-md);
  background: var(--accent-50);
  color: var(--ink-700);
  font: 400 13px/19px var(--font-body);
}
.notice :deep(svg) {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--accent-700);
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
