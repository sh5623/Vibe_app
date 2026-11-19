import { describe, expect, it } from 'vitest'
import type {
  AiItem,
  DaySummary,
  Feed,
  Feeds,
  GhItem,
  WorldItem,
} from '../../../api/morning-signal'
import day1119 from '../../../e2e/fixtures/day-1119.json'
import {
  alertItems,
  calendarCells,
  deriveTops,
  domain,
  feedRows,
  fePicks,
  headlineParts,
  kstTime,
  labelKo,
  mixModel,
  pickInitialDate,
  safeUrl,
  TAB_LABEL,
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

describe('labelKo', () => {
  it('월 일 (요일)', () => expect(labelKo('2026-10-19')).toBe('10월 19일 (월)'))
  it('한 자리 날짜', () => expect(labelKo('2026-11-05')).toBe('11월 5일 (목)'))
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
  it('calendarCells draws every day with a Monday-first lead', () => {
    const cells = calendarCells(2026, 10, new Set(['2026-10-19']), '2026-10-19')
    // 10월 1일 = 목 → 선행 빈칸 3, 31일 전부
    expect(cells).toHaveLength(34)
    expect(cells.slice(0, 3).every((c) => c.date === null && c.day === null)).toBe(true)
    expect(cells[3]).toEqual({ date: '2026-10-01', day: 1, has: false, on: false })
    expect(cells.find((c) => c.date === '2026-10-19')).toEqual({
      date: '2026-10-19',
      day: 19,
      has: true,
      on: true,
    })
    expect(cells.find((c) => c.date === '2026-10-17')).toEqual({
      date: '2026-10-17',
      day: 17,
      has: false,
      on: false,
    })
  })

  it('puts a Sunday start at the end of the first row', () => {
    // 2026-11-01 = 일 → (0+6)%7 = 6 → 선행 빈칸 6
    const cells = calendarCells(2026, 11, new Set(), null)
    expect(cells.slice(0, 6).every((c) => c.date === null)).toBe(true)
    expect(cells[6]).toEqual({ date: '2026-11-01', day: 1, has: false, on: false })
  })
})

// ---------- 오늘의 한 줄 · 피드 — 항목 만들기 ----------

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

// ---------- NEWS 계산 함수 ----------
// fixture: 시안 data.js 의 11월 19일 데이터(AI 3 · World 5 · GitHub 15), `{ day, feeds }` 응답 모양 그대로.
const fx = day1119.feeds as unknown as Feeds
const due = (title: string, dueDate: string, dueTime: string | null = null) => ({
  title,
  dueDate,
  dueTime,
})

describe('TAB_LABEL', () => {
  it('소식 탭 이름', () => expect(TAB_LABEL).toEqual({ ai: 'AI', world: 'World', gh: 'GitHub' }))
})

describe('alertItems', () => {
  it('World 제목의 「오늘」 → 오늘, AI 태그 「예정」 → 예정 순서', () => {
    expect(alertItems(fx).map((a) => a.kind)).toEqual(['today', 'planned'])
  })
  it('칩과 부제', () => {
    const [today, planned] = alertItems(fx)
    expect(today).toMatchObject({ chip: '오늘' })
    expect(today?.title).toContain('수능')
    expect(today?.sub).toBe(fx.world?.items[3]?.summary)
    expect(planned).toMatchObject({ chip: '예정' })
    expect(planned?.title).toContain('Anthropic')
  })
  it('due 는 마감 문구와 TO-DO 부제', () => {
    const a = alertItems({}, [due('보험 갱신', '2026-11-21', '10:00')])
    expect(a).toEqual([{ kind: 'due', title: '보험 갱신', sub: 'TO-DO', chip: '11/21 (토) 10:00' }])
  })
  it('최대 4개', () => {
    const many = [due('a', '2026-11-20'), due('b', '2026-11-21'), due('c', '2026-11-22')]
    const r = alertItems(fx, many)
    expect(r).toHaveLength(4)
    expect(r.map((a) => a.kind)).toEqual(['today', 'planned', 'due', 'due'])
  })
  it('해당 없으면 빈 배열', () => {
    expect(alertItems({})).toEqual([])
  })
})

describe('mixModel', () => {
  it('GitHub 집계 전이면 AI·World만 센다', () => {
    const m = mixModel({ ai: fx.ai, world: fx.world })
    expect(m.parts.map((p) => p.theme)).toEqual(['ai', 'world'])
    expect(m.total).toBe(8)
  })
  it('전체 합계', () => {
    const m = mixModel(fx)
    expect(m.parts).toEqual([
      { theme: 'ai', count: 3 },
      { theme: 'world', count: 5 },
      { theme: 'gh', count: 15 },
    ])
    expect(m.total).toBe(23)
  })
  it('impact 는 AI+GitHub 기준', () => {
    expect(mixModel(fx).impact).toEqual({ high: 3, mid: 8, low: 7 })
  })
  it('빈 입력', () => {
    expect(mixModel({})).toEqual({ total: 0, parts: [], impact: { high: 0, mid: 0, low: 0 } })
  })
})

describe('fePicks', () => {
  it('피드 없으면 빈 배열', () => {
    expect(fePicks(undefined)).toEqual([])
  })
  it('high만, 오늘 별 많은 순', () => {
    expect(fePicks(fx.gh).map((g) => g.repo)).toEqual([
      'dream-num/univer',
      'ag-ui-protocol/ag-ui',
      'sveltejs/svelte',
    ])
  })
  it('starsTodayNum null 은 뒤로', () => {
    const gh = structuredClone(fx.gh) as NonNullable<Feeds['gh']>
    const a = gh.items.find((g) => g.repo === 'dream-num/univer')
    if (a) a.starsTodayNum = null
    expect(fePicks(gh).map((g) => g.repo)).toEqual([
      'ag-ui-protocol/ag-ui',
      'sveltejs/svelte',
      'dream-num/univer',
    ])
  })
})
