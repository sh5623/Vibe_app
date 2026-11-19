import { useMemo, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router'
import { MobileTabBar, type MsView, TopBar } from './morning-signal/Nav'
import Shell from './morning-signal/Shell'
import './morning-signal/todo/todo.css'

/**
 * News·TO-DO 공통 레이아웃 — 껍데기(정적 배경·상단 막대·하단 탭 바·테마 속성)를 한 번만 마운트한다.
 * 보기를 바꿔도 상단 막대가 유지되고 배경이 다시 그려지지 않는다(코드 리뷰 지적 3·4).
 * TO-DO 배지(남은 일 수)는 TO-DO 보기가 outlet context 로 알려 준다.
 */
export interface MsLayoutContext {
  /** 상단 막대 오른쪽 칸 — 날짜 이동을 포털로 넣는다(없으면 아직 마운트 전) */
  dateSlot: HTMLElement | null
  setTodoCount: (n: number | null) => void
}

export const useMsLayout = () => useOutletContext<MsLayoutContext>()

export default function MorningSignalLayout() {
  const { pathname } = useLocation()
  const view: MsView = pathname.replace(/\/$/, '').endsWith('/todo') ? 'todo' : 'news'
  const [dateSlot, setDateSlot] = useState<HTMLElement | null>(null)
  const [todoCount, setTodoCount] = useState<number | null>(null)
  const ctx = useMemo<MsLayoutContext>(() => ({ dateSlot, setTodoCount }), [dateSlot])
  return (
    <Shell
      top={<TopBar view={view} slotRef={setDateSlot} />}
      nav={<MobileTabBar view={view} todoCount={todoCount} />}
    >
      <Outlet context={ctx} />
    </Shell>
  )
}
