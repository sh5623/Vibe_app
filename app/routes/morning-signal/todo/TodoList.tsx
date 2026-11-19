import { useEffect, useState } from 'react'
import LatticeLoader from '@/components/react-bits/LatticeLoader'
import { springDone } from '@/components/react-bits/SpringCheck'
import StarBorder from '@/components/react-bits/StarBorder'
import { useTodoList, useUpdateTodo } from '@/hooks/use-morning-signal-todo'
import type { Todo, TodoStatus } from '../../../../api/morning-signal-todo'
import { SAVE_FAILED, StatusIcon, StatusSheet, statusClass } from './TodoSheets'
import {
  dueText,
  filterPending,
  isDueSoon,
  kstToday,
  type PendingFilter,
  pendingGroup,
  splitPending,
} from './todo-model'

// 「남은 일」 목록 — 보드(TodoBoard)의 남은 일 카드 본문. 시안 todo.js listHTML · views.css .tasks/.task/.tick-btn/.star.
// 중요 표시는 맨 위 별빛 상자(IMPORTANT), 그 아래 진행 중 → 할 일. 줄마다 상태 칩, 거르기(전체·할 일·진행 중)는 보드가 정한다.

/** DONE 이 된 줄이 「남은 일」에서 빠지기까지 — 체크 모션(~0.45s) + 접힘(0.36s) + 여유 */
const LEAVE_MS = 850
const ENTER_MS = 900
/** IMPORTANT 테두리 별빛 색 — 캔버스에 칠하므로 CSS 변수가 아니라 실제 색이어야 한다(--td-imp 와 같은 값) */
const IMP_STAR = '#8b5cf6'

/** 줄 끝 상태 칩 — 시안 todo.js ST(할 일 · 진행 중). 빠지는 동안의 DONE 은 완료 */
export const STATUS_CHIP: Record<TodoStatus, { label: string; cls: string }> = {
  todo: { label: '할 일', cls: 'chip' },
  in_progress: { label: '진행 중', cls: 'chip ai' },
  done: { label: '완료', cls: 'chip ok' },
}

/** 시안 todo.js STAR — 중요 표시 */
export const STAR_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </svg>
)

type Group = 'important' | 'progress' | 'todo'

interface Leaving {
  todo: Todo
  /** DONE 으로 바꾸기 전 상태 — 거르기에 맞는지 볼 때 */
  from: TodoStatus
  group: Group
  index: number
}

const ICON = {
  note: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 6h14M5 12h14M5 18h9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  clip: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
}

/** `YYYY-MM-DD` → `M/D` */
function md(date: string): string {
  const [, m = '', d = ''] = date.split('-')
  return `${Number(m)}/${Number(d)}`
}

interface RowProps {
  t: Todo
  today: string
  leaving?: boolean
  entering?: boolean
  onStatus: (t: Todo) => void
  onOpen: (id: string) => void
}

function Row({ t, today, leaving, entering, onStatus, onOpen }: RowProps) {
  const due = dueText(t)
  const chip = STATUS_CHIP[t.status]
  const cls = [
    'task',
    'trow',
    `s-${statusClass(t.status)}`,
    // 중요 강조(보라 글자) — 끝난 일은 강조를 뺀다. 글자색 흐름은 IMPORTANT 상자 안에서만(CSS)
    t.important && t.status !== 'done' ? 'imp' : '',
    leaving ? 'leaving' : '',
    entering ? 'enter' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <li className={cls} data-id={t.id}>
      <button
        type="button"
        className="trow-ck tick-btn"
        aria-label="상태 바꾸기"
        onClick={() => onStatus(t)}
      >
        <StatusIcon />
      </button>
      <button type="button" className="trow-tx" onClick={() => onOpen(t.id)}>
        <span className="trow-h">
          <span className="trow-tt">{t.title}</span>
          {t.important && (
            <span className="star" role="img" aria-label="중요">
              {STAR_ICON}
            </span>
          )}
        </span>
        <span className="trow-mt">
          <span className="tx">{md(t.createdDate)} 등록</span>
          {due && (
            <span className={`tx trow-due${isDueSoon(t, today) ? ' soon' : ''}`}>마감 {due}</span>
          )}
          {t.body && <span title="메모">{ICON.note}</span>}
          {t.link && <span title="링크">{ICON.link}</span>}
          {t.attachments.length > 0 && <span title="첨부">{ICON.clip}</span>}
        </span>
      </button>
      <span className={chip.cls}>{chip.label}</span>
    </li>
  )
}

/** 목록 로더 — 회전 고리 대신 격자(react-bits LatticeLoader · 4×4 sweep, 초시계 없음). 라벨은 낭독용으로만 쓴다 */
export function TodoLoader({ label }: { label: string }) {
  return (
    <span className="todo-loader">
      <LatticeLoader
        label={label}
        grid={4}
        pattern="sweep"
        cellSize={5}
        gap={3}
        showTimer={false}
      />
    </span>
  )
}

interface TodoListProps {
  onOpen: (id: string) => void
  /** 상태 거르기 — 전체 · 할 일 · 진행 중 */
  filter: PendingFilter
  /** 방금 만든 할 일 — 등장 모션을 준다 */
  newId?: string | null
  onError?: (message: string) => void
  /** 남은 일 수(거르기와 무관)가 바뀔 때 — 하단 탭 TO-DO 배지용 */
  onPendingCount?: (n: number) => void
}

export default function TodoList({
  onOpen,
  filter,
  newId,
  onError,
  onPendingCount,
}: TodoListProps) {
  const list = useTodoList(true)
  const update = useUpdateTodo()
  const [statusFor, setStatusFor] = useState<Todo | null>(null)
  const [leaving, setLeaving] = useState<Map<string, Leaving>>(new Map())
  const [entering, setEntering] = useState<Set<string>>(new Set())

  const today = kstToday(new Date())
  const pages = list.data?.pages ?? []
  const pendingAll = pages[0]?.pending ?? []
  const items = pages[0]?.items ?? []

  // 빠지는 중인 줄은 원래 자리에 남겨 두었다가 접는다
  const live = pendingAll.filter((t) => t.status !== 'done' && !leaving.has(t.id))
  const loaded = pages.length > 0
  // 탭 배지 — 목록을 받은 뒤에만 알린다(모르는 동안 0을 보이지 않게)
  useEffect(() => {
    if (loaded) onPendingCount?.(live.length)
  }, [loaded, live.length, onPendingCount])
  const split = splitPending(filterPending(live, filter))
  for (const l of leaving.values()) {
    if (filterPending([{ ...l.todo, status: l.from }], filter).length === 0) continue
    const arr = split[l.group]
    arr.splice(Math.min(l.index, arr.length), 0, l.todo)
  }
  const rest = [...split.progress, ...split.todo]

  const markEntering = (id: string) => {
    setEntering((s) => new Set(s).add(id))
    setTimeout(
      () =>
        setEntering((s) => {
          const n = new Set(s)
          n.delete(id)
          return n
        }),
      ENTER_MS
    )
  }

  const pick = (s: TodoStatus) => {
    const t = statusFor
    setStatusFor(null)
    if (!t || t.status === s) return
    if (s === 'done' && t.status !== 'done') {
      const group: Group = pendingGroup(t)
      const index = split[group].findIndex((x) => x.id === t.id)
      setLeaving((m) =>
        new Map(m).set(t.id, { todo: { ...t, status: 'done' }, from: t.status, group, index })
      )
      // DONE이 되는 순간 스프링(react-bits SpringCheck) — 줄이 .s-done 으로 다시 그려진 다음 프레임에 건다(저장은 아래에서 바로 보낸다)
      requestAnimationFrame(() =>
        springDone(document.querySelectorAll(`.ms .trow[data-id="${CSS.escape(t.id)}"]`))
      )
      setTimeout(
        () =>
          setLeaving((m) => {
            const n = new Map(m)
            n.delete(t.id)
            return n
          }),
        LEAVE_MS
      )
    } else {
      markEntering(t.id)
    }
    update.mutate(
      { id: t.id, patch: { status: s } },
      {
        onError: (e) => {
          if (e.code !== 'LOCKED_SESSION') onError?.(SAVE_FAILED)
        },
      }
    )
  }

  if (list.isPending) return <TodoLoader label="불러오는 중" />
  if (list.isError && !list.data) return <p className="empty">목록을 불러오지 못했어요</p>

  const row = (t: Todo) => (
    <Row
      key={t.id}
      t={t}
      today={today}
      leaving={leaving.has(t.id)}
      entering={entering.has(t.id) || t.id === newId}
      onStatus={setStatusFor}
      onOpen={onOpen}
    />
  )

  return (
    <div className="todo-pending">
      {pendingAll.length === 0 && items.length === 0 ? (
        <p className="empty">아직 할 일이 없어요. Add로 첫 할 일을 만들어 보세요.</p>
      ) : live.length === 0 && leaving.size === 0 ? (
        <p className="empty">남은 일이 없어요</p>
      ) : split.important.length + rest.length === 0 ? (
        <p className="empty">이 상태의 할 일이 없어요.</p>
      ) : (
        <>
          {split.important.length > 0 && (
            // 중요 묶음 — 테두리를 따라 별빛 하나가 돈다(react-bits StarBorder, 화면 밖·동작 줄이기면 멈춤)
            <StarBorder
              as="div"
              className="todo-imp"
              theme="light"
              color={IMP_STAR}
              backgroundColor="var(--td-imp-bg)"
              borderColor="var(--td-imp-line)"
              textColor="inherit"
              radius={14}
              duration={6}
              trailLength={0.35}
              glow={0.5}
              hover="none"
              clickPulse={false}
            >
              <p className="todo-sub important">IMPORTANT</p>
              <ul className="tasks">{split.important.map(row)}</ul>
            </StarBorder>
          )}
          {rest.length > 0 && <ul className="tasks">{rest.map(row)}</ul>}
        </>
      )}
      <StatusSheet todo={statusFor} onPick={pick} onClose={() => setStatusFor(null)} />
    </div>
  )
}
