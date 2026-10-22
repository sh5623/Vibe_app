import { describe, expect, it } from 'vitest'
import {
  buildDaySummary,
  type FeedRow,
  feedAggregates,
  type GhItem,
  isWeekday,
  kstToday,
  parseIngest,
  weekdayKo,
} from './morning-signal'

function gh(over: Partial<GhItem>): GhItem {
  return {
    rank: 1,
    repo: 'a/b',
    url: 'https://github.com/a/b',
    description: 'd',
    language: null,
    stars: null,
    starsToday: null,
    starsTodayNum: null,
    impact: 'low',
    impactNote: 'n',
    fePick: false,
    grade: 'A',
    ...over,
  }
}

const aiItem = {
  title: 't',
  summary: 's',
  publishedAt: null,
  impact: 'mid',
  impactNote: 'n',
  url: 'https://example.com',
  grade: 'A',
}

function aiFeed(items: unknown[]) {
  return { kind: 'feed', date: '2026-10-23', theme: 'ai', generatedAt: 'x', model: 'm', items }
}

describe('core', () => {
  it('coerces harmless type drift', () => {
    const r = parseIngest({
      kind: 'feed',
      date: '2026-10-23',
      theme: 'gh',
      generatedAt: 'x',
      model: 'm',
      status: 'ok',
      items: [
        {
          rank: '3',
          repo: 'a/b',
          url: 'https://github.com/a/b',
          description: 'd',
          language: '',
          stars: 52971,
          starsToday: '+2,213',
          starsTodayNum: '+2,213',
          impact: 'low',
          impactNote: 'n',
          fePick: false,
          grade: 'A',
          foo: 1,
        },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok || r.value.kind !== 'feed' || r.value.theme !== 'gh') throw new Error('unexpected')
    const item = r.value.items[0]
    expect(item?.rank).toBe(3)
    expect(item?.language).toBeNull()
    expect(item?.stars).toBe('52971')
    expect(item?.starsTodayNum).toBe(2213)
    expect(item).not.toHaveProperty('foo')
    expect(r.value).not.toHaveProperty('status')
  })

  it('rejects bad enum with path', () => {
    const r = parseIngest(aiFeed([{ ...aiItem, impact: '높음' }]))
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('unexpected')
    expect(r.issues[0]?.path).toBe('items.0.impact')
  })

  it('rejects missing required title', () => {
    const { title: _title, ...rest } = aiItem
    const r = parseIngest(aiFeed([rest]))
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('unexpected')
    expect(r.issues[0]?.path).toBe('items.0.title')
  })

  it('rejects malformed date', () => {
    const r = parseIngest({ ...aiFeed([]), date: '2026-10-2' })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('unexpected')
    expect(r.issues[0]?.path).toBe('date')
  })

  it('parses summary and drops empty highlight', () => {
    const r = parseIngest({ kind: 'summary', date: '2026-10-23', headline: 'h', highlight: '' })
    expect(r.ok).toBe(true)
    if (!r.ok || r.value.kind !== 'summary') throw new Error('unexpected')
    expect(r.value.highlight).toBeUndefined()
    const bad = parseIngest({ kind: 'summary', date: '2026-10-23', headline: '' })
    expect(bad.ok).toBe(false)
    if (bad.ok) throw new Error('unexpected')
    expect(bad.issues[0]?.path).toBe('headline')
  })

  it('kstToday rolls over at 15:00Z', () => {
    expect(kstToday(new Date('2026-10-22T14:59:59Z'))).toBe('2026-10-22')
    expect(kstToday(new Date('2026-10-22T15:00:00Z'))).toBe('2026-10-23')
  })

  it('weekday helpers', () => {
    expect(isWeekday('2026-10-23')).toBe(true)
    expect(isWeekday('2026-10-24')).toBe(false)
    expect(isWeekday('2026-10-25')).toBe(false)
    expect(weekdayKo('2026-10-19')).toBe('월')
  })

  it('feedAggregates ai', () => {
    const mk = (title: string, impact: 'high' | 'mid' | 'low') => ({
      title,
      summary: 's',
      publishedAt: null,
      impact,
      impactNote: 'n',
      url: 'u',
      grade: 'A' as const,
    })
    const items = [mk('first', 'high'), mk('b', 'high'), mk('c', 'mid'), mk('d', 'low')]
    expect(feedAggregates('ai', items)).toEqual({
      itemCount: 4,
      feHigh: 2,
      fePicks: [],
      topText: 'first',
    })
  })

  it('feedAggregates gh prefers first fePick', () => {
    const items = [
      gh({ repo: 'p/q', starsToday: '+9,999', starsTodayNum: 9999 }),
      gh({ repo: 'x/y', fePick: true, starsToday: '+1,187', starsTodayNum: 1187 }),
    ]
    expect(feedAggregates('gh', items)).toEqual({
      itemCount: 2,
      feHigh: 1,
      fePicks: ['x/y'],
      topText: 'x/y · 오늘 +1,187',
    })
  })

  it('feedAggregates gh falls back to max starsTodayNum, null starsToday → repo only', () => {
    const items = [
      gh({ repo: 'a/a', starsToday: '+10', starsTodayNum: 10 }),
      gh({ repo: 'b/b', starsToday: '+500', starsTodayNum: 500 }),
      gh({ repo: 'c/c' }),
    ]
    expect(feedAggregates('gh', items).topText).toBe('b/b · 오늘 +500')
    expect(feedAggregates('gh', [gh({ repo: 'c/c' })]).topText).toBe('c/c')
  })

  it('feedAggregates empty → zeros and null top', () => {
    expect(feedAggregates('world', [])).toEqual({
      itemCount: 0,
      feHigh: 0,
      fePicks: [],
      topText: null,
    })
  })

  it('buildDaySummary', () => {
    const rows: FeedRow[] = [
      {
        date: '2026-10-19',
        theme: 'ai',
        item_count: 6,
        fe_high: 2,
        fe_picks: [],
        top_text: 'A',
        updated_at: '2026-10-19T08:00:00Z',
      },
      {
        date: '2026-10-19',
        theme: 'world',
        item_count: 0,
        fe_high: 0,
        fe_picks: [],
        top_text: null,
        updated_at: '2026-10-19T08:30:00Z',
      },
    ]
    const s = buildDaySummary('2026-10-19', rows, {
      date: '2026-10-19',
      headline: 'h',
      highlight: 'k',
      updated_at: '2026-10-19T08:45:00Z',
    })
    expect(s.status).toEqual({ ai: 'ok', world: 'empty', gh: 'missing' })
    expect(s.counts).toEqual({ ai: 6, world: 0, gh: 0 })
    expect(s.fe).toEqual({ high: 2, picks: [] })
    expect(s.tops).toEqual([{ theme: 'ai', text: 'A' }])
    expect(s.headline).toBe('h')
    expect(s.highlight).toBe('k')
    expect(s.weekday).toBe('월')
    expect(s.updatedAt).toBe('2026-10-19T08:45:00Z')
  })

  it('buildDaySummary without summary → headline/highlight null', () => {
    const s = buildDaySummary(
      '2026-10-19',
      [
        {
          date: '2026-10-19',
          theme: 'gh',
          item_count: 1,
          fe_high: 1,
          fe_picks: ['x/y'],
          top_text: 'x/y',
          updated_at: '2026-10-19T09:00:00Z',
        },
      ],
      null
    )
    expect(s.headline).toBeNull()
    expect(s.highlight).toBeNull()
    expect(s.fe).toEqual({ high: 1, picks: ['x/y'] })
    expect(s.updatedAt).toBe('2026-10-19T09:00:00Z')
  })
})
