import type { DaySummary, Feeds } from '../../../api/morning-signal'

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
