import { useCallback, useEffect, useState } from 'react'
import { useLock, useTodoSession } from '@/hooks/use-morning-signal-todo'
import type { Route } from './+types/morning-signal-todo'
import { TitleBar } from './morning-signal/Nav'
import PinGate from './morning-signal/todo/PinGate'
import TodoList from './morning-signal/todo/TodoList'
import { CreateSheet, DetailSheet } from './morning-signal/todo/TodoSheets'
import { useMsLayout } from './morning-signal-layout'
import './morning-signal/todo/todo.css'

const TOAST_MS = 3000
const NEW_ROW_MS = 900

export function meta(_: Route.MetaArgs) {
  return [{ title: 'TO-DO | Morning Signal' }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default function MorningSignalTodo() {
  const session = useTodoSession()
  const lock = useLock()
  const unlocked = session.data?.unlocked === true

  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [newId, setNewId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)
  const [pending, setPending] = useState<number | null>(null)

  const notify = useCallback((message: string) => setToast({ message, key: Date.now() }), [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!newId) return
    const t = setTimeout(() => setNewId(null), NEW_ROW_MS)
    return () => clearTimeout(t)
  }, [newId])
  // 잠기면(다시 잠그기·세션 만료) 열린 시트를 닫는다
  useEffect(() => {
    if (!unlocked) {
      setCreating(false)
      setDetailId(null)
      setPending(null)
    }
  }, [unlocked])
  const onLock = unlocked ? () => lock.mutate() : undefined
  // 레일 TO-DO 칩·자물쇠(레이아웃이 그린다)
  const { setTodoCount, setOnLock } = useMsLayout()
  useEffect(() => setTodoCount(unlocked ? pending : null), [unlocked, pending, setTodoCount])
  const relock = lock.mutate
  useEffect(() => {
    setOnLock(unlocked ? () => relock() : null)
    return () => setOnLock(null)
  }, [unlocked, relock, setOnLock])

  return (
    <>
      <TitleBar title="TO-DO" onLock={onLock} />
      {session.isPending ? null : unlocked ? (
        <>
          <TodoList
            onOpen={setDetailId}
            newId={newId}
            onError={notify}
            onPendingCount={setPending}
          />
          <button
            type="button"
            className="todo-fab"
            aria-label="할 일 만들기"
            onClick={() => setCreating(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <CreateSheet
            open={creating}
            onClose={() => setCreating(false)}
            onCreated={(t) => {
              setNewId(t.id)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            notify={notify}
          />
          <DetailSheet id={detailId} onClose={() => setDetailId(null)} notify={notify} />
        </>
      ) : (
        <PinGate
          lockedUntil={session.data?.lockedUntil ?? null}
          configError={session.error?.code === 'TODO_NOT_CONFIGURED'}
        />
      )}
      <div className={`todo-toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        {toast?.message}
      </div>
    </>
  )
}
