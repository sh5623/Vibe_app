import { createHash, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { z } from 'zod'

export const THEMES = ['ai', 'world', 'gh'] as const
export type Theme = (typeof THEMES)[number]
export type Impact = 'high' | 'mid' | 'low'
export type Grade = 'A' | 'B'
export type WorldCategory = '시사·국제' | '경제' | '상식·교양'
export type ThemeStatus = 'ok' | 'empty' | 'missing'

export interface AiItem {
  title: string
  summary: string
  publishedAt: string | null
  impact: Impact
  impactNote: string
  url: string
  grade: Grade
  tags?: string[]
}
export interface WorldItem {
  title: string
  summary: string
  publishedAt: string | null
  category: WorldCategory
  url: string
  grade: Grade
}
export interface GhItem {
  rank: number
  repo: string
  url: string
  description: string
  language: string | null
  stars: string | null
  starsToday: string | null
  starsTodayNum: number | null
  impact: Impact
  impactNote: string
  fePick: boolean
  grade: Grade
}
export interface ItemsByTheme {
  ai: AiItem[]
  world: WorldItem[]
  gh: GhItem[]
}
export interface Feed<T extends Theme = Theme> {
  date: string
  theme: T
  generatedAt: string
  model: string
  status: 'ok' | 'empty'
  note?: string
  items: ItemsByTheme[T]
}
export interface Feeds {
  ai?: Feed<'ai'>
  world?: Feed<'world'>
  gh?: Feed<'gh'>
}
export interface Top {
  theme: Theme
  text: string
}
export interface DaySummary {
  date: string
  weekday: string
  counts: Record<Theme, number>
  status: Record<Theme, ThemeStatus>
  fe: { high: number; picks: string[] }
  tops: Top[]
  headline: string | null
  highlight: string | null
  updatedAt: string
}
export interface FeedRow {
  date: string
  theme: Theme
  item_count: number
  fe_high: number
  fe_picks: string[]
  top_text: string | null
  updated_at: string
}
export interface SummaryRow {
  date: string
  headline: string
  highlight: string | null
  updated_at: string
}
export type FeedPayload = {
  [T in Theme]: {
    kind: 'feed'
    date: string
    theme: T
    generatedAt: string
    model: string
    note?: string
    items: ItemsByTheme[T]
  }
}[Theme]
export interface SummaryPayload {
  kind: 'summary'
  date: string
  headline: string
  highlight?: string
}
export type IngestPayload = FeedPayload | SummaryPayload
export interface Issue {
  path: string
  message: string
}

// ---------- 스키마 ----------

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** YYYY-MM-DD 형식이면서 실제 달력 날짜인가(2026-02-30·2026-13-01은 거부). */
export function isDateString(s: unknown): s is string {
  if (typeof s !== 'string') return false
  const m = DATE_RE.exec(s)
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
}

/** 숫자 자리: '+2,213' → 2213. 변환 불가 값은 그대로 두어 검증에서 실패시킨다. */
function toNumberLike(v: unknown): unknown {
  if (typeof v !== 'string') return v
  const cleaned = v.replace(/[+,\s]/g, '')
  if (cleaned === '') return v
  const n = Number(cleaned)
  return Number.isNaN(n) ? v : n
}

/** 문자열 자리: 숫자는 String으로. */
function toStringLike(v: unknown): unknown {
  return typeof v === 'number' ? String(v) : v
}

/** 선택(nullable 아님) 자리: null → undefined. LLM이 키를 빼는 대신 null을 보내도 받는다. */
function nullToUndefined(v: unknown): unknown {
  return v === null ? undefined : v
}

/** null 허용 문자열 자리: ''·undefined → null, 숫자 → String. */
function toNullableString(v: unknown): unknown {
  if (v === '' || v === undefined) return null
  return toStringLike(v)
}

const reqStr = z.preprocess(toStringLike, z.string().min(1))
const str = z.preprocess(toStringLike, z.string())
const nullableStr = z.preprocess(toNullableString, z.string().nullable())
const intLike = z.preprocess(toNumberLike, z.number().int())
const nullableInt = z.preprocess(
  (v) => (v === '' || v === undefined ? null : toNumberLike(v)),
  z.number().int().nullable()
)
const impact = z.enum(['high', 'mid', 'low'])
const grade = z.enum(['A', 'B'])
const dateStr = z.string().refine(isDateString, 'must be a real YYYY-MM-DD date')
const isoStamp = z.iso.datetime({ offset: true })

const aiItemSchema = z.object({
  title: reqStr,
  summary: str,
  publishedAt: nullableStr,
  impact,
  impactNote: str,
  url: reqStr,
  grade,
  tags: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
})
const worldItemSchema = z.object({
  title: reqStr,
  summary: str,
  publishedAt: nullableStr,
  category: z.enum(['시사·국제', '경제', '상식·교양']),
  url: reqStr,
  grade,
})
const ghItemSchema = z.object({
  rank: intLike,
  repo: reqStr,
  url: reqStr,
  description: str,
  language: nullableStr,
  stars: nullableStr,
  starsToday: nullableStr,
  starsTodayNum: nullableInt,
  impact,
  impactNote: str,
  fePick: z.boolean(),
  grade,
})

function feedSchema<T extends z.ZodType>(theme: Theme, item: T) {
  return z.object({
    kind: z.literal('feed'),
    date: dateStr,
    theme: z.literal(theme),
    generatedAt: isoStamp, // timestamptz 열에 들어간다 — 시각이 아니면 Postgres 대신 여기서 400
    model: reqStr,
    status: z.enum(['ok', 'empty']).optional(), // 받되 반환하지 않는다
    note: z.preprocess(nullToUndefined, z.string().optional()),
    items: z.array(item),
  })
}

const feedSchemas = {
  ai: feedSchema('ai', aiItemSchema),
  world: feedSchema('world', worldItemSchema),
  gh: feedSchema('gh', ghItemSchema),
}

const summarySchema = z.object({
  kind: z.literal('summary'),
  date: dateStr,
  headline: z.string().min(1),
  highlight: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().optional()),
})

function toIssues(error: z.ZodError): Issue[] {
  return error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }))
}

export function parseIngest(
  body: unknown
): { ok: true; value: IngestPayload } | { ok: false; issues: Issue[] } {
  const obj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null
  if (!obj) return { ok: false, issues: [{ path: '', message: 'body must be an object' }] }

  if (obj.kind === 'summary') {
    const r = summarySchema.safeParse(obj)
    if (!r.success) return { ok: false, issues: toIssues(r.error) }
    const { kind, date, headline, highlight } = r.data
    const value: SummaryPayload = { kind, date, headline }
    if (highlight !== undefined) value.highlight = highlight
    return { ok: true, value }
  }

  if (obj.kind === 'feed') {
    const theme = obj.theme
    if (theme !== 'ai' && theme !== 'world' && theme !== 'gh') {
      return { ok: false, issues: [{ path: 'theme', message: 'must be ai, world or gh' }] }
    }
    const r = feedSchemas[theme].safeParse(obj)
    if (!r.success) return { ok: false, issues: toIssues(r.error) }
    const { status: _status, ...rest } = r.data
    // 스키마가 theme별 items 형태를 보장한다.
    return { ok: true, value: rest as FeedPayload }
  }

  return { ok: false, issues: [{ path: 'kind', message: 'must be feed or summary' }] }
}

// ---------- 날짜 ----------

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function kstToday(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

function dayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

export function isWeekday(date: string): boolean {
  const d = dayIndex(date)
  return d >= 1 && d <= 5
}

export function weekdayKo(date: string): string {
  return WEEKDAYS[dayIndex(date)] ?? ''
}

// ---------- 집계 ----------

function ghTop(items: GhItem[]): GhItem | null {
  const picked = items.find((i) => i.fePick)
  if (picked) return picked
  let best: GhItem | null = null
  for (const i of items) {
    if (best === null || (i.starsTodayNum ?? -1) > (best.starsTodayNum ?? -1)) best = i
  }
  return best
}

export function feedAggregates<T extends Theme>(
  theme: T,
  items: ItemsByTheme[T]
): { itemCount: number; feHigh: number; fePicks: string[]; topText: string | null } {
  if (theme === 'gh') {
    const list = items as GhItem[]
    const fePicks = list.filter((i) => i.fePick).map((i) => i.repo)
    const top = ghTop(list)
    const topText = top
      ? top.starsToday
        ? `${top.repo} · 오늘 ${top.starsToday}`
        : top.repo
      : null
    return { itemCount: list.length, feHigh: fePicks.length, fePicks, topText }
  }
  const list = items as AiItem[] | WorldItem[]
  const feHigh = theme === 'ai' ? (list as AiItem[]).filter((i) => i.impact === 'high').length : 0
  return { itemCount: list.length, feHigh, fePicks: [], topText: list[0]?.title ?? null }
}

export function buildDaySummary(
  date: string,
  feeds: FeedRow[],
  summary: SummaryRow | null
): DaySummary {
  const byTheme = new Map(feeds.map((r) => [r.theme, r]))
  const counts: Record<Theme, number> = { ai: 0, world: 0, gh: 0 }
  const status: Record<Theme, ThemeStatus> = { ai: 'missing', world: 'missing', gh: 'missing' }
  const tops: Top[] = []
  for (const theme of THEMES) {
    const row = byTheme.get(theme)
    if (!row) continue
    counts[theme] = row.item_count
    status[theme] = row.item_count === 0 ? 'empty' : 'ok'
    if (row.top_text) tops.push({ theme, text: row.top_text })
  }
  const stamps = [...feeds.map((r) => r.updated_at), ...(summary ? [summary.updated_at] : [])]
  return {
    date,
    weekday: weekdayKo(date),
    counts,
    status,
    fe: {
      high: feeds.reduce((sum, r) => sum + r.fe_high, 0),
      picks: byTheme.get('gh')?.fe_picks ?? [],
    },
    tops,
    headline: summary?.headline ?? null,
    highlight: summary?.highlight ?? null,
    updatedAt: stamps.reduce((a, b) => (b > a ? b : a), ''),
  }
}

// ---------- 핸들러 ----------

const MAX_BODY_BYTES = 262144

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>
}

class PayloadTooLargeError extends Error {}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let bytesRead = 0
    let failed = false
    req.on('data', (chunk: Buffer) => {
      if (failed) return
      bytesRead += chunk.length
      if (bytesRead > MAX_BODY_BYTES) {
        failed = true
        req.pause()
        reject(new PayloadTooLargeError('Request body too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.end(JSON.stringify(body))
}

function supabaseHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const val = req.query[key]
  return Array.isArray(val) ? val[0] : val
}

function sha256(v: string): Buffer {
  return createHash('sha256').update(v).digest()
}

function isAuthorized(req: IncomingMessage, token: string): boolean {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false
  return timingSafeEqual(sha256(header.slice('Bearer '.length)), sha256(token))
}

/** PostgREST 오류 본문(앞 500자). 서버 로그에만 쓰고 HTTP 응답에는 넣지 않는다. */
async function errorDetail(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return ''
  }
}

async function sbGet<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { headers: supabaseHeaders() })
  if (!res.ok) throw new Error(`Supabase GET failed: ${res.status} ${await errorDetail(res)}`)
  return (await res.json()) as T[]
}

/** PostgREST 기본 max_rows(Supabase 1000)와 같은 크기. 이보다 적게 오면 마지막 페이지다. */
const PAGE_SIZE = 1000

/**
 * 목록 질의는 max_rows에서 조용히 잘린다(오름차순이면 최신 날짜가 빠진다).
 * limit·offset으로 끝까지 읽는다. url은 전순서가 되는 order를 담아야 페이지가 겹치지 않는다.
 */
async function sbGetAll<T>(url: string): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await sbGet<T>(`${url}&limit=${PAGE_SIZE}&offset=${offset}`)
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

async function sbUpsert(url: string, row: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status} ${await errorDetail(res)}`)
}

/** Supabase는 `+00:00`, 서버는 `Z`로 쓴다. 비교·응답을 일관되게 ISO Z로 맞춘다. */
function normalizeStamp(v: string): string {
  const t = new Date(v)
  return Number.isNaN(t.getTime()) ? v : t.toISOString()
}

interface FeedFullRow extends FeedRow {
  items: unknown[]
  note: string | null
  generated_at: string
  model: string
}

function groupByDate<T extends { date: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const r of rows) map.set(r.date, [...(map.get(r.date) ?? []), r])
  return map
}

async function handleGet(req: VercelRequest, res: ServerResponse, base: string) {
  res.setHeader('Cache-Control', 'no-store')
  const date = getQueryParam(req, 'date')

  if (date === undefined) {
    const [feedRows, summaryRows] = await Promise.all([
      sbGetAll<FeedRow>(
        `${base}/rest/v1/ms_feeds?select=date,theme,item_count,fe_high,fe_picks,top_text,updated_at&order=date.asc,theme.asc`
      ),
      sbGetAll<SummaryRow>(
        `${base}/rest/v1/ms_summaries?select=date,headline,highlight,updated_at&order=date.asc`
      ),
    ])
    const feedsByDate = groupByDate(
      feedRows.map((r) => ({ ...r, updated_at: normalizeStamp(r.updated_at) }))
    )
    const summaryByDate = new Map(
      summaryRows.map((r) => [r.date, { ...r, updated_at: normalizeStamp(r.updated_at) }])
    )
    const dates = [...new Set([...feedsByDate.keys(), ...summaryByDate.keys()])].sort()
    const days = dates.map((d) =>
      buildDaySummary(d, feedsByDate.get(d) ?? [], summaryByDate.get(d) ?? null)
    )
    return json(res, 200, { days })
  }

  if (!isDateString(date)) return json(res, 400, { error: 'INVALID_DATE' })
  const [feedRows, summaryRows] = await Promise.all([
    sbGet<FeedFullRow>(`${base}/rest/v1/ms_feeds?date=eq.${date}&select=*`),
    sbGet<SummaryRow>(`${base}/rest/v1/ms_summaries?date=eq.${date}&select=*`),
  ])
  if (feedRows.length === 0 && summaryRows.length === 0) {
    return json(res, 404, { error: 'NOT_FOUND' })
  }
  const normFeeds = feedRows.map((r) => ({ ...r, updated_at: normalizeStamp(r.updated_at) }))
  const summary = summaryRows[0]
  const day = buildDaySummary(
    date,
    normFeeds,
    summary ? { ...summary, updated_at: normalizeStamp(summary.updated_at) } : null
  )
  const feeds: Record<string, unknown> = {}
  for (const r of normFeeds) {
    feeds[r.theme] = {
      date: r.date,
      theme: r.theme,
      generatedAt: r.generated_at,
      model: r.model,
      status: r.items.length ? 'ok' : 'empty',
      note: r.note ?? undefined,
      items: r.items,
    }
  }
  return json(res, 200, { day, feeds })
}

async function handlePost(req: VercelRequest, res: ServerResponse, base: string) {
  let rawBody: string
  try {
    rawBody = await readBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return json(res, 413, { error: 'PAYLOAD_TOO_LARGE' })
    return json(res, 400, { error: 'INVALID_JSON' })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json(res, 400, { error: 'INVALID_JSON' })
  }

  const parsed = parseIngest(body)
  if (!parsed.ok) return json(res, 400, { error: 'INVALID_PAYLOAD', issues: parsed.issues })
  const payload = parsed.value

  const expectedDate = kstToday(new Date())
  if (payload.date !== expectedDate || !isWeekday(payload.date)) {
    return json(res, 400, { error: 'DATE_NOT_ACCEPTED', expectedDate })
  }

  const now = new Date().toISOString()
  if (payload.kind === 'summary') {
    await sbUpsert(`${base}/rest/v1/ms_summaries?on_conflict=date`, {
      date: payload.date,
      headline: payload.headline,
      highlight: payload.highlight ?? null,
      updated_at: now,
    })
    return json(res, 200, { ok: true, date: payload.date })
  }

  const agg = feedAggregates(payload.theme, payload.items)
  await sbUpsert(`${base}/rest/v1/ms_feeds?on_conflict=date,theme`, {
    date: payload.date,
    theme: payload.theme,
    items: payload.items,
    note: payload.note ?? null,
    generated_at: payload.generatedAt,
    model: payload.model,
    item_count: agg.itemCount,
    fe_high: agg.feHigh,
    fe_picks: agg.fePicks,
    top_text: agg.topText,
    updated_at: now,
  })
  return json(res, 200, {
    ok: true,
    date: payload.date,
    theme: payload.theme,
    itemCount: agg.itemCount,
  })
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  const base = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !serviceKey) return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })

  try {
    if (req.method === 'GET') return await handleGet(req, res, base)
    if (req.method === 'POST') {
      const token = process.env.MS_INGEST_TOKEN
      if (!token) return json(res, 503, { error: 'INGEST_NOT_CONFIGURED' })
      if (!isAuthorized(req, token)) return json(res, 401, { error: 'UNAUTHORIZED' })
      return await handlePost(req, res, base)
    }
  } catch (error) {
    console.error('[api/morning-signal] failed', error)
    return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })
  }
  return json(res, 405, { error: 'Method Not Allowed' })
}
