import { describe, expect, it } from 'vitest'
import {
  issuePriority,
  parseCsv,
  summarizeIssues,
  summarizeSus,
  summarizeTasks,
  susAdjective,
  susScore,
} from '../../docs/a3/evaluation/analysis/metrics.mjs'

describe('parseCsv', () => {
  it('reads quoted fields with commas, escaped quotes and CRLF', () => {
    const rows = parseCsv('id,description\r\nA1,"Toast hides the ""Voice"" button, sometimes"\r\n\r\nA2,plain\n')
    expect(rows).toEqual([
      { id: 'A1', description: 'Toast hides the "Voice" button, sometimes' },
      { id: 'A2', description: 'plain' },
    ])
  })
})

describe('susScore', () => {
  it('scores the extremes and the neutral midpoint', () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100)
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0)
    expect(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50)
  })

  it('rejects incomplete or out-of-range answers', () => {
    expect(() => susScore([5, 1, 5])).toThrow()
    expect(() => susScore([6, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toThrow()
  })

  it('maps scores to Bangor adjectives', () => {
    expect(susAdjective(90)).toBe('Excellent')
    expect(susAdjective(75)).toBe('Good')
    expect(susAdjective(68)).toBe('OK')
    expect(susAdjective(20)).toBe('Awful')
  })
})

describe('summarizeSus', () => {
  it('reports mean, sample SD and range', () => {
    const q = (answers) => Object.fromEntries(answers.map((a, i) => [`q${i + 1}`, String(a)]))
    const s = summarizeSus([
      { participant: 'P1', ...q([4, 2, 4, 2, 4, 2, 4, 2, 4, 2]) }, // 75
      { participant: 'P2', ...q([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]) }, // 100
    ])
    expect(s.scores.map((x) => x.score)).toEqual([75, 100])
    expect(s.mean).toBe(87.5)
    expect(s.sd).toBeCloseTo(17.68, 2)
    expect([s.min, s.max, s.adjective]).toEqual([75, 100, 'Excellent'])
  })
})

describe('summarizeTasks', () => {
  const rows = [
    { participant: 'EXP', task: 'T2', outcome: 'ok', time_s: '40', errors: '0', seq: '' },
    { participant: 'P1', task: 'T2', outcome: 'ok', time_s: '90', errors: '1', seq: '6' },
    { participant: 'P2', task: 'T2', outcome: 'assist', time_s: '150', errors: '3', seq: '4' },
    { participant: 'P1', task: 'T10', outcome: 'fail', time_s: '240', errors: '2', seq: '2' },
    { participant: 'P1', task: 'T1', outcome: 'ok', time_s: '30', errors: '0', seq: '7' },
  ]

  it('keeps the expert baseline out of the stats and orders tasks naturally', () => {
    const [t1, t2, t10] = summarizeTasks(rows)
    expect([t1.task, t2.task, t10.task]).toEqual(['T1', 'T2', 'T10'])
    expect(t2).toMatchObject({ n: 2, ok: 1, assist: 1, fail: 0, completion: 0.5, medianTime: 120, baseline: 40, meanSeq: 5 })
  })

  it('checks completion, SEQ and time against the criteria', () => {
    const [t1, t2, t10] = summarizeTasks(rows)
    expect(t1.meets).toEqual({ completion: true, seq: true, time: null })
    expect(t2.meets).toEqual({ completion: false, seq: false, time: true }) // 120 ≤ 3 × 40
    expect(t10.medianTime).toBeNull() // failed attempts don't count towards time
  })
})

describe('issues', () => {
  it('computes priority as severity × reach × 2 for critical-path problems', () => {
    expect(issuePriority({ severity: '3', reach: '2', critical: 'Y' })).toBe(12)
    expect(issuePriority({ severity: '2', reach: '1', critical: 'N' })).toBe(2)
    expect(issuePriority({ severity: '1', reach: '1', critical: 'N', priority: '9' })).toBe(9)
  })

  it('ranks issues and tallies them by severity and method', () => {
    const s = summarizeIssues([
      { id: 'A', severity: '1', reach: '1', critical: 'N', method: 'HE', status: 'open' },
      { id: 'B', severity: '3', reach: '2', critical: 'Y', method: 'UT', status: 'fixed' },
      { id: 'C', severity: '3', reach: '1', critical: 'N', method: 'HE', status: 'open' },
    ])
    expect(s.ranked.map((r) => r.id)).toEqual(['B', 'C', 'A'])
    expect(s.bySeverity.find((b) => b.severity === 3).count).toBe(2)
    expect(s.byMethod).toEqual([
      ['HE', 2],
      ['UT', 1],
    ])
  })
})
