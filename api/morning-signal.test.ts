import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler, {
  buildDaySummary,
  type FeedRow,
  feedAggregates,
  type GhItem,
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
  return {
    kind: 'feed',
    date: '2026-10-23',
    theme: 'ai',
    generatedAt: '2026-10-23T07:50:00Z',
    model: 'm',
    items,
  }
}

describe('core', () => {
  it('coerces harmless type drift', () => {
    const r = parseIngest({
      kind: 'feed',
      date: '2026-10-23',
      theme: 'gh',
      generatedAt: '2026-10-23T08:00:00+09:00',
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

  it('rejects impossible calendar dates', () => {
    for (const date of ['2026-02-30', '2026-02-29', '2026-13-01', '2026-04-31', '2026-00-10']) {
      const r = parseIngest({ ...aiFeed([]), date })
      expect(r.ok, date).toBe(false)
      if (r.ok) throw new Error('unexpected')
      expect(r.issues[0]?.path).toBe('date')
    }
    expect(parseIngest({ ...aiFeed([]), date: '2028-02-29' }).ok).toBe(true)
  })

  it('rejects generatedAt that is not an ISO datetime with offset', () => {
    for (const generatedAt of ['x', '2026-10-23', '2026-10-23T08:00:00']) {
      const r = parseIngest({ ...aiFeed([]), generatedAt })
      expect(r.ok, generatedAt).toBe(false)
      if (r.ok) throw new Error('unexpected')
      expect(r.issues[0]?.path).toBe('generatedAt')
    }
    for (const generatedAt of ['2026-10-23T07:50:00Z', '2026-10-23T08:00:00.123+09:00']) {
      expect(parseIngest({ ...aiFeed([]), generatedAt }).ok, generatedAt).toBe(true)
    }
  })

  it('treats null in optional fields as absent', () => {
    const r = parseIngest({ ...aiFeed([{ ...aiItem, tags: null }]), note: null })
    expect(r.ok).toBe(true)
    if (!r.ok || r.value.kind !== 'feed' || r.value.theme !== 'ai') throw new Error('unexpected')
    expect(r.value.note).toBeUndefined()
    expect(r.value.items[0]?.tags).toBeUndefined()
    const s = parseIngest({ kind: 'summary', date: '2026-10-23', headline: 'h', highlight: null })
    expect(s.ok).toBe(true)
    if (!s.ok || s.value.kind !== 'summary') throw new Error('unexpected')
    expect(s.value.highlight).toBeUndefined()
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
    expect(weekdayKo('2026-10-19')).toBe('월')
    expect(weekdayKo('2026-10-24')).toBe('토')
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

type MockRequest = IncomingMessage & { query: Record<string, string | string[]> }

function makeReq(
  method: string,
  opts: {
    body?: unknown
    raw?: string
    query?: Record<string, string | string[]>
    auth?: string | null
  } = {}
): MockRequest {
  const emitter = new EventEmitter() as unknown as MockRequest
  const headers: Record<string, string> = {}
  const auth = opts.auth === undefined ? 'Bearer secret-token' : opts.auth
  if (auth !== null) headers.authorization = auth
  Object.assign(emitter, { method, query: opts.query ?? {}, headers, pause: () => {} })
  queueMicrotask(() => {
    const raw = opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined)
    if (raw !== undefined) emitter.emit('data', Buffer.from(raw))
    emitter.emit('end')
  })
  return emitter
}

function makeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(key: string, value: string) {
      res.headers[key] = value
    },
    end(chunk?: string) {
      res.body = chunk ?? ''
    },
  }
  return res as unknown as ServerResponse & {
    statusCode: number
    headers: Record<string, string>
    body: string
  }
}

const BASE = 'https://example.supabase.co/rest/v1'
const ORIGINAL_ENV = { ...process.env }

function okJson(data: unknown) {
  return { ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) }
}

function failJson(status: number, text: string) {
  return { ok: false, status, json: async () => ({}), text: async () => text }
}

const ghBody = {
  kind: 'feed',
  date: '2026-10-23',
  theme: 'gh',
  generatedAt: '2026-10-23T08:00:00+09:00',
  model: 'm',
  items: [
    gh({ repo: 'a/one', starsToday: '+10', starsTodayNum: 10 }),
    gh({ repo: 'c/two', fePick: true, starsToday: '+5', starsTodayNum: 5 }),
  ],
}

describe('handler', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-23T00:00:00Z'))
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.MS_INGEST_TOKEN = 'secret-token'
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('GET 503 when SUPABASE_URL is empty', async () => {
    process.env.SUPABASE_URL = ''
    const res = makeRes()
    await handler(makeReq('GET'), res)
    expect(res.statusCode).toBe(503)
    expect(JSON.parse(res.body)).toEqual({ error: 'SUPABASE_UNAVAILABLE' })
    expect(res.headers['Content-Type']).toBe('application/json')
  })

  it('POST 503 INGEST_NOT_CONFIGURED when MS_INGEST_TOKEN is empty', async () => {
    process.env.MS_INGEST_TOKEN = ''
    const res = makeRes()
    await handler(makeReq('POST', { body: ghBody }), res)
    expect(res.statusCode).toBe(503)
    expect(JSON.parse(res.body)).toEqual({ error: 'INGEST_NOT_CONFIGURED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST 401 without bearer / with wrong bearer', async () => {
    for (const auth of [null, 'Bearer wrong', 'secret-token']) {
      const res = makeRes()
      await handler(makeReq('POST', { body: ghBody, auth }), res)
      expect(res.statusCode).toBe(401)
      expect(JSON.parse(res.body)).toEqual({ error: 'UNAUTHORIZED' })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST 400 INVALID_JSON on malformed body', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { raw: '{not json' }), res)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: 'INVALID_JSON' })
  })

  it('POST 400 INVALID_PAYLOAD lists issue paths', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { body: aiFeed([{ ...aiItem, impact: 'huge' }]) }), res)
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('INVALID_PAYLOAD')
    expect(body.issues[0].path).toBe('items.0.impact')
  })

  it('POST 400 DATE_NOT_ACCEPTED for yesterday', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { body: { ...ghBody, date: '2026-10-22' } }), res)
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('DATE_NOT_ACCEPTED')
    expect(body.expectedDate).toBe('2026-10-23')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST 200 on saturday when the date is today (weekends are collected too)', async () => {
    vi.setSystemTime(new Date('2026-10-24T00:00:00Z'))
    const res = makeRes()
    await handler(makeReq('POST', { body: { ...ghBody, date: '2026-10-24' } }), res)
    expect(res.statusCode).toBe(200)
  })

  it('POST 400 INVALID_PAYLOAD for an impossible calendar date', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { body: { ...ghBody, date: '2026-02-30' } }), res)
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('INVALID_PAYLOAD')
    expect(body.issues[0].path).toBe('date')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST 400 INVALID_PAYLOAD when generatedAt is not a datetime', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { body: { ...ghBody, generatedAt: 'x' } }), res)
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('INVALID_PAYLOAD')
    expect(body.issues[0].path).toBe('generatedAt')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST accepts null in optional fields (note, tags, highlight)', async () => {
    const feed = makeRes()
    await handler(
      makeReq('POST', { body: { ...aiFeed([{ ...aiItem, tags: null }]), note: null } }),
      feed
    )
    expect(feed.statusCode).toBe(200)
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))
    expect(sent.note).toBeNull()
    expect(sent.items[0]).not.toHaveProperty('tags')

    const summary = makeRes()
    await handler(
      makeReq('POST', {
        body: { kind: 'summary', date: '2026-10-23', headline: 'H', highlight: null },
      }),
      summary
    )
    expect(summary.statusCode).toBe(200)
    const sentSummary = JSON.parse(
      String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body)
    )
    expect(sentSummary.highlight).toBeNull()
  })

  it('POST 413 when body exceeds 262144 bytes', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { raw: 'x'.repeat(262145) }), res)
    expect(res.statusCode).toBe(413)
    expect(JSON.parse(res.body)).toEqual({ error: 'PAYLOAD_TOO_LARGE' })
  })

  it('POST feed upserts with aggregates', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { body: ghBody }), res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      ok: true,
      date: '2026-10-23',
      theme: 'gh',
      itemCount: 2,
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/ms_feeds?on_conflict=date,theme`)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Prefer).toContain('resolution=merge-duplicates')
    const sent = JSON.parse(String(init.body))
    expect(sent).toMatchObject({
      date: '2026-10-23',
      theme: 'gh',
      note: null,
      model: 'm',
      generated_at: '2026-10-23T08:00:00+09:00',
      item_count: 2,
      fe_high: 1,
      fe_picks: ['c/two'],
      top_text: 'c/two · 오늘 +5',
      updated_at: '2026-10-23T00:00:00.000Z',
    })
    expect(sent.items).toHaveLength(2)
  })

  it('derives status from items, ignores client status', async () => {
    const res = makeRes()
    await handler(makeReq('POST', { body: { ...aiFeed([]), status: 'ok' } }), res)
    expect(res.statusCode).toBe(200)
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))
    expect(sent.item_count).toBe(0)
    expect(sent).not.toHaveProperty('status')
  })

  it('POST summary upserts ms_summaries', async () => {
    const res = makeRes()
    await handler(
      makeReq('POST', { body: { kind: 'summary', date: '2026-10-23', headline: 'H' } }),
      res
    )
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, date: '2026-10-23' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/ms_summaries?on_conflict=date`)
    expect(JSON.parse(String(init.body))).toEqual({
      date: '2026-10-23',
      headline: 'H',
      highlight: null,
      updated_at: '2026-10-23T00:00:00.000Z',
    })
  })

  it('GET index returns days built from rows', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/ms_feeds')) {
        return okJson([
          {
            date: '2026-10-22',
            theme: 'ai',
            item_count: 3,
            fe_high: 1,
            fe_picks: [],
            top_text: 't',
            updated_at: '2026-10-22T00:00:00.123+00:00',
          },
          {
            date: '2026-10-21',
            theme: 'world',
            item_count: 2,
            fe_high: 0,
            fe_picks: [],
            top_text: 'w',
            updated_at: '2026-10-21T00:00:00+00:00',
          },
        ])
      }
      return okJson([
        {
          date: '2026-10-21',
          headline: 'H',
          highlight: null,
          updated_at: '2026-10-21T01:00:00+00:00',
        },
      ])
    })
    const res = makeRes()
    await handler(makeReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.headers['Cache-Control']).toBe('no-store')
    const urls = fetchMock.mock.calls.map((c) => c[0])
    expect(urls).toEqual(
      expect.arrayContaining([
        `${BASE}/ms_feeds?select=date,theme,item_count,fe_high,fe_picks,top_text,updated_at&order=date.asc,theme.asc&limit=1000&offset=0`,
        `${BASE}/ms_summaries?select=date,headline,highlight,updated_at&order=date.asc&limit=1000&offset=0`,
      ])
    )
    expect(urls).toHaveLength(2)
    const { days } = JSON.parse(res.body)
    expect(days.map((d: { date: string }) => d.date)).toEqual(['2026-10-21', '2026-10-22'])
    expect(days[1].status.gh).toBe('missing')
    expect(days[1].status.ai).toBe('ok')
    expect(days[1].updatedAt).toBe('2026-10-22T00:00:00.123Z')
    expect(days[0].headline).toBe('H')
    expect(days[0].updatedAt).toBe('2026-10-21T01:00:00.000Z')
  })

  describe('GET index paging past the PostgREST row cap', () => {
    const dayAt = (i: number) =>
      new Date(Date.UTC(2023, 0, 2) + i * 86_400_000).toISOString().slice(0, 10)
    const feedRow = (date: string) => ({
      date,
      theme: 'ai',
      item_count: 1,
      fe_high: 0,
      fe_picks: [],
      top_text: 't',
      updated_at: `${date}T00:00:00+00:00`,
    })
    const fullPage = Array.from({ length: 1000 }, (_, i) => feedRow(dayAt(i)))

    function pagedFetch(feedPages: Record<string, unknown[]>) {
      fetchMock.mockImplementation(async (url: string) => {
        const offset = new URL(url).searchParams.get('offset') ?? 'none'
        if (url.includes('/ms_feeds')) return okJson(feedPages[offset] ?? [])
        if (offset === '0') {
          return okJson([
            {
              date: '2026-10-22',
              headline: 'H',
              highlight: null,
              updated_at: '2026-10-22T01:00:00Z',
            },
          ])
        }
        return okJson([])
      })
    }

    const feedOffsets = () =>
      fetchMock.mock.calls
        .map((c) => String(c[0]))
        .filter((u) => u.includes('/ms_feeds'))
        .map((u) => new URL(u).searchParams.get('offset'))

    it('merges a full page with the next partial page (newest dates kept)', async () => {
      pagedFetch({ '0': fullPage, '1000': [feedRow('2026-10-22')] })
      const res = makeRes()
      await handler(makeReq('GET'), res)
      expect(res.statusCode).toBe(200)
      expect(feedOffsets()).toEqual(['0', '1000'])
      const { days } = JSON.parse(res.body)
      expect(days).toHaveLength(1001)
      const last = days.at(-1)
      expect(last.date).toBe('2026-10-22')
      expect(last.counts.ai).toBe(1)
      expect(last.status.ai).toBe('ok')
      expect(last.headline).toBe('H')
    })

    it('stops after an exact-size page followed by an empty page', async () => {
      pagedFetch({ '0': fullPage })
      const res = makeRes()
      await handler(makeReq('GET'), res)
      expect(res.statusCode).toBe(200)
      expect(feedOffsets()).toEqual(['0', '1000'])
      const { days } = JSON.parse(res.body)
      // 피드 1000일 + 요약만 있는 1일
      expect(days).toHaveLength(1001)
      expect(days.filter((d: { status: { ai: string } }) => d.status.ai === 'ok')).toHaveLength(
        1000
      )
    })
  })

  it('GET ?date=2026-02-30 -> 400 INVALID_DATE without querying Supabase', async () => {
    const res = makeRes()
    await handler(makeReq('GET', { query: { date: '2026-02-30' } }), res)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: 'INVALID_DATE' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('GET ?date=bad -> 400 INVALID_DATE; ?date with no rows -> 404', async () => {
    const bad = makeRes()
    await handler(makeReq('GET', { query: { date: 'bad' } }), bad)
    expect(bad.statusCode).toBe(400)
    expect(JSON.parse(bad.body)).toEqual({ error: 'INVALID_DATE' })

    fetchMock.mockResolvedValue(okJson([]))
    const none = makeRes()
    await handler(makeReq('GET', { query: { date: '2026-10-20' } }), none)
    expect(none.statusCode).toBe(404)
    expect(JSON.parse(none.body)).toEqual({ error: 'NOT_FOUND' })
  })

  it('GET ?date returns day + feeds with derived status', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/ms_feeds')) {
        return okJson([
          {
            date: '2026-10-22',
            theme: 'world',
            items: [],
            note: 'quiet',
            generated_at: '2026-10-22T08:00:00+09:00',
            model: 'm',
            item_count: 0,
            fe_high: 0,
            fe_picks: [],
            top_text: null,
            updated_at: '2026-10-22T00:00:00+00:00',
          },
        ])
      }
      return okJson([])
    })
    const res = makeRes()
    await handler(makeReq('GET', { query: { date: '2026-10-22' } }), res)
    expect(res.statusCode).toBe(200)
    const urls = fetchMock.mock.calls.map((c) => c[0])
    expect(urls).toContain(`${BASE}/ms_feeds?date=eq.2026-10-22&select=*`)
    expect(urls).toContain(`${BASE}/ms_summaries?date=eq.2026-10-22&select=*`)
    const body = JSON.parse(res.body)
    expect(body.day.date).toBe('2026-10-22')
    expect(body.feeds.world).toEqual({
      date: '2026-10-22',
      theme: 'world',
      generatedAt: '2026-10-22T08:00:00+09:00',
      model: 'm',
      status: 'empty',
      note: 'quiet',
      items: [],
    })
    expect(body.feeds.ai).toBeUndefined()
  })

  it('503 SUPABASE_UNAVAILABLE when supabase responds !ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue(failJson(500, ''))
    const get = makeRes()
    await handler(makeReq('GET'), get)
    expect(get.statusCode).toBe(503)
    expect(JSON.parse(get.body)).toEqual({ error: 'SUPABASE_UNAVAILABLE' })
    const post = makeRes()
    await handler(makeReq('POST', { body: ghBody }), post)
    expect(post.statusCode).toBe(503)
    expect(JSON.parse(post.body)).toEqual({ error: 'SUPABASE_UNAVAILABLE' })
  })

  it('logs the PostgREST error body (truncated) server-side only', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const detail = '{"code":"22007","message":"invalid input syntax for type timestamp"}'
    fetchMock.mockResolvedValue(failJson(400, detail))
    const post = makeRes()
    await handler(makeReq('POST', { body: ghBody }), post)
    expect(post.statusCode).toBe(503)
    expect(JSON.parse(post.body)).toEqual({ error: 'SUPABASE_UNAVAILABLE' })
    expect(post.body).not.toContain('22007')
    const logged = () => spy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
    expect(logged()).toContain(detail)

    spy.mockClear()
    fetchMock.mockResolvedValue(failJson(500, 'a'.repeat(600)))
    const get = makeRes()
    await handler(makeReq('GET'), get)
    expect(get.statusCode).toBe(503)
    expect(get.body).not.toContain('aaaa')
    expect(logged()).toContain('a'.repeat(500))
    expect(logged()).not.toContain('a'.repeat(501))
  })

  it('405 for PUT', async () => {
    const res = makeRes()
    await handler(makeReq('PUT'), res)
    expect(res.statusCode).toBe(405)
  })
})
