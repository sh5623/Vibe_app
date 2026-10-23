import { describe, expect, it } from 'vitest'
import type {
  AiItem,
  DaySummary,
  Feed,
  Feeds,
  GhItem,
  WorldItem,
} from '../../../api/morning-signal'
import missing from '../../../e2e/fixtures/missing.json'
import normal from '../../../e2e/fixtures/normal.json'
import single from '../../../e2e/fixtures/single.json'
import {
  barTop,
  calendarCells,
  catModel,
  chipFor,
  countsFor,
  deriveTops,
  domain,
  donutModel,
  feedRows,
  headlineParts,
  kpiModel,
  kstTime,
  labelEn,
  pickInitialDate,
  safeUrl,
  sparkPath,
  stampText,
  tabCount,
  WD_KO,
} from './model'

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

// ---------- Task 4: KPI·벤토 ----------
// 값은 e2e/fixtures/normal.json 의 2026-10-19 기준이다. fixture 는 레퍼런스 원본이라
// 일부 날짜에 tops·headline 이 없다 — 화면 코드는 그 경우도 견딘다(타입보다 넓게 받는다).
const fxDays = (fx: { days: unknown }) => fx.days as DaySummary[]
const fxFeeds = (fx: { feeds: Record<string, unknown> }, date: string) =>
  ({
    ai: fx.feeds[`${date}--ai`],
    world: fx.feeds[`${date}--world`],
    gh: fx.feeds[`${date}--gh`],
  }) as Feeds

function aiItem(impact: AiItem['impact']): AiItem {
  return { title: 't', summary: '', publishedAt: null, impact, impactNote: '', url: '', grade: 'A' }
}
function worldItem(category: WorldItem['category']): WorldItem {
  return { title: 't', summary: '', publishedAt: null, category, url: '', grade: 'A' }
}
function ghItem(repo: string, starsTodayNum: number | null, extra: Partial<GhItem> = {}): GhItem {
  return {
    rank: 1,
    repo,
    url: '',
    description: '',
    language: null,
    stars: null,
    starsToday: null,
    starsTodayNum,
    impact: 'low',
    impactNote: '',
    fePick: false,
    grade: 'A',
    ...extra,
  }
}
function feedOf<T extends 'ai' | 'world' | 'gh'>(theme: T, items: Feed<T>['items']): Feed<T> {
  return { date: '2026-10-19', theme, generatedAt: '', model: 'm', status: 'ok', items }
}

describe('countsFor', () => {
  it('uses feed items when feeds are given, else day.counts', () => {
    const d = { ...day('2026-10-19'), counts: { ai: 6, world: 5, gh: 13 } }
    expect(countsFor(d, null)).toEqual({ ai: 6, world: 5, gh: 13, total: 24 })
    expect(countsFor(d, { ai: feedOf('ai', [aiItem('high')]) })).toEqual({
      ai: 1,
      world: 0,
      gh: 0,
      total: 1,
    })
  })
})

describe('kpiModel', () => {
  it('kpiModel deltas vs previous date', () => {
    const k = kpiModel(fxDays(normal), '2026-10-19', fxFeeds(normal, '2026-10-19'))
    expect(k.total.value).toBe(24)
    expect(k.total.delta).toBe(-1)
    expect(k.ai.delta).toBe(-1)
    expect(k.world.delta).toBe(-1)
    expect(k.gh.delta).toBe(1)
    expect(k.total.prevDate).toBe('2026-10-16')
    expect(k.total.series).toHaveLength(10)
    expect(k.total.series.at(-1)).toBe(24)
    expect(k.total.min).toBe(Math.min(...k.total.series))
    expect(k.total.max).toBe(Math.max(...k.total.series))
  })

  it('kpiModel first day has null delta', () => {
    const k = kpiModel(fxDays(single), '2026-10-19', fxFeeds(single, '2026-10-19'))
    for (const key of ['total', 'ai', 'world', 'gh'] as const) {
      expect(k[key].delta).toBeNull()
      expect(k[key].prevDate).toBeNull()
      expect(k[key].series).toHaveLength(1)
    }
    expect(k.total.value).toBe(24)
  })

  it('counts a missing feed as 0 on the current date only', () => {
    const k = kpiModel(fxDays(missing), '2026-10-19', fxFeeds(missing, '2026-10-19'))
    expect(k.gh.value).toBe(0)
    expect(k.gh.delta).toBe(-12)
    expect(k.world.value).toBe(0)
  })
})

describe('chipFor', () => {
  it('chipFor', () => {
    expect(chipFor(undefined)).toEqual({ show: true, zero: false, text: '수집 실패' })
    expect(chipFor(feedOf('world', []))).toEqual({ show: true, zero: true, text: '0건' })
    expect(chipFor(feedOf('ai', [aiItem('low')])).show).toBe(false)
  })
})

describe('headlineParts', () => {
  it('headlineParts glues trailing punctuation', () => {
    expect(headlineParts('막는 기업이 늘고, 루머가 돌아요', '기업이 늘고')).toEqual({
      before: '막는 ',
      mark: '기업이 늘고,',
      after: ' 루머가 돌아요',
    })
  })

  it('headlineParts ignores highlight not in headline', () => {
    expect(headlineParts('A B', 'Z')).toEqual({ before: 'A B', mark: '', after: '' })
    expect(headlineParts('A B', null)).toEqual({ before: 'A B', mark: '', after: '' })
  })

  it('headlineParts null headline → null', () => {
    expect(headlineParts(null, null)).toBeNull()
    expect(headlineParts('', 'x')).toBeNull()
  })
})

describe('deriveTops', () => {
  it('takes the first ai/world title and the FE pick (else most stars today)', () => {
    const tops = deriveTops({
      ai: feedOf('ai', [{ ...aiItem('high'), title: 'A1' }]),
      world: feedOf('world', [{ ...worldItem('경제'), title: 'W1' }]),
      gh: feedOf('gh', [
        ghItem('a/top', 900, { starsToday: '+900' }),
        ghItem('b/pick', 10, { starsToday: '+10', fePick: true }),
      ]),
    })
    expect(tops).toEqual([
      { theme: 'ai', text: 'A1' },
      { theme: 'world', text: 'W1' },
      { theme: 'gh', text: 'b/pick · 오늘 +10' },
    ])
    expect(deriveTops({ gh: feedOf('gh', [ghItem('a/x', null), ghItem('b/y', 5)]) })).toEqual([
      { theme: 'gh', text: 'b/y · 오늘' },
    ])
    expect(deriveTops({})).toEqual([])
  })
})

describe('donutModel', () => {
  it('donutModel counts and gaps', () => {
    const m = donutModel([aiItem('high'), aiItem('high'), aiItem('mid')])
    expect(m).toMatchObject({ high: 2, mid: 1, low: 0, total: 3 })
    const C = 2 * Math.PI * 46
    expect(m.segments).toHaveLength(3)
    expect(m.segments[0]?.len).toBeCloseTo((C * 2) / 3 - 3)
    expect(m.segments[0]?.offset).toBe(0)
    expect(m.segments[1]?.len).toBeCloseTo(C / 3 - 3)
    expect(m.segments[1]?.offset).toBeCloseTo((-C * 2) / 3)
    expect(m.segments[2]?.len).toBe(0)
  })

  it('empty list draws nothing', () => {
    const m = donutModel([])
    expect(m.total).toBe(0)
    expect(m.segments.map((s) => s.len)).toEqual([0, 0, 0])
  })
})

describe('catModel', () => {
  it('catModel percentages', () => {
    expect(catModel([worldItem('시사·국제'), worldItem('시사·국제'), worldItem('경제')])).toEqual({
      counts: [2, 1, 0],
      pct: [67, 33, 0],
    })
    expect(catModel([])).toEqual({ counts: [0, 0, 0], pct: [null, null, null] })
  })
})

describe('barTop', () => {
  it('barTop sorts nulls last', () => {
    const top = barTop([ghItem('n/null', null), ghItem('n/50', 50), ghItem('n/100', 100)])
    expect(top.map((t) => t.repo)).toEqual(['n/100', 'n/50', 'n/null'])
    expect(top.map((t) => t.scale)).toEqual([1, 0.5, 0.05])
    expect(top.at(-1)?.value).toBe('—')
    expect(top[0]?.value).toBe('+100')
  })

  it('keeps the top 5 and prefers the starsToday label', () => {
    const items = [1, 2, 3, 4, 5, 6].map((n) => ghItem(`r/${n}`, n * 1000))
    const top = barTop([...items, ghItem('r/label', 9000, { starsToday: '+9,000 오늘' })])
    expect(top).toHaveLength(5)
    expect(top[0]).toEqual({ repo: 'r/label', value: '+9,000 오늘', scale: 1 })
    expect(top[1]?.value).toBe('+6,000')
  })
})

describe('sparkPath', () => {
  it('sparkPath single value is flat', () => {
    const p = sparkPath([5])
    expect(p.line).toBe('M0.0 18.0 L220.0 18.0')
    expect(p.area).toBe('M0.0 18.0 L220.0 18.0 L 220 36 L 0 36 Z')
    expect(p.len).toBe(220)
    expect(p.end).toEqual([220, 18])
  })

  it('scales between min and max with a 4px inset', () => {
    const p = sparkPath([0, 10, 5])
    expect(p.line).toBe('M0.0 32.0 L110.0 4.0 L220.0 18.0')
    expect(p.end).toEqual([220, 18])
  })
})

// ---------- 피드 ----------

describe('safeUrl / domain', () => {
  it('passes only http(s)', () => {
    expect(safeUrl('https://a.com/x')).toBe('https://a.com/x')
    expect(safeUrl('HTTP://a.com')).toBe('HTTP://a.com')
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('')).toBeNull()
    expect(safeUrl(null)).toBeNull()
    expect(safeUrl(5)).toBeNull()
  })
  it('strips www and falls back to raw on parse failure', () => {
    expect(domain('https://www.fourweekmba.com/a')).toBe('fourweekmba.com')
    expect(domain('not a url')).toBe('not a url')
  })
})

const ai1 = (o: Partial<AiItem> = {}): AiItem => ({
  ...aiItem('high'),
  title: 'T',
  summary: 'S',
  publishedAt: '2026-10-18',
  impactNote: 'N',
  url: 'https://www.fourweekmba.com/x',
  tags: ['루머'],
  ...o,
})

describe('feedRows', () => {
  it('ai maps chip, tags, meta, link', () => {
    const [r] = feedRows('ai', feedOf('ai', [ai1()]))
    expect(r?.chip).toEqual({ cls: 'h', text: 'FE 높음' })
    expect(r?.tags).toEqual(['루머'])
    expect(r?.meta).toBe('게재 2026-10-18')
    expect(r?.link).toEqual({ href: 'https://www.fourweekmba.com/x', label: 'fourweekmba.com ↗' })
    expect(r?.impactNote).toBe('N')
    expect(r?.grade).toBe('A')
  })
  it('drops non-http urls', () => {
    const rows = feedRows(
      'ai',
      feedOf('ai', [ai1({ url: 'javascript:alert(1)' }), ai1({ url: '' })])
    )
    expect(rows.map((r) => r.link)).toEqual([null, null])
  })
  it('world uses category chip and no impact note', () => {
    const w: WorldItem = {
      title: 'W',
      summary: 'S',
      publishedAt: null,
      category: '경제',
      url: 'https://a.com',
      grade: 'B',
    }
    const [r] = feedRows('world', feedOf('world', [w]))
    expect(r?.chip).toEqual({ cls: 'c', text: '경제' })
    expect(r?.meta).toBe('')
    expect(r?.impactNote).toBeNull()
  })
  it('gh meta and fePick chip', () => {
    const g = ghItem('a/b', 2213, {
      url: 'https://github.com/a/b',
      description: 'D',
      language: 'TypeScript',
      stars: '52,971',
      starsToday: '+2,213',
      fePick: true,
      grade: null as unknown as GhItem['grade'],
    })
    const [r] = feedRows('gh', feedOf('gh', [g]))
    expect(r?.title).toBe('a/b')
    expect(r?.meta).toBe('TypeScript · ★ 52,971 · +2,213')
    expect(r?.chip).toEqual({ cls: 'h', text: 'FE 주목' })
    expect(r?.link?.label).toBe('github.com/a/b ↗')
    expect(r?.summary).toBe('D')
    expect(r?.grade).toBeNull()
    const [r2] = feedRows('gh', feedOf('gh', [{ ...g, fePick: false }]))
    expect(r2?.chip).toEqual({ cls: 'l', text: 'FE 낮음' })
  })
  it('missing feed gives no rows', () => {
    expect(feedRows('ai', undefined)).toEqual([])
  })
})

describe('tabCount', () => {
  it('maps missing, empty and filled', () => {
    expect(tabCount(undefined)).toEqual({ text: '수집 실패', bad: true })
    expect(tabCount(feedOf('ai', []))).toEqual({ text: '0건', bad: true })
    expect(tabCount(feedOf('ai', [ai1(), ai1(), ai1(), ai1(), ai1()]))).toEqual({
      text: '5',
      bad: false,
    })
  })
})
