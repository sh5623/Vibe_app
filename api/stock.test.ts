import { describe, expect, it } from 'vitest'
import { monthsAgo } from './stock'

const day = (iso: string, n: number) =>
  monthsAgo(new Date(`${iso}T03:00:00Z`), n)
    .toISOString()
    .slice(0, 10)

describe('monthsAgo', () => {
  it('keeps the same day when the target month has it', () => {
    expect(day('2026-10-15', 1)).toBe('2026-09-15')
    expect(day('2026-10-15', 6)).toBe('2026-04-15')
    expect(day('2026-10-15', 12)).toBe('2025-10-15')
  })

  it('clamps to the last day instead of overflowing into the next month', () => {
    expect(day('2026-03-31', 1)).toBe('2026-02-28')
    expect(day('2028-03-31', 1)).toBe('2028-02-29')
    expect(day('2026-08-31', 6)).toBe('2026-02-28')
    expect(day('2028-02-29', 12)).toBe('2027-02-28')
  })

  it('crosses the year boundary', () => {
    expect(day('2026-01-31', 1)).toBe('2025-12-31')
  })
})
