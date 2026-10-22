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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isDateString(s: unknown): s is string {
  return typeof s === 'string' && DATE_RE.test(s)
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
const dateStr = z.string().regex(DATE_RE)

const aiItemSchema = z.object({
  title: reqStr,
  summary: str,
  publishedAt: nullableStr,
  impact,
  impactNote: str,
  url: reqStr,
  grade,
  tags: z.array(z.string()).optional(),
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
    generatedAt: reqStr,
    model: reqStr,
    status: z.enum(['ok', 'empty']).optional(), // 받되 반환하지 않는다
    note: z.string().optional(),
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
  highlight: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
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
