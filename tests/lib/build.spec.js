import { describe, expect, it } from 'vitest'
import { newerBuild } from '@/lib/build'

describe('newerBuild', () => {
  it('spots a new deploy by the hashed script name', () => {
    expect(newerBuild('./assets/index-CI1hk87m.js', 'assets/index-bXl205l4.js')).toBe(true)
    expect(newerBuild('./assets/index-bXl205l4.js', 'assets/index-bXl205l4.js')).toBe(false)
  })
  it('does nothing when either side is unknown', () => {
    expect(newerBuild('', 'assets/index-a.js')).toBe(false)
    expect(newerBuild('./assets/index-a.js', null)).toBe(false)
  })
})
