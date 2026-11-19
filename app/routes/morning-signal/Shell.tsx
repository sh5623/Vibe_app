import { createContext, type ReactNode, useContext, useState } from 'react'
import { useMsThemeAttr } from './Header'
import './morning-signal.css'

/**
 * `.ms` 루트 요소 — 시트·토스트를 여기로 포털하면 `.wrap`(z 1 쌓임 맥락) 밖에서 그려져
 * 상단 막대(z 40)와 하단 탭 바까지 덮는다. 선택자는 `.ms` 아래 그대로 맞는다.
 */
const MsRootContext = createContext<HTMLElement | null>(null)
export const useMsRoot = () => useContext(MsRootContext)

// 레퍼런스 4행 — React 19 가 <head> 로 끌어올린다
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap'

/** 뉴스·TO-DO 공통 껍데기 — 글꼴, 정적 오로라 배경, 밝은 화면 속성, 상단 막대·탭 바(nav), 가운데 정렬 틀 */
export default function Shell({
  children,
  top,
  nav,
}: {
  children: ReactNode
  /** 상단 막대 — .wrap 밖 앞 형제(전체 폭 sticky · 보기 전환 때 움직이지 않는다) */
  top?: ReactNode
  nav?: ReactNode
}) {
  useMsThemeAttr()
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  return (
    <div className="ms" ref={setRoot}>
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <div className="aurora" aria-hidden="true" />
      {/* 상단 막대(top)는 .wrap 밖 앞 형제(전체 폭 sticky · 전환 때 안 움직임). 하단 탭 바(nav)는 .wrap 안. 시트·토스트는 useMsRoot 로 이 루트에 포털해 둘 다 덮는다 */}
      {top}
      <MsRootContext.Provider value={root}>
        <div className="wrap">
          {nav}
          {children}
        </div>
      </MsRootContext.Provider>
    </div>
  )
}
