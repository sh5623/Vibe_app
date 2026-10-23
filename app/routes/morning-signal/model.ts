import type {
  AiItem,
  DaySummary,
  Feed,
  Feeds,
  GhItem,
  Theme,
  Top,
  WorldItem,
} from '../../../api/morning-signal'

// 레퍼런스(second-brain .wiki-automation/dashboard/morning-signal.html)의 순수 함수 이식분.

export const WD_KO: readonly string[] = ['일', '월', '화', '수', '목', '금', '토']
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function dateParts(date: string): { y: number; m: number; d: number; wd: number } {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function labelEn(date: string): string {
  const p = dateParts(date)
  return `${WD_EN[p.wd] ?? ''}, ${MON[p.m - 1] ?? ''} ${p.d}`
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

/** `${labelEn(date)} · HH:MM KST 갱신` — 시각은 day.updatedAt, 없으면 가장 늦은 feed.generatedAt. */
export function stampText(day: DaySummary, feeds: Feeds): string {
  const gen = [feeds.ai?.generatedAt, feeds.world?.generatedAt, feeds.gh?.generatedAt]
    .filter((g): g is string => !!g)
    .sort()
    .pop()
  const time = kstTime(day.updatedAt || gen)
  return `${labelEn(day.date)}${time ? ` · ${time} KST 갱신` : ''}`
}

export interface CalCell {
  date: string | null
  day: number | null
  has: boolean
  on: boolean
}

/** 레퍼런스 buildCal: 월~금만 그리고, 선행 빈칸 = (첫날 요일+6)%7 (주말 시작이면 0). */
export function calendarCells(
  year: number,
  month: number,
  have: ReadonlySet<string>,
  cur: string | null
): CalCell[] {
  const cells: CalCell[] = []
  let lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  if (lead > 4) lead = 0
  for (let i = 0; i < lead; i++) cells.push({ date: null, day: null, has: false, on: false })
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  for (let d = 1; d <= last; d++) {
    const wd = new Date(Date.UTC(year, month - 1, d)).getUTCDay()
    if (wd === 0 || wd === 6) continue
    const date = `${year}-${pad2(month)}-${pad2(d)}`
    cells.push({ date, day: d, has: have.has(date), on: date === cur })
  }
  return cells
}

// ---------- KPI ----------

export type KpiKey = 'total' | Theme

/** 레퍼런스 COLOR — KPI 점·스파크라인·대표 3줄 이름표 색 */
export const COLOR: Record<KpiKey, string> = {
  total: 'var(--primary)',
  ai: 'var(--s-ai)',
  world: 'var(--s-world)',
  gh: 'var(--s-gh)',
}

/** '2026-10-19' → '10.19' */
export const mdDot = (date: string): string => date.slice(5).replace('-', '.')

export interface Counts {
  ai: number
  world: number
  gh: number
  total: number
}

function tally(n: (t: Theme) => number): Counts {
  const ai = n('ai')
  const world = n('world')
  const gh = n('gh')
  return { ai, world, gh, total: ai + world + gh }
}

const feedCounts = (feeds: Feeds) => tally((t) => feeds[t]?.items.length ?? 0)

/** feeds 가 있으면(=화면에 띄운 날짜) items 길이, 없으면 목록의 day.counts — 레퍼런스 countsFor. */
export function countsFor(day: DaySummary, feeds: Feeds | null): Counts {
  return feeds ? feedCounts(feeds) : tally((t) => Number(day.counts?.[t] ?? 0))
}

export interface Kpi {
  value: number
  delta: number | null
  prevDate: string | null
  series: number[]
  min: number
  max: number
}

/** 레퍼런스 renderKpis — 창 = cur 포함 최근 10개, 비교 = 목록에서 바로 앞 날짜(그날 counts). */
export function kpiModel(days: DaySummary[], cur: string, feeds: Feeds): Record<KpiKey, Kpi> {
  const idx = days.findIndex((d) => d.date === cur)
  const win = idx >= 0 ? days.slice(Math.max(0, idx - 9), idx + 1) : []
  const series = win.map((d) => countsFor(d, d.date === cur ? feeds : null))
  // 목록에서 사라진 날짜를 아직 띄우고 있으면 그날 feeds 만으로 그린다
  if (series.length === 0) series.push(feedCounts(feeds))
  const prevDay = idx > 0 ? days[idx - 1] : undefined
  const prev = prevDay ? countsFor(prevDay, null) : null
  const kpi = (k: KpiKey): Kpi => {
    const vals = series.map((c) => c[k])
    const value = vals.at(-1) ?? 0
    return {
      value,
      delta: prev ? value - prev[k] : null,
      prevDate: prevDay?.date ?? null,
      series: vals,
      min: Math.min(...vals),
      max: Math.max(...vals),
    }
  }
  return { total: kpi('total'), ai: kpi('ai'), world: kpi('world'), gh: kpi('gh') }
}

/** 레퍼런스 sparkSvg 의 좌표 계산(427–437행). len 은 대시 길이로 쓰므로 올림한다. */
export function sparkPath(
  vals: number[],
  w = 220,
  h = 36
): { line: string; area: string; len: number; end: [number, number] } {
  let pts: [number, number][]
  if (vals.length <= 1) {
    pts = [
      [0, h / 2],
      [w, h / 2],
    ]
  } else {
    const max = Math.max(...vals)
    const min = Math.min(...vals)
    const sx = w / (vals.length - 1)
    pts = vals.map((v, i) => [i * sx, h - 4 - ((v - min) / Math.max(1, max - min)) * (h - 8)])
  }
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    if (a && b) len += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  const end = pts.at(-1) ?? [w, h / 2]
  return { line, area: `${line} L ${w} ${h} L 0 ${h} Z`, len: Math.ceil(len), end }
}

/** KPI 칩 — 행이 없으면 「수집 실패」, 0건이면 「0건」, 있으면 숨긴다(서버 status 와 같은 규칙). */
export function chipFor(feed: Feed | undefined): {
  show: boolean
  zero: boolean
  text: '' | '0건' | '수집 실패'
} {
  if (!feed) return { show: true, zero: false, text: '수집 실패' }
  if (feed.items.length === 0) return { show: true, zero: true, text: '0건' }
  return { show: false, zero: false, text: '' }
}

// ---------- 벤토 ----------

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

/** day.tops 가 비었을 때만 쓴다(레퍼런스 492–496행): AI·시사 첫 기사, GitHub 는 FE 주목(없으면 오늘 별 최다). */
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

/** 도넛 둘레(r=46) */
export const DONUT_C = 2 * Math.PI * 46

/** 레퍼런스 renderDonut — 세그먼트 순서 높음·중간·낮음, 비어 있지 않은 세그먼트는 3 만큼 띄운다. offset 은 stroke-dashoffset 값. */
export function donutModel(items: AiItem[]): {
  high: number
  mid: number
  low: number
  total: number
  segments: { len: number; offset: number }[]
} {
  const n = { high: 0, mid: 0, low: 0 }
  for (const x of items) if (n[x.impact] !== undefined) n[x.impact]++
  const total = items.length
  let acc = 0
  const segments = [n.high, n.mid, n.low].map((v) => {
    const len = total ? Math.max(0, (DONUT_C * v) / total - (v ? 3 : 0)) : 0
    const seg = { len, offset: -acc || 0 }
    acc += total ? (DONUT_C * v) / total : 0
    return seg
  })
  return { ...n, total, segments }
}

export const WORLD_CATS = ['시사·국제', '경제', '상식·교양'] as const

/** 레퍼런스 renderCatbar — pct 는 분류된 건수 합 기준 반올림, 합이 0 이면 null. */
export function catModel(items: WorldItem[]): {
  counts: [number, number, number]
  pct: (number | null)[]
} {
  const counts: [number, number, number] = [0, 0, 0]
  for (const x of items) {
    const i = WORLD_CATS.indexOf(x.category)
    if (i === 0 || i === 1 || i === 2) counts[i]++
  }
  const total = counts[0] + counts[1] + counts[2]
  return { counts, pct: counts.map((v) => (total ? Math.round((v / total) * 100) : null)) }
}

/** 레퍼런스 renderBarlist — 오늘 별 증가 상위 5개(null 은 뒤로). scale 은 1등 대비 막대 길이(최소 0.05). */
export function barTop(items: GhItem[]): { repo: string; value: string; scale: number }[] {
  const top = items
    .filter((g) => g?.repo)
    .sort((a, b) => (b.starsTodayNum ?? -1) - (a.starsTodayNum ?? -1))
    .slice(0, 5)
  const max = Math.max(1, top[0]?.starsTodayNum ?? 1)
  return top.map((g) => ({
    repo: g.repo,
    value:
      g.starsToday ||
      (g.starsTodayNum != null ? `+${g.starsTodayNum.toLocaleString('ko-KR')}` : '—'),
    scale: Math.max(0.05, (g.starsTodayNum ?? 0) / max),
  }))
}
