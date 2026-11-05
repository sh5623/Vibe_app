import { useMemo, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router'
import { MobileTabBar, type MsView, Rail } from './morning-signal/Nav'
import Shell from './morning-signal/Shell'

/**
 * News·TO-DO 공통 레이아웃 — 껍데기(배경 파형·레일·하단 탭 바·테마 속성)를 한 번만 마운트한다.
 * 보기를 바꿔도 레일 선택 표시가 미끄러지고(설계 §6.1-2) 배경이 다시 그려지지 않는다(코드 리뷰 지적 3·4).
 * 건수 칩·자물쇠는 각 보기가 outlet context 로 알려 준다.
 */
export interface MsLayoutContext {
  setNewsCount: (n: number | null) => void
  setTodoCount: (n: number | null) => void
  setOnLock: (fn: (() => void) | null) => void
}

export const useMsLayout = () => useOutletContext<MsLayoutContext>()

export default function MorningSignalLayout() {
  const { pathname } = useLocation()
  const view: MsView = pathname.replace(/\/$/, '').endsWith('/todo') ? 'todo' : 'news'
  const [newsCount, setNewsCount] = useState<number | null>(null)
  const [todoCount, setTodoCount] = useState<number | null>(null)
  const [onLock, setOnLockState] = useState<(() => void) | null>(null)
  const ctx = useMemo<MsLayoutContext>(
    () => ({
      setNewsCount,
      setTodoCount,
      // 함수를 상태로 둘 때는 업데이터로 감싼다(그대로 넘기면 React 가 업데이터로 부른다)
      setOnLock: (fn) => setOnLockState(() => fn),
    }),
    []
  )
  return (
    <Shell
      nav={
        <>
          <Rail
            view={view}
            newsCount={newsCount}
            todoCount={todoCount}
            onLock={onLock ?? undefined}
          />
          <MobileTabBar view={view} />
        </>
      }
    >
      <Outlet context={ctx} />
    </Shell>
  )
}
