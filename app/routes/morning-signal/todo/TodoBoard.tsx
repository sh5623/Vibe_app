import { type CSSProperties, Fragment, useState } from 'react'
import { useDoneHistory, useTodoList } from '@/hooks/use-morning-signal-todo'
import type { Todo } from '../../../../api/morning-signal-todo'
import Card, { Ticks } from '../Card'
import TodoList, { STAR_ICON, STATUS_CHIP, TodoLoader } from './TodoList'
import {
  doneGroups,
  doneToday,
  dueLeft,
  dueText,
  dueWithin,
  kstToday,
  type PendingFilter,
  splitPending,
} from './todo-model'

// TO-DO 보드 — 2026-11-19 B안 §4. 1행 상태 | 중요 | 마감 임박 · 2행 남은 일(2칸) | 완료 기록.
// 시안 todo.js render() · views.css. 카드 틀은 NEWS 와 같은 Card(.p · 제목 줄 36).

type CssVars = CSSProperties & Record<`--${string}`, string>

/** 마감 임박 = 오늘부터 이 일수 뒤까지(지난 것 포함) */
const DUE_DAYS = 3
/** 완료 기록 범위(일) */
const DONE_DAYS = 7

const FILTERS: readonly (readonly [PendingFilter, string])[] = [
  ['all', '전체'],
  ['todo', '할 일'],
  ['progress', '진행 중'],
]

// 시안 todo.js CLOCK · PLUS
const CLOCK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
const PLUS = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/** 마감이 가까운 것 → 시각 → 먼저 추가한 것 */
function byDue(a: Todo, b: Todo): number {
  const ka = `${a.dueDate ?? '9999-12-31'} ${a.dueTime ?? '99:99'}`
  const kb = `${b.dueDate ?? '9999-12-31'} ${b.dueTime ?? '99:99'}`
  return ka.localeCompare(kb) || a.createdAt.localeCompare(b.createdAt)
}

interface TodoBoardProps {
  onOpen: (id: string) => void
  onCreate: () => void
  /** 방금 만든 할 일 — 남은 일에서 등장 모션 */
  newId?: string | null
  onError: (m: string) => void
  /** 남은 일 수 — 하단 탭 TO-DO 배지 */
  onPendingCount: (n: number) => void
}

export default function TodoBoard({
  onOpen,
  onCreate,
  newId,
  onError,
  onPendingCount,
}: TodoBoardProps) {
  const list = useTodoList(true)
  const done = useDoneHistory(DONE_DAYS, true)
  const [filter, setFilter] = useState<PendingFilter>('all')

  if (list.isPending) {
    return (
      <div className="todo-view">
        <TodoLoader label="불러오는 중" />
      </div>
    )
  }
  if (list.isError && !list.data) {
    return (
      <div className="todo-view">
        <section className="card state">
          <b>목록을 불러오지 못했어요</b>
          <span>잠시 뒤 새로고침해 주세요.</span>
        </section>
      </div>
    )
  }

  const today = kstToday(new Date())
  const pending = (list.data.pages[0]?.pending ?? []).filter((t) => t.status !== 'done')
  const nTodo = pending.filter((t) => t.status === 'todo').length
  const nProg = pending.filter((t) => t.status === 'in_progress').length
  // 상태 카드는 「오늘 완료」(설계 §4 · 시안 todo.js) — 완료 기록(최근 7일) 중 오늘(KST) 것만
  const nDone = doneToday(done.data ?? [], today)
  const imp = splitPending(pending).important
  const soon = pending.filter((t) => dueWithin(t, today, DUE_DAYS)).sort(byDue)
  const groups = doneGroups(done.data ?? [], today)

  const legend = [
    { label: '진행 중', n: nProg, c: 'var(--ai)' },
    { label: '할 일', n: nTodo, c: 'var(--muted)' },
    { label: '오늘 완료', n: nDone, c: 'var(--ok)' },
  ]

  /** 중요·마감 임박 줄의 제목 — 누르면 상세 */
  const open = (t: Todo) => (
    <button type="button" className="lk" onClick={() => onOpen(t.id)}>
      {t.title}
    </button>
  )

  return (
    <div className="ms-grid todo-board">
      <Card area="stat" title="상태" aux={<span className="cnt">{nTodo + nProg}개 남음</span>}>
        <Ticks parts={legend.map((l) => [l.n, l.c] as const)} />
        <ul className="legend">
          {legend.map((l) => {
            const dot: CssVars = { '--c': l.c }
            return (
              <li key={l.label}>
                <i style={dot} />
                {l.label}
                <b>{l.n}</b>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card
        area="imp"
        title="중요"
        aux={imp.length > 0 ? <span className="cnt">{imp.length}</span> : null}
      >
        {imp.length === 0 ? (
          <p className="empty">중요 표시한 일이 없어요</p>
        ) : (
          <ul className="rows">
            {imp.map((t) => {
              const chip = STATUS_CHIP[t.status]
              const due = dueText(t)
              return (
                <li key={t.id}>
                  <span className="ico star-ico">{STAR_ICON}</span>
                  <strong>
                    {open(t)}
                    <span className={chip.cls}>{chip.label}</span>
                  </strong>
                  <span className="s">
                    {due ? `마감 ${due} · ${dueLeft(t, today)}` : '마감 없음'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card area="due" title="마감 임박" aux={<span className="aux">{DUE_DAYS}일 안</span>}>
        {soon.length === 0 ? (
          <p className="empty">{DUE_DAYS}일 안에 마감인 일이 없어요</p>
        ) : (
          <ul className="rows">
            {soon.map((t) => (
              <li key={t.id}>
                <span className="ico">{CLOCK}</span>
                <strong>
                  {open(t)}
                  <span className="chip due">{dueLeft(t, today)}</span>
                </strong>
                <span className="s">마감 {dueText(t)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        area="list"
        title="남은 일"
        className="top-r"
        aux={
          <>
            <fieldset className="seg" aria-label="상태로 거르기">
              {FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={filter === k}
                  onClick={() => setFilter(k)}
                >
                  {label}
                </button>
              ))}
            </fieldset>
            {/* id 는 시안 그대로(#tAdd) — 휴대폰 순서 규칙(todo.css)이 쓴다. 보드는 화면에 하나뿐이다 */}
            <button
              type="button"
              className="btn"
              id="tAdd"
              aria-label="새 할 일 추가"
              onClick={onCreate}
            >
              {PLUS}
              Add
            </button>
          </>
        }
      >
        <TodoList
          onOpen={onOpen}
          filter={filter}
          newId={newId}
          onError={onError}
          onPendingCount={onPendingCount}
        />
      </Card>

      <Card area="done" title="완료 기록" className="ms-sticky">
        {done.isPending ? (
          <TodoLoader label="완료 기록 불러오는 중" />
        ) : done.isError ? (
          <p className="empty">완료 기록을 불러오지 못했어요</p>
        ) : groups.length === 0 ? (
          <p className="empty">최근 {DONE_DAYS}일 완료한 일이 없어요</p>
        ) : (
          groups.map((g) => (
            <Fragment key={g.label}>
              <h3 className="sub first">{g.label}</h3>
              <ul className="done">
                {g.items.map((t) => (
                  <li key={t.id}>{open(t)}</li>
                ))}
              </ul>
            </Fragment>
          ))
        )}
      </Card>
    </div>
  )
}
