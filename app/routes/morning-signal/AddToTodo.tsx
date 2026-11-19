import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  findTodoByLink,
  todoKeys,
  useCreateTodo,
  useFindTodoByLink,
  useTodoSession,
} from '@/hooks/use-morning-signal-todo'
import type { GhItem } from '../../../api/morning-signal'
import { safeUrl } from './model'
import { useMsRoot } from './Shell'
import PinGate from './todo/PinGate'
import { SAVE_FAILED } from './todo/TodoSheets'

const PLUS = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
const TICK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
)

interface AddToTodoProps {
  item: GhItem
  /** 토스트 — 「TO-DO에 담았어요」 · 저장 실패 문구 */
  onNotify?: (message: string) => void
}

/** FePicks 카드 링크와 같은 주소 — 안전하지 않은 url 이면 레포 페이지로 */
const linkOf = (g: GhItem) => safeUrl(g.url) ?? `https://github.com/${g.repo}`

/**
 * 「FE에 쓸 레포」 카드의 TO-DO 담기 버튼(시안 app.js `msAddTodo`).
 * 풀려 있으면 바로 담고, 잠겨 있으면 그 자리에서 PIN 창을 띄워 풀리는 순간 이어서 담는다(A안).
 * 이미 담은 레포(완료 포함)는 처음부터 ✓ 이고 누르면 아무것도 하지 않는다.
 */
export default function AddToTodo({ item, onNotify }: AddToTodoProps) {
  const qc = useQueryClient()
  const session = useTodoSession()
  const unlocked = session.data?.unlocked === true
  const found = useFindTodoByLink(linkOf(item), unlocked)
  const create = useCreateTodo()
  const [open, setOpen] = useState(false)
  // PIN 이 풀리면 한 번만 이어서 담는다 — 창을 닫으면 비운다
  const pending = useRef<GhItem | null>(null)
  const added = !!found.data

  const save = (g: GhItem) => {
    const link = linkOf(g)
    create.mutate(
      { title: g.repo, body: g.impactNote || g.description, link },
      {
        onSuccess: (todo) => {
          qc.setQueryData(todoKeys.find(link), { id: todo.id, status: todo.status })
          onNotify?.('TO-DO에 담았어요')
        },
        onError: () => onNotify?.(SAVE_FAILED),
      }
    )
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: 풀리는 순간(unlocked 변화)에만 이어서 담는다
  useEffect(() => {
    if (!unlocked || !pending.current) return
    const g = pending.current
    pending.current = null
    setOpen(false)
    const link = linkOf(g)
    // 잠겨 있던 동안은 중복 조회를 못 했다 — 풀린 직후 확인하고, 이미 있으면 만들지 않는다
    void qc
      .fetchQuery({
        queryKey: todoKeys.find(link),
        queryFn: () => findTodoByLink(link),
        staleTime: 0,
      })
      .then((hit) => {
        if (hit) onNotify?.('이미 TO-DO에 있어요')
        else save(g)
      })
      .catch(() => onNotify?.(SAVE_FAILED))
  }, [unlocked])

  const click = () => {
    if (added || create.isPending) return
    if (unlocked) {
      save(item)
      return
    }
    pending.current = item
    setOpen(true)
  }

  const close = () => {
    pending.current = null
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="btn ghost"
        aria-label="TO-DO에 담기"
        aria-pressed={added}
        onClick={click}
      >
        {added ? TICK : PLUS}
        TO-DO
      </button>
      {open && (
        <PinDialog
          lockedUntil={session.data?.lockedUntil ?? null}
          configError={session.error?.code === 'TODO_NOT_CONFIGURED'}
          onClose={close}
        />
      )}
    </>
  )
}

/** 최상위 레이어(showModal)라 상단 막대(z-index 40)까지 덮는다. Esc·바깥 누름·취소로 닫힌다 */
function PinDialog({
  lockedUntil,
  configError,
  onClose,
}: {
  lockedUntil: string | null
  configError: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const root = useMsRoot()
  // 카드(.picks li) 밖 .ms 루트로 포털 — 카드 CSS 가 창 안으로 새지 않게(시트와 같은 방식)
  // biome-ignore lint/correctness/useExhaustiveDependencies: root 가 생겨 창이 그려진 뒤에 연다
  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [root])
  const dlg = (
    // biome-ignore lint/a11y/useKeyWithClickEvents: 바깥 누름은 마우스·터치 보조 — 키보드는 Esc(네이티브)
    <dialog
      id="pinDlg"
      ref={ref}
      className="pin-dlg"
      aria-labelledby="pinDlgT"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className="pin-in">
        <h2 id="pinDlgT">PIN을 입력하세요</h2>
        <p>입력하면 바로 TO-DO에 담아요.</p>
        <PinGate compact lockedUntil={lockedUntil} configError={configError} />
        <div className="acts">
          <button type="button" className="btn ghost" onClick={() => ref.current?.close()}>
            취소
          </button>
        </div>
      </div>
    </dialog>
  )
  // 루트가 아직 없으면(첫 렌더) 그 자리에 두지 않고 기다린다 — 카드 안에 그려지면 안 된다
  return root ? createPortal(dlg, root) : null
}
