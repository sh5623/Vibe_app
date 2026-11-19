import type { Todo, TodoStatus } from '../../../../api/morning-signal-todo'

// TO-DO 화면 계산(순수 함수). 날짜는 전부 KST `YYYY-MM-DD` 문자열로 다룬다.

export const STATUS_LABEL: Record<TodoStatus, 'TODO' | 'IN PROGRESS' | 'DONE'> = {
  todo: 'TODO',
  in_progress: 'IN PROGRESS',
  done: 'DONE',
}

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

/** 「남은 일」 묶음 — 중요 표시는 상태와 무관하게 맨 위 IMPORTANT 로(그 안은 진행 중 → 할 일, 각각 마감순) */
export function splitPending(todos: Todo[]): {
  important: Todo[]
  progress: Todo[]
  todo: Todo[]
} {
  const open = todos.filter((t) => t.status !== 'done')
  const imp = open.filter((t) => t.important)
  const rest = open.filter((t) => !t.important)
  return {
    important: [
      ...imp.filter((t) => t.status === 'in_progress').sort(byDueThenCreated),
      ...imp.filter((t) => t.status === 'todo').sort(byDueThenCreated),
    ],
    progress: rest.filter((t) => t.status === 'in_progress').sort(byDueThenCreated),
    todo: rest.filter((t) => t.status === 'todo').sort(byDueThenCreated),
  }
}

/** 이 할 일이 「남은 일」 어느 묶음에 들어가는가 */
export function pendingGroup(
  t: Pick<Todo, 'important' | 'status'>
): 'important' | 'progress' | 'todo' {
  if (t.important) return 'important'
  return t.status === 'in_progress' ? 'progress' : 'todo'
}

export function dueText(t: Pick<Todo, 'dueDate' | 'dueTime'>): string | null {
  if (!t.dueDate) return null
  const d = utcDate(t.dueDate)
  const base = `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${WEEKDAYS[d.getUTCDay()]})`
  return t.dueTime ? `${base} ${t.dueTime}` : base
}

/** 마감이 오늘부터 days 일 뒤까지(지난 것 포함)인 남은 일인가 — 완료·마감 없음은 false */
export function dueWithin(
  t: Pick<Todo, 'dueDate' | 'status'>,
  today: string,
  days: number
): boolean {
  if (t.status === 'done' || !t.dueDate) return false
  return daysBetween(t.dueDate, today) <= days
}

export function isDueSoon(t: Todo, today: string): boolean {
  return dueWithin(t, today, DUE_SOON_DAYS)
}

/** 마감까지 남은 날을 말로 — 오늘 · 내일 · N일 남음 · N일 지남. 마감이 없으면 null */
export function dueLeft(t: Pick<Todo, 'dueDate'>, today: string): string | null {
  if (!t.dueDate) return null
  const n = daysBetween(t.dueDate, today)
  if (n === 0) return '오늘'
  if (n === 1) return '내일'
  return n > 0 ? `${n}일 남음` : `${-n}일 지남`
}

export type PendingFilter = 'all' | 'todo' | 'progress'

/** 「남은 일」 상태 거르기 — 전체 · 할 일 · 진행 중 */
export function filterPending(list: Todo[], f: PendingFilter): Todo[] {
  if (f === 'all') return list
  const status: TodoStatus = f === 'progress' ? 'in_progress' : 'todo'
  return list.filter((t) => t.status === status)
}

/** 오늘(KST) 완료한 수 — 완료 시각(doneAt)의 KST 날짜가 today 인 것만 센다 */
export function doneToday(list: Todo[], today: string): number {
  return list.filter((t) => t.doneAt && kstToday(new Date(t.doneAt)) === today).length
}

/** 완료 기록 — 완료 시각(doneAt)의 KST 날짜별 묶음. 최신 날짜 먼저, 묶음 안도 최근 완료가 위. 라벨은 오늘 · 어제 · M월 D일 */
export function doneGroups(list: Todo[], today: string): { label: string; items: Todo[] }[] {
  const map = new Map<string, Todo[]>()
  for (const t of list) {
    if (!t.doneAt) continue
    const date = kstToday(new Date(t.doneAt))
    map.set(date, [...(map.get(date) ?? []), t])
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => {
      const n = daysBetween(today, date)
      const d = utcDate(date)
      const label =
        n === 0 ? '오늘' : n === 1 ? '어제' : `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`
      return { label, items: items.sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? '')) }
    })
}

const LIST_LINE = /^(\s*)(?:([-*])|(\d+)([.)]))\s+(.*)$/
const TASK_BODY = /^\[( |x|X)\]\s+(.*)$/

/** 목록 줄에서 Enter 를 누르면 다음 줄에 같은 글머리를 이어 준다. 빈 글머리 줄에서 누르면 목록을 끝낸다. 목록 줄이 아니면 null. */
export function continueList(text: string, caret: number): { text: string; caret: number } | null {
  const start = text.lastIndexOf('\n', caret - 1) + 1
  const m = LIST_LINE.exec(text.slice(start, caret))
  if (!m) return null
  const indent = m[1] ?? ''
  const rest = m[5] ?? ''
  const task = TASK_BODY.exec(rest)
  if ((task ? (task[2] ?? '') : rest).trim() === '') {
    return { text: text.slice(0, start) + text.slice(caret), caret: start }
  }
  const bullet = m[2] ?? `${Number(m[3]) + 1}${m[4]}`
  const insert = `\n${indent}${bullet} ${task ? '[ ] ' : ''}`
  return {
    text: text.slice(0, caret) + insert + text.slice(caret),
    caret: caret + insert.length,
  }
}
