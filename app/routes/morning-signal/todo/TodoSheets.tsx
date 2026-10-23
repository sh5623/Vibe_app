import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Todo, TodoStatus } from '../../../../api/morning-signal-todo'
import { STATUS_LABEL } from './todo-model'

// 아래에서 올라오는 시트들 — 시안 todo-list.html 의 .sheet·.opt·.segs.

const STATUSES: TodoStatus[] = ['todo', 'in_progress', 'done']

/** 상태 → 줄·아이콘 클래스 접미사 */
export function statusClass(s: TodoStatus): 'todo' | 'progress' | 'done' {
  return s === 'in_progress' ? 'progress' : s
}

/** 빈 원(TODO) → 반 찬 원(IN PROGRESS) → 초록 체크(DONE). 색·모양은 부모의 .s-* 클래스가 정한다. */
export function StatusIcon() {
  return (
    <svg className="si" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle className="si-ring" cx="10" cy="10" r="8.5" />
      <path className="si-pie" d="M10 4.6a5.4 5.4 0 0 1 0 10.8z" />
      <circle className="si-disc" cx="10" cy="10" r="9.6" />
      <path className="si-chk" d="M6.2 10.3l2.6 2.6 5-5.2" />
    </svg>
  )
}

const EXIT_MS = 320

interface SheetProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/** 시트 껍데기 — 배경을 누르거나 Escape 로 닫힌다. 닫힐 때 내려가는 모션이 끝난 뒤 내용을 뗀다. */
export function Sheet({ open, onClose, label, children }: SheetProps) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      // 붙인 다음 프레임에 올려야 transition 이 걸린다
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    const t = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (shown)
      panelRef.current
        ?.querySelector<HTMLElement>('[data-autofocus], button, input, textarea')
        ?.focus({ preventScroll: true })
  }, [shown])

  if (!mounted) return null
  return (
    <div className={`todo-sheet${shown ? ' on' : ''}`}>
      <button
        type="button"
        className="todo-dim"
        onClick={onClose}
        aria-label="닫기"
        tabIndex={-1}
      />
      <div className="todo-panel" role="dialog" aria-modal="true" aria-label={label} ref={panelRef}>
        <div className="todo-handle" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

interface StatusSheetProps {
  todo: Todo | null
  onPick: (s: TodoStatus) => void
  onClose: () => void
}

export function StatusSheet({ todo, onPick, onClose }: StatusSheetProps) {
  // 닫히는 동안에도 마지막 할 일을 보여 준다
  const last = useRef<Todo | null>(todo)
  if (todo) last.current = todo
  const t = todo ?? last.current
  return (
    <Sheet open={!!todo} onClose={onClose} label="상태 바꾸기">
      {t && (
        <div className="todo-opts">
          <p className="todo-opts-t">{t.title}</p>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`todo-opt s-${statusClass(s)}`}
              onClick={() => onPick(s)}
            >
              <StatusIcon />
              <span>{STATUS_LABEL[s]}</span>
              {s === t.status && <em>현재</em>}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  )
}
