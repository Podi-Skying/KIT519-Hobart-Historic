import { describe, expect, it } from 'vitest'
import { expandStreetNames, guidancePrompt, midSentence, speechDistance, tidyInstruction } from '@/lib/voicePrompt'

// Minimal t(): the English message templates, filled in.
const EN = {
  'voice.start': "Let's go — {instruction}.",
  'voice.inDistance': 'In about {distance}, {instruction}.',
  'voice.now': 'Now, {instruction}.',
  'voice.metres': '{n} metres',
  'voice.km': '{n} kilometres',
  'voice.arrive': "You've arrived at {name}. Enjoy your visit!",
  'voice.almostThere': 'Almost there — {name} is about {distance} ahead.',
  'voice.headTo': 'Head towards {name}.',
}
const t = (key, params = {}) => EN[key].replace(/\{(\w+)\}/g, (_, k) => params[k])
const ctx = (phase) => ({ t, locale: 'en', siteName: 'Salamanca Place', phase })

describe('speechDistance', () => {
  it('rounds like a person would', () => {
    expect(speechDistance(63)).toEqual({ unit: 'm', n: 60 })
    expect(speechDistance(237)).toEqual({ unit: 'm', n: 250 })
    expect(speechDistance(812)).toEqual({ unit: 'm', n: 800 })
    expect(speechDistance(1260)).toEqual({ unit: 'km', n: 1.3 })
  })
  it('is "now" when the turn is right here', () => {
    expect(speechDistance(12)).toBeNull()
  })
})

describe('expandStreetNames', () => {
  it('says full street words', () => {
    expect(expandStreetNames('Turn left onto Elizabeth St')).toBe('Turn left onto Elizabeth Street')
    expect(expandStreetNames('Continue on Sandy Bay Rd toward Davey St')).toBe('Continue on Sandy Bay Road toward Davey Street')
  })
  it('keeps St as Saint before a name', () => {
    expect(expandStreetNames('Turn right onto St Georges Tce')).toBe('Turn right onto St Georges Terrace')
  })
})

describe('guidancePrompt', () => {
  const turn = { kind: 'turn', instruction: 'Turn left onto Elizabeth St', meters: 63 }
  it('announces the next turn with a rounded distance', () => {
    expect(guidancePrompt(turn, ctx('ahead'))).toBe('In about 60 metres, turn left onto Elizabeth Street.')
  })
  it('says "now" at the turn', () => {
    expect(guidancePrompt({ ...turn, meters: 12 }, ctx('ahead'))).toBe('Now, turn left onto Elizabeth Street.')
  })
  it('starts and arrives in a friendly way', () => {
    expect(guidancePrompt({ kind: 'start', instruction: 'Head north on Davey St', meters: 200 }, ctx('start'))).toBe(
      "Let's go — head north on Davey Street.",
    )
    expect(guidancePrompt(turn, ctx('arrive'))).toBe("You've arrived at Salamanca Place. Enjoy your visit!")
  })
  it('joins Google’s second line into one sentence', () => {
    expect(tidyInstruction('Turn right\nDestination will be on the left')).toBe('Turn right. Destination will be on the left')
    expect(midSentence('Turn right', 'ja')).toBe('Turn right')
  })
})
