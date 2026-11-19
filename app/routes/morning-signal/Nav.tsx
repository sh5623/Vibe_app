import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

/**
 * 상단 막대(데스크톱 가운데 탭 · 오른쪽 날짜 칸) · 휴대폰 하단 탭 바 — 2026-11-19 B안 설계 §4.
 * 시안(second-brain `.wiki-automation/specs/2026-11-19-morning-signal-redesign-mockup/base.css`)의
 * .top·.top-in·.brand·.views 와 ≤760px 탭 바 규칙을 React 로 옮겼다.
 */

export type MsView = 'news' | 'todo'

const ICONS = {
  news: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2z" />
      <path d="M17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5" />
    </svg>
  ),
  todo: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),
} as const

const VIEWS = [
  { key: 'news', label: 'NEWS', to: '/morning-signal' },
  { key: 'todo', label: 'TO-DO', to: '/morning-signal/todo' },
] as const

/** 「동작 줄이기」면 보기 전환을 View Transition 없이 바로 바꾼다(설계 §6.1-3) */
const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 시안 B 로고 — 남색 바탕에 눈금 세 줄(노랑 · 흰색 · 반투명 흰색) */
export function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: 장식 — 부모 span 이 aria-hidden 이다 */}
      <svg viewBox="0 0 32 32">
        <rect width="32" height="32" rx="9" fill="#1e3a8a" />
        <rect x="7.5" y="8.5" width="7" height="3" rx="1.5" fill="#fbbf24" />
        <rect x="7.5" y="14.5" width="17" height="4.2" rx="2.1" fill="#ffffff" />
        <rect x="7.5" y="21.5" width="11" height="3" rx="1.5" fill="#ffffff" fillOpacity=".5" />
      </svg>
    </span>
  )
}

export function LockButton({ onLock }: { onLock: () => void }) {
  return (
    <button
      type="button"
      className="lockbtn"
      aria-label="다시 잠그기"
      title="다시 잠그기"
      onClick={onLock}
    >
      <Lock size={17} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

/** 스크롤이 40px 를 넘으면 true — 상단 막대에 배경·선이 붙는다 */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return scrolled
}

interface TopBarProps {
  view: MsView
  /** 오른쪽 칸(.top-slot) — 날짜 이동 등을 포털로 넣는다 */
  slotRef: (el: HTMLElement | null) => void
}

/** 3칸 격자 — 오른쪽 칸이 비어도(TO-DO) 가운데 탭 자리는 그대로다. 휴대폰에서는 가운데 탭이 숨고 하단 탭 바가 대신한다. */
export function TopBar({ view, slotRef }: TopBarProps) {
  const scrolled = useScrolled()
  const reduce = reduceMotion()
  return (
    <header className={scrolled ? 'top scrolled' : 'top'}>
      <div className="top-in">
        <span className="brand">
          <Logo />
          <h1 className="bn">Morning Signal</h1>
        </span>
        <nav className="views" aria-label="보기 전환">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              to={v.to}
              viewTransition={!reduce}
              aria-current={view === v.key ? 'page' : undefined}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <div className="top-slot" ref={slotRef} />
      </div>
    </header>
  )
}

interface MobileTabBarProps {
  view: MsView
  /** 남은 일 수 — TO-DO 목록을 받은 뒤에만(0 이하·모름이면 배지 숨김) */
  todoCount?: number | null
}

/** 760px 이하에서만 보인다(CSS). 터치 높이 48px 이상, 홈 표시줄만큼 아래 여백. */
export function MobileTabBar({ view, todoCount }: MobileTabBarProps) {
  const reduce = reduceMotion()
  return (
    <div className="tabbar">
      <nav aria-label="보기 전환">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            to={v.to}
            viewTransition={!reduce}
            aria-current={view === v.key ? 'page' : undefined}
          >
            {ICONS[v.key]}
            <span>{v.label}</span>
            {v.key === 'todo' && todoCount !== undefined && todoCount !== null && todoCount > 0 && (
              <em className="tab-badge">{todoCount > 99 ? '99+' : todoCount}</em>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
