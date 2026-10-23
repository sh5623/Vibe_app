import type { Todo, TodoStatus } from '../../../../api/morning-signal-todo'

// TO-DO 화면 계산(순수 함수). 날짜는 전부 KST `YYYY-MM-DD` 문자열로 다룬다.

export const STATUS_LABEL: Record<TodoStatus, 'TODO' | 'IN PROGRESS' | 'DONE'> = {
  todo: 'TODO',
  in_progress: 'IN PROGRESS',
  done: 'DONE',
}

/** 「남은 일」에서 처음 보이는 줄 수 */
export const PENDING_LIMIT = 3
/** 마감까지 이 일수 이하(지난 것 포함)면 날짜를 빨갛게 */
const DUE_SOON_DAYS = 3

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function kstToday(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** `YYYY-MM-DD` 를 UTC 자정으로 — 로컬 시간대와 무관하게 날짜 차이·요일을 계산한다 */
function utcDate(date: string): Date {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function daysBetween(a: string, b: string): number {
  return Math.round((utcDate(a).getTime() - utcDate(b).getTime()) / 86_400_000)
}

/** 마감이 가까운 것 → 먼저 추가한 것. 마감이 없으면 뒤로. */
function byDueThenCreated(a: Todo, b: Todo): number {
  const due = (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
  return due || a.createdAt.localeCompare(b.createdAt)
}

export function splitPending(todos: Todo[]): { progress: Todo[]; todo: Todo[] } {
  return {
    progress: todos.filter((t) => t.status === 'in_progress').sort(byDueThenCreated),
    todo: todos.filter((t) => t.status === 'todo').sort(byDueThenCreated),
  }
}

/** 추가한 날짜별 묶음 — 날짜 내림차순, 묶음 안은 최근 추가가 위. 같은 id 는 한 번만. */
export function groupByCreatedDate(items: Todo[]): Array<{ date: string; items: Todo[] }> {
  const seen = new Set<string>()
  const map = new Map<string, Todo[]>()
  for (const t of items) {
    if (seen.has(t.id)) continue
    seen.add(t.id)
    map.set(t.createdDate, [...(map.get(t.createdDate) ?? []), t])
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      items: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
}

export function dayHeading(date: string, today: string): { name: string; sub: string } {
  const d = utcDate(date)
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const wd = `${WEEKDAYS[d.getUTCDay()]}요일`
  const n = daysBetween(today, date)
  if (n === 0) return { name: '오늘', sub: `${m}월 ${day}일 ${wd}` }
  if (n === 1) return { name: '어제', sub: `${m}월 ${day}일 ${wd}` }
  const sameYear = date.slice(0, 4) === today.slice(0, 4)
  return { name: `${sameYear ? '' : `${d.getUTCFullYear()}년 `}${m}월 ${day}일`, sub: wd }
}

export function dueText(t: Pick<Todo, 'dueDate' | 'dueTime'>): string | null {
  if (!t.dueDate) return null
  const d = utcDate(t.dueDate)
  const base = `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${WEEKDAYS[d.getUTCDay()]})`
  return t.dueTime ? `${base} ${t.dueTime}` : base
}

export function isDueSoon(t: Todo, today: string): boolean {
  if (t.status === 'done' || !t.dueDate) return false
  return daysBetween(t.dueDate, today) <= DUE_SOON_DAYS
}
