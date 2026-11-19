import type { ReactNode } from 'react'
import { useMsThemeAttr } from './Header'
import './morning-signal.css'

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
  return (
    <div className="ms">
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <div className="aurora" aria-hidden="true" />
      {/* 상단 막대(top)는 .wrap 밖 앞 형제(전체 폭 sticky · 전환 때 안 움직임). 하단 탭 바(nav)는 .wrap(z-index 쌓임 맥락) 안에 둔다 — 밖에 두면 .wrap 안의 시트(z 50)가 탭 바 아래로 깔린다 */}
      {top}
      <div className="wrap">
        {nav}
        {children}
      </div>
    </div>
  )
}
