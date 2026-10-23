import { describe, expect, it } from 'vitest'
import type { DaySummary, Feeds } from '../../../api/morning-signal'
import { calendarCells, kstTime, labelEn, pickInitialDate, stampText, WD_KO } from './model'

function day(date: string, updatedAt = ''): DaySummary {
  return {
    date,
    weekday: '월',
    counts: { ai: 0, world: 0, gh: 0 },
    status: { ai: 'ok', world: 'ok', gh: 'ok' },
    fe: { high: 0, picks: [] },
    tops: [],
    headline: null,
    highlight: null,
    updatedAt,
  }
}

describe('WD_KO', () => {
  it('lists Korean weekdays from Sunday', () => {
    expect(WD_KO).toEqual(['일', '월', '화', '수', '목', '금', '토'])
  })
})

describe('labelEn', () => {
  it('labelEn', () => expect(labelEn('2026-10-19')).toBe('Mon, Oct 19'))
})

describe('kstTime', () => {
  it('kstTime', () => {
    expect(kstTime('2026-10-18T23:03:00Z')).toBe('08:03')
    expect(kstTime(undefined)).toBe('')
    expect(kstTime('x')).toBe('')
  })

  it('keeps midnight as 00', () => {
    expect(kstTime('2026-10-18T15:05:00Z')).toBe('00:05')
  })
})

describe('pickInitialDate', () => {
  it('pickInitialDate honours known hash, else latest', () => {
    const days = [day('2026-10-15'), day('2026-10-16'), day('2026-10-19')]
    expect(pickInitialDate(days, '2026-10-16')).toBe('2026-10-16')
    expect(pickInitialDate(days, '2026-10-18')).toBe('2026-10-19')
    expect(pickInitialDate(days, '')).toBe('2026-10-19')
    expect(pickInitialDate([], '2026-10-16')).toBeNull()
  })
})

describe('calendarCells', () => {
  it('calendarCells skips weekends with weekday lead', () => {
    const cells = calendarCells(2026, 10, new Set(['2026-10-19']), '2026-10-19')
    // 10월 1일 = 목 → 선행 빈칸 3, 평일 22일
    expect(cells).toHaveLength(25)
    expect(cells.slice(0, 3).every((c) => c.date === null && c.day === null)).toBe(true)
    expect(cells[3]).toEqual({ date: '2026-10-01', day: 1, has: false, on: false })
    expect(cells.find((c) => c.date === '2026-10-19')).toEqual({
      date: '2026-10-19',
      day: 19,
      has: true,
      on: true,
    })
    expect(cells.find((c) => c.date === '2026-10-17')).toBeUndefined()
  })

  it('drops the lead when the month starts on a weekend', () => {
    // 2026-11-01 = 일 → (0+6)%7 = 6 > 4 → 선행 빈칸 0, 첫 칸은 11월 2일(월)
    const cells = calendarCells(2026, 11, new Set(), null)
    expect(cells[0]).toEqual({ date: '2026-11-02', day: 2, has: false, on: false })
  })
})

describe('stampText', () => {
  it('uses updatedAt, else the latest feed generatedAt', () => {
    const base = { date: '2026-10-19', model: 'm', status: 'empty' as const, items: [] }
    const feeds: Feeds = {
      ai: { ...base, theme: 'ai', generatedAt: '2026-10-18T22:50:00Z' },
      gh: { ...base, theme: 'gh', generatedAt: '2026-10-18T23:01:00Z' },
    }
    expect(stampText(day('2026-10-19', '2026-10-18T23:03:00Z'), feeds)).toBe(
      'Mon, Oct 19 · 08:03 KST 갱신'
    )
    expect(stampText(day('2026-10-19'), feeds)).toBe('Mon, Oct 19 · 08:01 KST 갱신')
    expect(stampText(day('2026-10-19'), {})).toBe('Mon, Oct 19')
  })
})
