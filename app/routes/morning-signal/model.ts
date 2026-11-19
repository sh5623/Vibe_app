import type {
  AiItem,
  DaySummary,
  Feed,
  Feeds,
  GhItem,
  Impact,
  Theme,
  Top,
  WorldItem,
} from '../../../api/morning-signal'
import type { Todo } from '../../../api/morning-signal-todo'
import { dueText } from './todo/todo-model'

// 레퍼런스(second-brain .wiki-automation/dashboard/morning-signal.html)의 순수 함수 이식분.

export const WD_KO: readonly string[] = ['일', '월', '화', '수', '목', '금', '토']

export function dateParts(date: string): { y: number; m: number; d: number; wd: number } {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** `10월 19일 (월)` — 날짜 이동·갱신 스탬프에 쓰는 한국어 표기(2026-11-05 사용자 결정) */
export function labelKo(date: string): string {
  const p = dateParts(date)
  return `${p.m}월 ${p.d}일 (${WD_KO[p.wd] ?? ''})`
}

export function kstTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return ''
  try {
    return t.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function pickInitialDate(days: DaySummary[], hash: string): string | null {
  const last = days[days.length - 1]
  if (!last) return null
  let h = hash
  try {
    h = decodeURIComponent(hash)
  } catch {
    // 깨진 퍼센트 인코딩은 그대로 비교한다(목록에 없으니 최신으로 떨어진다)
  }
  return days.some((d) => d.date === h) ? h : last.date
}

export interface CalCell {
  date: string | null
  day: number | null
  has: boolean
  on: boolean
}

/** 월~일 7열 달력. 선행 빈칸 = (첫날 요일+6)%7. 주말에도 뉴스가 쌓이므로 모든 날을 그린다. */
export function calendarCells(
  year: number,
  month: number,
  have: ReadonlySet<string>,
  cur: string | null
): CalCell[] {
  const cells: CalCell[] = []
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  for (let i = 0; i < lead; i++) cells.push({ date: null, day: null, has: false, on: false })
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  for (let d = 1; d <= last; d++) {
    const date = `${year}-${pad2(month)}-${pad2(d)}`
    cells.push({ date, day: d, has: have.has(date), on: date === cur })
  }
  return cells
}

// ---------- 오늘의 한 줄 ----------

export interface HeadlineParts {
  before: string
  mark: string
  after: string
}

/** 레퍼런스 heroLine(481–487행): 강조 바로 뒤의 공백 아닌 글자(문장부호)는 강조에 붙여 줄바꿈으로 떨어지지 않게 한다. */
export function headlineParts(
  headline: string | null,
  highlight: string | null
): HeadlineParts | null {
  if (!headline) return null
  if (!highlight || !headline.includes(highlight)) return { before: headline, mark: '', after: '' }
  const at = headline.indexOf(highlight)
  let mark = highlight
  let after = headline.slice(at + highlight.length)
  const glued = after.match(/^\S+/)?.[0]
  if (glued) {
    mark += glued
    after = after.slice(glued.length)
  }
  return { before: headline.slice(0, at), mark, after }
}

/** 오늘의 한 줄 아래 「테마별 첫 소식」(레퍼런스 492–496행 · 서버 top_text 와 같은 규칙): AI·시사 첫 기사, GitHub 는 FE 주목(없으면 오늘 별 최다). */
export function deriveTops(feeds: Feeds): Top[] {
  const tops: Top[] = []
  const ai = feeds.ai?.items[0]
  const world = feeds.world?.items[0]
  const ghItems = feeds.gh?.items ?? []
  const gh =
    ghItems.find((g) => g.fePick) ??
    [...ghItems].sort((a, b) => (b.starsTodayNum ?? -1) - (a.starsTodayNum ?? -1))[0]
  if (ai) tops.push({ theme: 'ai', text: ai.title })
  if (world) tops.push({ theme: 'world', text: world.title })
  if (gh) tops.push({ theme: 'gh', text: `${gh.repo} · 오늘 ${gh.starsToday ?? ''}`.trim() })
  return tops
}

// ---------- 피드 ----------

/** 레퍼런스 safeUrl — http(s) 만 링크로 쓴다. */
export function safeUrl(u: unknown): string | null {
  return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null
}

/** 'www.' 를 뗀 호스트, 파싱에 실패하면 원문. */
export function domain(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

export type ChipCls = 'h' | 'm' | 'l' | 'c'

export interface FeedRowView {
  title: string
  tags: string[]
  meta: string
  chip: { cls: ChipCls; text: string } | null
  summary: string | null
  impactNote: string | null
  grade: string | null
  link: { href: string; label: string } | null
}

const IMP: Record<string, { cls: ChipCls; text: string }> = {
  high: { cls: 'h', text: 'FE 높음' },
  mid: { cls: 'm', text: 'FE 중간' },
  low: { cls: 'l', text: 'FE 낮음' },
}

const orNull = (v: string | null | undefined): string | null => v || null

/** 레퍼런스 rowsFor(553–569행)를 구조화한 것. */
export function feedRows(theme: Theme, feed: Feed | undefined): FeedRowView[] {
  if (!feed) return []
  if (theme === 'gh') {
    return (feed.items as GhItem[]).map((x) => {
      const href = safeUrl(x.url)
      return {
        title: x.repo,
        tags: [],
        meta: [x.language, x.stars && `★ ${x.stars}`, x.starsToday].filter(Boolean).join(' · '),
        chip: x.fePick ? { cls: 'h', text: 'FE 주목' } : (IMP[x.impact] ?? null),
        summary: orNull(x.description),
        impactNote: orNull(x.impactNote),
        grade: null,
        link: href ? { href, label: `${x.url.replace(/^https?:\/\//, '')} ↗` } : null,
      }
    })
  }
  const items = feed.items as (AiItem | WorldItem)[]
  return items.map((x) => {
    const href = safeUrl(x.url)
    const ai = theme === 'ai' ? (x as AiItem) : null
    return {
      title: x.title,
      tags: ai && Array.isArray(ai.tags) ? ai.tags : [],
      meta: x.publishedAt ? `게재 ${x.publishedAt}` : '',
      chip: ai
        ? (IMP[ai.impact] ?? null)
        : (x as WorldItem).category
          ? { cls: 'c', text: (x as WorldItem).category }
          : null,
      summary: orNull(x.summary),
      impactNote: ai ? orNull(ai.impactNote) : null,
      grade: orNull(x.grade),
      link: href ? { href, label: `${domain(x.url)} ↗` } : null,
    }
  })
}

/** 탭 건수 — 레퍼런스 renderTabCounts: 행이 없으면 수집 실패, 0건이면 「0건」. */
export function tabCount(feed: Feed | undefined): { text: string; bad: boolean } {
  if (!feed) return { text: '수집 실패', bad: true }
  const n = feed.items.length
  return { text: n ? String(n) : '0건', bad: !n }
}

// ---------- NEWS (B안) ----------

export const TAB_LABEL: Record<Theme, string> = { ai: 'AI', world: 'World', gh: 'GitHub' }

export interface AlertItem {
  kind: 'today' | 'planned' | 'due'
  title: string
  sub: string
  chip: string
}

const ALERT_MAX = 4

/** 알림 카드 — 순서 today(World 제목에 「오늘」) → planned(AI 태그 「예정」) → due(마감 임박 할 일), 최대 4개. */
export function alertItems(
  feeds: Feeds,
  dueSoon: Pick<Todo, 'title' | 'dueDate' | 'dueTime'>[] = []
): AlertItem[] {
  const today: AlertItem[] = (feeds.world?.items ?? [])
    .filter((x) => x.title.includes('오늘'))
    .map((x) => ({ kind: 'today', title: x.title, sub: x.summary, chip: '오늘' }))
  const planned: AlertItem[] = (feeds.ai?.items ?? [])
    .filter((x) => x.tags?.includes('예정'))
    .map((x) => ({ kind: 'planned', title: x.title, sub: x.summary, chip: '예정' }))
  const due: AlertItem[] = dueSoon.map((t) => ({
    kind: 'due',
    title: t.title,
    sub: 'TO-DO',
    chip: dueText(t) ?? '',
  }))
  return [...today, ...planned, ...due].slice(0, ALERT_MAX)
}

/** 오늘의 구성 — parts 는 피드가 있는 테마만(GitHub 집계 전이면 AI·World), impact 는 AI+GitHub 항목 계수. */
export function mixModel(feeds: Feeds): {
  total: number
  parts: { theme: Theme; count: number }[]
  impact: Record<Impact, number>
} {
  const parts: { theme: Theme; count: number }[] = []
  for (const theme of ['ai', 'world', 'gh'] as const) {
    const feed = feeds[theme]
    if (feed) parts.push({ theme, count: feed.items.length })
  }
  const impact: Record<Impact, number> = { high: 0, mid: 0, low: 0 }
  for (const x of [...(feeds.ai?.items ?? []), ...(feeds.gh?.items ?? [])]) impact[x.impact]++
  return { total: parts.reduce((n, p) => n + p.count, 0), parts, impact }
}

/** FE 높음 레포 — 오늘 별 증가 내림차순(null 은 뒤). */
export function fePicks(feed: Feed<'gh'> | undefined): GhItem[] {
  return (feed?.items ?? [])
    .filter((g) => g.impact === 'high')
    .sort((a, b) => (b.starsTodayNum ?? -1) - (a.starsTodayNum ?? -1))
}
