import type { ReactNode } from 'react'
import { useMsThemeAttr } from './Header'
import './morning-signal.css'

// 레퍼런스 4행 — React 19 가 <head> 로 끌어올린다
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap'

/**
 * 목록 빨간 칩(FE 높음·FE 주목)의 전류 테두리 필터 — 칩마다 캔버스를 띄우지 않고 이 필터 하나를 함께 쓴다.
 * 잡음 무늬(seed)를 0.09초마다 바꿔 테두리가 지직거린다. 동작 줄이기면 CSS 가 필터를 떼어 정지한 빨간 고리만 남는다.
 * 아티팩트판 morning-signal.html 의 #msZap 과 같은 값.
 */
function ZapDefs() {
  return (
    <svg className="ms-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter
        id="ms-zap"
        x="-40%"
        y="-80%"
        width="180%"
        height="260%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence type="turbulence" baseFrequency="0.11" numOctaves={3} seed={1} result="noise">
          <animate
            attributeName="seed"
            values="1;4;2;7;3;9;5;8"
            dur="0.72s"
            calcMode="discrete"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale={3.2}
          xChannelSelector="R"
          yChannelSelector="B"
        />
      </filter>
    </svg>
  )
}

/** 뉴스·TO-DO 공통 껍데기 — 글꼴, 오로라·격자 배경, 칩 전류 필터, 테마 속성, 레일·탭 바(nav), 가운데 정렬 틀 */
export default function Shell({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  useMsThemeAttr()
  return (
    <div className="ms">
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="grid-bg" aria-hidden="true" />
      <ZapDefs />
      {/* 레일·탭 바는 .wrap(z-index 쌓임 맥락) 안에 둔다 — 밖에 두면 .wrap 안의 시트(z 50)가 탭 바 아래로 깔린다 */}
      <div className="wrap">
        {nav}
        {children}
      </div>
    </div>
  )
}
