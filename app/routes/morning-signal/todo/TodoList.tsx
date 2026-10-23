import { useEffect, useRef, useState } from 'react'
import { useTodoList, useUpdateTodo } from '@/hooks/use-morning-signal-todo'
import type { Todo, TodoStatus } from '../../../../api/morning-signal-todo'
import { SAVE_FAILED, StatusIcon, StatusSheet, statusClass } from './TodoSheets'
import {
  dayHeading,
  dueText,
  groupByCreatedDate,
  isDueSoon,
  kstToday,
  PENDING_LIMIT,
  STATUS_LABEL,
  splitPending,
} from './todo-model'

// 목록 — 시안 docs/morning-signal/todo-mockups/todo-list.html (v2, 줄 목록).
// 맨 위 「남은 일」(TODO·IN PROGRESS, 날짜 무관) + 추가한 날짜별 기록(무한 스크롤, 20개씩).

/** DONE 이 된 줄이 「남은 일」에서 빠지기까지 — 체크 모션(~0.7s) + 접힘(0.36s) */
const LEAVE_MS = 1120
const ENTER_MS = 900

type Group = 'progress' | 'todo'

interface Leaving {
  todo: Todo
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

interface RowProps {
  t: Todo
  today: string
  /** 「남은 일」 안에서는 소제목이 상태를 말하므로 끝의 영문 표기를 뺀다 */
  showLabel: boolean
  leaving?: boolean
  entering?: boolean
  /** 위에 구분선을 긋는다(묶음의 첫 줄이 아닐 때) */
  sep?: boolean
  onStatus: (t: Todo) => void
  onOpen: (id: string) => void
}

function Row({ t, today, showLabel, leaving, entering, sep, onStatus, onOpen }: RowProps) {
  const due = dueText(t)
  const cls = [
    'trow',
    `s-${statusClass(t.status)}`,
    sep ? 'sep' : '',
    leaving ? 'leaving' : '',
    entering ? 'enter' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls}>
      <button
        type="button"
        className="trow-ck"
        aria-label="상태 바꾸기"
        onClick={() => onStatus(t)}
      >
        <StatusIcon />
      </button>
      <button type="button" className="trow-tx" onClick={() => onOpen(t.id)}>
        <span className="trow-tt">{t.title}</span>
        {(due || t.body || t.link || t.attachments.length > 0) && (
          <span className="trow-mt">
            {due && <span className={`trow-due${isDueSoon(t, today) ? ' soon' : ''}`}>{due}</span>}
            {t.body && <span title="메모">{ICON.note}</span>}
            {t.link && <span title="링크">{ICON.link}</span>}
            {t.attachments.length > 0 && <span title="첨부">{ICON.clip}</span>}
          </span>
        )}
      </button>
      {showLabel && <span className="trow-st">{STATUS_LABEL[t.status]}</span>}
    </div>
  )
}

interface TodoListProps {
  onOpen: (id: string) => void
  /** 방금 만든 할 일 — 등장 모션을 준다 */
  newId?: string | null
  onError?: (message: string) => void
}

export default function TodoList({ onOpen, newId, onError }: TodoListProps) {
  const list = useTodoList(true)
  const update = useUpdateTodo()
  const [expanded, setExpanded] = useState(false)
  const [statusFor, setStatusFor] = useState<Todo | null>(null)
  const [leaving, setLeaving] = useState<Map<string, Leaving>>(new Map())
  const [entering, setEntering] = useState<Set<string>>(new Set())
  const tailRef = useRef<HTMLDivElement>(null)

  const { hasNextPage, isFetchingNextPage, fetchNextPage, isFetchNextPageError } = list
  // 다음 페이지가 실패하면 관찰을 멈춘다 — 새 관찰자는 붙자마자 「보임」을 알려서, 그대로 두면 실패한 요청을 끝없이 다시 보낸다
  useEffect(() => {
    const el = tailRef.current
    if (!el || !hasNextPage || isFetchNextPageError) return
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isFetchNextPageError])

  const today = kstToday(new Date())
  const pages = list.data?.pages ?? []
  const pendingAll = pages[0]?.pending ?? []
  const items = pages.flatMap((p) => p.items)
  const dayCounts = Object.assign({}, ...pages.map((p) => p.dayCounts)) as Record<
    string,
    { done: number; total: number }
  >

  // 빠지는 중인 줄은 원래 자리에 남겨 두었다가 접는다
  const live = pendingAll.filter((t) => t.status !== 'done' && !leaving.has(t.id))
  const split = splitPending(live)
  for (const l of leaving.values()) {
    const arr = split[l.group]
    arr.splice(Math.min(l.index, arr.length), 0, l.todo)
  }
  const flat: Array<{ t: Todo; group: Group }> = [
    ...split.progress.map((t) => ({ t, group: 'progress' as const })),
    ...split.todo.map((t) => ({ t, group: 'todo' as const })),
  ]
  const shown = expanded ? flat : flat.slice(0, PENDING_LIMIT)
  const groups = groupByCreatedDate(items)

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
      const group: Group = t.status === 'in_progress' ? 'progress' : 'todo'
      const index = split[group].findIndex((x) => x.id === t.id)
      setLeaving((m) => new Map(m).set(t.id, { todo: { ...t, status: 'done' }, group, index }))
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

  if (list.isPending) {
    return (
      <div className="todo-view">
        <div className="todo-loader" role="status" aria-label="불러오는 중" />
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

  const empty = pendingAll.length === 0 && items.length === 0
  let lastGroup: Group | null = null

  return (
    <div className="todo-view">
      <section className="todo-sec" aria-label="남은 일">
        <h2 className="todo-pending-h">
          <b>남은 일</b>
          <span>{live.length}</span>
        </h2>
        <div className="todo-pending">
          {empty ? (
            <p className="todo-clear">아직 할 일이 없어요. ＋로 첫 할 일을 만들어 보세요.</p>
          ) : flat.length === 0 ? (
            <p className="todo-clear">남은 일이 없어요</p>
          ) : (
            shown.map(({ t, group }) => {
              const label = group !== lastGroup
              lastGroup = group
              return (
                <div key={t.id} className="todo-pi">
                  {label && (
                    <p className={`todo-sub ${group}`}>
                      {group === 'progress' ? 'IN PROGRESS' : 'TODO'}
                    </p>
                  )}
                  <Row
                    t={t}
                    today={today}
                    showLabel={false}
                    sep={!label}
                    leaving={leaving.has(t.id)}
                    entering={entering.has(t.id) || t.id === newId}
                    onStatus={setStatusFor}
                    onOpen={onOpen}
                  />
                </div>
              )
            })
          )}
          {flat.length > PENDING_LIMIT && (
            <button type="button" className="todo-more" onClick={() => setExpanded((e) => !e)}>
              {expanded ? '접기' : `${flat.length - PENDING_LIMIT}개 더 보기`}
            </button>
          )}
        </div>
      </section>

      {groups.map((g) => {
        const h = dayHeading(g.date, today)
        const c = dayCounts[g.date]
        return (
          <section key={g.date} className="todo-day" aria-label={`${h.name} ${h.sub}`}>
            <div className="dh">
              <b>{h.name}</b>
              <span className="dh-sub">{h.sub}</span>
              {c && (
                <span className="dh-n">
                  {c.done}/{c.total}
                </span>
              )}
            </div>
            {g.items.map((t, i) => (
              <Row
                key={t.id}
                sep={i > 0}
                t={t}
                today={today}
                showLabel
                entering={entering.has(t.id) || t.id === newId}
                onStatus={setStatusFor}
                onOpen={onOpen}
              />
            ))}
          </section>
        )
      })}

      <div className="todo-tail" ref={tailRef}>
        {isFetchingNextPage ? (
          <span className="todo-loader" role="status" aria-label="더 불러오는 중" />
        ) : isFetchNextPageError ? (
          <button type="button" className="todo-retry" onClick={() => void fetchNextPage()}>
            다시 불러오기
          </button>
        ) : hasNextPage ? (
          <span className="todo-loader" role="status" aria-label="더 불러오는 중" />
        ) : items.length > 0 ? (
          <p>처음 기록까지 다 봤어요</p>
        ) : null}
      </div>

      <StatusSheet todo={statusFor} onPick={pick} onClose={() => setStatusFor(null)} />
    </div>
  )
}
