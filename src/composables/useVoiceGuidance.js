import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { localeInfo } from '@/i18n'
import { isSpeechSupported, loadVoices, pickVoice, speak, stopSpeaking } from '@/services/speech'
import { guidancePrompt, NOW_METERS } from '@/lib/voicePrompt'

/**
 * Spoken turn-by-turn directions on the navigation screens (standard map, AR).
 * Speaks once when the walk starts, once per new turn ("In about 60 metres, turn left onto
 * Elizabeth Street."), again just before it ("Now, turn left…"), and on arrival. Nothing
 * repeats while you stand still. Uses the device's own voice in the app language.
 *
 * @param {{
 *   guidance: import('vue').Ref<{kind:string, instruction:string, meters:number, stepIndex:number}>,
 *   siteName: () => string,
 *   enabled: () => boolean,
 *   arrived: import('vue').Ref<boolean>,
 * }} options
 */
export function useVoiceGuidance({ guidance, siteName, enabled, arrived }) {
  const { t, locale } = useI18n()
  let voice = null
  let started = false
  let lastKey = null
  let saidNow = false

  async function refreshVoice() {
    if (!isSpeechSupported()) return
    voice = pickVoice(await loadVoices(), localeInfo(locale.value).speech)
  }

  function say(phase) {
    if (!enabled() || !isSpeechSupported()) return
    const text = guidancePrompt(guidance.value, { t, locale: locale.value, siteName: siteName(), phase })
    stopSpeaking() // newest instruction wins; never talk over yourself
    speak(text, { voice, lang: localeInfo(locale.value).speech[0], rate: 1 }).catch(() => {})
  }

  function announce() {
    const g = guidance.value
    if (g.kind === 'none') return // route still being planned
    const key = `${g.kind}:${g.stepIndex}:${g.instruction}`
    if (key === lastKey) return
    lastKey = key
    saidNow = false
    say(started ? 'ahead' : 'start')
    started = true
  }

  watch(() => [guidance.value.kind, guidance.value.stepIndex, guidance.value.instruction], announce)
  // Close to the turn: one short "Now, …"
  watch(
    () => guidance.value.meters,
    (m) => {
      if (saidNow || guidance.value.kind !== 'turn' || !(m < NOW_METERS)) return
      saidNow = true
      say('now')
    },
  )
  watch(arrived, (now) => now && say('arrive'))
  // Switching voice on speaks the current instruction straight away (feedback that it works).
  watch(enabled, (on) => {
    if (!on) return stopSpeaking()
    lastKey = null
    announce()
  })
  watch(locale, async () => {
    await refreshVoice()
    lastKey = null
    announce()
  })

  onMounted(async () => {
    await refreshVoice()
    announce()
  })
  onBeforeUnmount(() => stopSpeaking())
}
