import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation, useOutletContext } from 'react-router'
import { LockButton, MobileTabBar, type MsView, TopBar } from './morning-signal/Nav'
import Shell from './morning-signal/Shell'
import './morning-signal/todo/todo.css'

/**
 * News·TO-DO 공통 레이아웃 — 껍데기(정적 배경·상단 막대·하단 탭 바·테마 속성)를 한 번만 마운트한다.
 * 보기를 바꿔도 상단 막대가 유지되고 배경이 다시 그려지지 않는다(코드 리뷰 지적 3·4).
 * 건수 칩·자물쇠는 각 보기가 outlet context 로 알려 준다.
 */
export interface MsLayoutContext {
  /** 상단 막대 오른쪽 칸 — 날짜 이동을 포털로 넣는다(없으면 아직 마운트 전) */
  dateSlot: HTMLElement | null
  setTodoCount: (n: number | null) => void
  setOnLock: (fn: (() => void) | null) => void
}

export const useMsLayout = () => useOutletContext<MsLayoutContext>()

export default function MorningSignalLayout() {
  const { pathname } = useLocation()
  const view: MsView = pathname.replace(/\/$/, '').endsWith('/todo') ? 'todo' : 'news'
  const [dateSlot, setDateSlot] = useState<HTMLElement | null>(null)
  const [todoCount, setTodoCount] = useState<number | null>(null)
  const [onLock, setOnLockState] = useState<(() => void) | null>(null)
  const ctx = useMemo<MsLayoutContext>(
    () => ({
      dateSlot,
      setTodoCount,
      // 함수를 상태로 둘 때는 업데이터로 감싼다(그대로 넘기면 React 가 업데이터로 부른다)
      setOnLock: (fn) => setOnLockState(() => fn),
    }),
    [dateSlot]
  )
  return (
    <Shell
      top={<TopBar view={view} slotRef={setDateSlot} />}
      nav={<MobileTabBar view={view} todoCount={todoCount} />}
    >
      {/* 임시: 다시 잠그기를 오른쪽 칸에 둔다(최종 자리는 Task 7 — Add 옆) */}
      {view === 'todo' &&
        onLock &&
        dateSlot &&
        createPortal(<LockButton onLock={onLock} />, dateSlot)}
      <Outlet context={ctx} />
    </Shell>
  )
}
