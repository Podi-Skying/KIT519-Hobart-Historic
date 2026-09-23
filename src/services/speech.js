/**
 * Text-to-speech via the browser's built-in Web Speech API (speechSynthesis).
 * Free, no API key, works offline with the device's installed voices
 * (iOS/macOS, Android, Windows and Chrome all ship voices for EN/繁中/日本語/한국어/Tiếng Việt).
 */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

export const isSpeechSupported = () => Boolean(synth && typeof window.SpeechSynthesisUtterance === 'function')

let voicesReady = null

/** Voices load asynchronously in some browsers (Chrome) — wait for them once. */
export function loadVoices() {
  if (!isSpeechSupported()) return Promise.resolve([])
  if (voicesReady) return voicesReady
  voicesReady = new Promise((resolve) => {
    const existing = synth.getVoices()
    if (existing.length) return resolve(existing)
    const done = () => resolve(synth.getVoices())
    synth.addEventListener?.('voiceschanged', done, { once: true })
    setTimeout(done, 1500) // some browsers never fire the event
  })
  return voicesReady
}

/**
 * Best installed voice for a list of BCP-47 tags (most specific first).
 * Prefers enhanced/natural/premium voices, then local (offline) ones.
 * @param {SpeechSynthesisVoice[]} voices
 * @param {string[]} tags e.g. ['zh-TW', 'zh-HK', 'zh']
 */
export function pickVoice(voices, tags) {
  const norm = (s) => s.toLowerCase().replace('_', '-')
  const quality = (v) => (/(enhanced|premium|natural|neural|google)/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0)
  for (const tag of tags.map(norm)) {
    const matches = voices.filter((v) => norm(v.lang) === tag || norm(v.lang).startsWith(`${tag}-`))
    if (matches.length) return matches.sort((a, b) => quality(b) - quality(a))[0]
  }
  return null
}

/**
 * Speak one piece of text. Resolves when finished (or rejects on error).
 * Calling stopSpeaking() resolves any pending promise as `cancelled`.
 * @returns {Promise<'ended'|'cancelled'>}
 */
export function speak(text, { lang, voice, rate = 0.95 } = {}) {
  return new Promise((resolve, reject) => {
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = voice?.lang ?? lang
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.onend = () => resolve('ended')
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') resolve('cancelled')
      else reject(new Error(event.error || 'speech error'))
    }
    synth.speak(utterance)
  })
}

export function stopSpeaking() {
  if (isSpeechSupported()) synth.cancel()
}
