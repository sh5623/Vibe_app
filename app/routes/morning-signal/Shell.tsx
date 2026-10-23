import type { ReactNode } from 'react'
import './morning-signal.css'

// 레퍼런스 4행 — React 19 가 <head> 로 끌어올린다
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap'

/** 뉴스·TO-DO 공통 껍데기 — 글꼴, 오로라·격자 배경, 가운데 정렬 틀 */
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="ms">
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="grid-bg" aria-hidden="true" />
      <div className="wrap">{children}</div>
    </div>
  )
}
