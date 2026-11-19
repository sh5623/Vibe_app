import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLock, useTodoSession } from '@/hooks/use-morning-signal-todo'
import type { Route } from './+types/morning-signal-todo'
import { useMsRoot } from './morning-signal/Shell'
import PinGate from './morning-signal/todo/PinGate'
import TodoBoard from './morning-signal/todo/TodoBoard'
import { CreateSheet, DetailSheet } from './morning-signal/todo/TodoSheets'
import { useMsLayout } from './morning-signal-layout'

const TOAST_MS = 3000
const NEW_ROW_MS = 900

export function meta(_: Route.MetaArgs) {
  return [{ title: 'TO-DO | Morning Signal' }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default function MorningSignalTodo() {
  const session = useTodoSession()
  const lock = useLock()
  const root = useMsRoot()
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
  // 하단 탭 TO-DO 배지(레이아웃이 그린다)
  const { setTodoCount } = useMsLayout()
  useEffect(() => setTodoCount(unlocked ? pending : null), [unlocked, pending, setTodoCount])

  // 토스트는 시트 위에 떠야 한다 — 시트와 같은 .ms 루트로 포털
  const toastEl = (
    <div className={`todo-toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
      {toast?.message}
    </div>
  )

  return (
    <>
      {session.isPending ? null : unlocked ? (
        <>
          <TodoBoard
            onOpen={setDetailId}
            onCreate={() => setCreating(true)}
            onLock={() => lock.mutate()}
            newId={newId}
            onError={notify}
            onPendingCount={setPending}
          />
          <CreateSheet
            open={creating}
            onClose={() => setCreating(false)}
            onCreated={(t) => setNewId(t.id)}
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
      {root ? createPortal(toastEl, root) : toastEl}
    </>
  )
}
