/**
 * Spoken turn-by-turn prompts (pure — unit-tested in tests/lib/voicePrompt.spec.js).
 * Written the way a person gives directions: rounded distances ("in about 60 metres"),
 * full street words ("Elizabeth Street", not "Elizabeth St"), one clear instruction at a time.
 */

/** Below this many metres the turn is "now". */
export const NOW_METERS = 30

/**
 * A distance the way people say it: 10 m steps up to 100, 50 m to 500, 100 m to 1 km, then km.
 * @returns {{ unit: 'm' | 'km', n: number } | null} null = it's right here ("now")
 */
export function speechDistance(meters) {
  if (!Number.isFinite(meters) || meters < NOW_METERS) return null
  if (meters < 100) return { unit: 'm', n: Math.round(meters / 10) * 10 }
  if (meters < 500) return { unit: 'm', n: Math.round(meters / 50) * 50 }
  if (meters < 950) return { unit: 'm', n: Math.round(meters / 100) * 100 }
  return { unit: 'km', n: Math.round(meters / 100) / 10 }
}

const STREET_WORDS = {
  St: 'Street',
  Rd: 'Road',
  Ave: 'Avenue',
  Av: 'Avenue',
  Pde: 'Parade',
  Hwy: 'Highway',
  Dr: 'Drive',
  Pl: 'Place',
  Cres: 'Crescent',
  Tce: 'Terrace',
  Ln: 'Lane',
  Sq: 'Square',
  Esp: 'Esplanade',
  Ct: 'Court',
  Cl: 'Close',
}

/**
 * English only: expand street-type abbreviations Google uses in instructions.
 * "St" before a capitalised name is *Saint* ("St Georges Terrace"), so it is left alone;
 * after a name ("Elizabeth St") it becomes "Street".
 */
export function expandStreetNames(text) {
  let out = text.replace(/\b(Rd|Ave|Av|Pde|Hwy|Dr|Pl|Cres|Tce|Ln|Sq|Esp|Ct|Cl)\b\.?(?!\w)/g, (m, abbr) => STREET_WORDS[abbr])
  out = out.replace(/\bSt\b\.?(?!\s+[A-Z])/g, 'Street')
  return out
}

/** Google instructions can carry a second line ("Destination will be on the right"): speak it as a sentence. */
export function tidyInstruction(text = '') {
  return text
    .split(/\n+/)
    .map((line) => line.trim().replace(/[.。]$/, ''))
    .filter(Boolean)
    .join('. ')
}

/** Lower-case the first letter so it reads mid-sentence ("In about 60 metres, turn left…") — Latin scripts only. */
export function midSentence(text, locale) {
  if (!text || !/^(en|vi)/.test(locale)) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/**
 * The words to speak for a guidance state.
 * @param {{ kind: string, instruction: string, meters: number }} guidance from lib/guidance nextGuidance
 * @param {{ t: Function, locale: string, siteName: string, phase: 'start'|'ahead'|'now'|'arrive' }} ctx
 */
export function guidancePrompt(guidance, { t, locale, siteName, phase }) {
  const en = locale.startsWith('en')
  const raw = tidyInstruction(guidance.instruction)
  const instruction = en ? expandStreetNames(raw) : raw
  if (phase === 'arrive') return t('voice.arrive', { name: siteName })
  if (guidance.kind === 'none') return t('voice.headTo', { name: siteName })
  if (phase === 'start') return t('voice.start', { instruction: midSentence(instruction, locale) })
  const d = speechDistance(guidance.meters)
  if (phase === 'now' || !d) return t('voice.now', { instruction: midSentence(instruction, locale) })
  const distance = d.unit === 'km' ? t('voice.km', { n: d.n }) : t('voice.metres', { n: d.n })
  if (guidance.kind === 'arrive') return t('voice.almostThere', { distance, name: siteName })
  return t('voice.inDistance', { distance, instruction: midSentence(instruction, locale) })
}
