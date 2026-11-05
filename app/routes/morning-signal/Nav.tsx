import { Lock, Newspaper, SquareCheck } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ThemeButton } from './Header'

/**
 * 왼쪽 레일 · 휴대폰 하단 탭 바 · 본문 제목 줄 — 2026-11-05 사이드 레일 설계(second-brain
 * `.wiki-automation/specs/2026-11-05-morning-signal-sidebar-design.md` §5.2·§5.3·§6.1).
 * 아티팩트판(dashboard/morning-signal.html 의 .rail·.ptitle)과 같은 값·같은 규칙이다.
 */

export type MsView = 'news' | 'todo'

const VIEWS = [
  { key: 'news', label: 'News', to: '/morning-signal', Icon: Newspaper },
  { key: 'todo', label: 'TO-DO', to: '/morning-signal/todo', Icon: SquareCheck },
] as const

const RAIL_X = 220 // 펼친 폭(접힌 폭 56px 은 CSS --rail)

/** 「동작 줄이기」면 보기 전환을 View Transition 없이 바로 바꾼다(설계 §6.1-3) */
const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function Logo() {
  return (
    <div className="logo" aria-hidden="true">
      <span>
        <i />
        <i />
        <i />
      </span>
      <i className="live" />
    </div>
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

/**
 * 마우스를 0.12초 머물면 펼치고 떠나면 0.15초 뒤 접는다. 키보드 포커스(:focus-visible)로도 펼치고 Esc 로 접는다.
 * 안/밖 판정은 좌표로 한다 — 보기 전환(View Transition) 중에는 브라우저가 레일을 벗어난 것으로 이벤트를 보낸다.
 */
function useRailOpen() {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    const rail = ref.current
    if (!rail) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let timer = 0
    let inside = openRef.current
    let escShut = false
    const later = (fn: () => void, ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(fn, reduce ? 0 : ms)
    }
    const keyFocus = () => !!rail.querySelector(':focus-visible')
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const width = openRef.current ? RAIL_X : rail.offsetWidth
      const now = e.clientX < width
      if (now === inside) return
      inside = now
      if (now) later(() => setOpen(true), 120)
      else {
        escShut = false
        later(() => {
          if (!keyFocus()) setOpen(false)
        }, 150)
      }
    }
    const onDocLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !inside) return
      inside = false
      later(() => {
        if (!keyFocus()) setOpen(false)
      }, 150)
    }
    const onFocusIn = () => {
      if (!escShut && keyFocus()) {
        window.clearTimeout(timer)
        setOpen(true)
      }
    }
    const onFocusOut = (e: FocusEvent) => {
      if (rail.contains(e.relatedTarget as Node | null)) return
      escShut = false
      if (!inside) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openRef.current) {
        escShut = true
        window.clearTimeout(timer)
        setOpen(false)
      }
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onDocLeave)
    rail.addEventListener('focusin', onFocusIn)
    rail.addEventListener('focusout', onFocusOut)
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onDocLeave)
      rail.removeEventListener('focusin', onFocusIn)
      rail.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return { ref, open }
}

interface RailProps {
  view: MsView
  /** 뉴스 건수(그날 전체) — 모르면 null(칩 숨김) */
  newsCount?: number | null
  /** 남은 일 수 — TO-DO 목록을 받은 뒤에만 */
  todoCount?: number | null
  onLock?: () => void
}

/** 768px 이상에서만 보인다(CSS). 접힌 56px 아이콘 줄 → 펼치면 220px 로 본문 위에 겹친다. */
export function Rail({ view, newsCount = null, todoCount = null, onLock }: RailProps) {
  const { ref, open } = useRailOpen()
  const reduce = reduceMotion()
  const counts: Record<MsView, number | null> = { news: newsCount, todo: todoCount }
  const active = VIEWS.findIndex((v) => v.key === view)
  const ind: CSSProperties = { transform: `translateY(${Math.max(0, active) * 44}px)` }
  return (
    <aside ref={ref} className={open ? 'rail open' : 'rail'} aria-label="Morning Signal 메뉴">
      <div className="rail-in">
        <div className="rbrand">
          <Logo />
          <b className="rlb" style={{ '--i': 0 } as CSSProperties}>
            Morning Signal
          </b>
        </div>
        <nav className="rnav" aria-label="보기 전환">
          <span className="rind" style={ind} aria-hidden="true" />
          {VIEWS.map((v, i) => {
            const n = counts[v.key]
            const on = view === v.key
            return (
              <Link
                key={v.key}
                to={v.to}
                viewTransition={!reduce}
                aria-current={on ? 'page' : undefined}
                className={on ? 'on' : undefined}
                title={v.label}
                style={{ '--i': i + 1 } as CSSProperties}
              >
                <v.Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="rlb">{v.label}</span>
                {n !== null && <em className="rcnt rlb">{n.toLocaleString('ko-KR')}</em>}
              </Link>
            )
          })}
        </nav>
        <div className="rfoot">
          {onLock && <LockButton onLock={onLock} />}
          <ThemeButton />
        </div>
      </div>
    </aside>
  )
}

/** 768px 미만에서만 보인다(CSS). 터치 높이 48px 이상, 홈 표시줄만큼 아래 여백. */
export function MobileTabBar({ view }: { view: MsView }) {
  const reduce = reduceMotion()
  const active = VIEWS.findIndex((v) => v.key === view)
  const ind: CSSProperties = { transform: `translateX(${Math.max(0, active) * 100}%)` }
  return (
    <div className="tabbar">
      <nav aria-label="보기 전환">
        <span className="tind" style={ind} aria-hidden="true" />
        {VIEWS.map((v) => {
          const on = view === v.key
          return (
            <Link
              key={v.key}
              to={v.to}
              viewTransition={!reduce}
              aria-current={on ? 'page' : undefined}
              className={on ? 'on' : undefined}
            >
              <v.Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{v.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

interface TitleBarProps {
  title: string
  /** 제목 아래 작은 줄(갱신 스탬프) */
  sub?: string
  onLock?: () => void
  /** 오른쪽(휴대폰은 다음 줄) — 날짜 이동 */
  children?: ReactNode
}

/** 예전 헤더 자리. 휴대폰에서는 로고·테마·자물쇠가 이 줄로 올라온다(레일이 없으므로). */
export function TitleBar({ title, sub, onLock, children }: TitleBarProps) {
  return (
    <header className="ptitle">
      <div className="pt-row">
        <div className="pt-logo">
          <Logo />
        </div>
        <div className="pt-l">
          <h1>{title}</h1>
          {sub !== undefined && (
            <p className="psub">
              <i className="live" />
              <span>{sub}</span>
            </p>
          )}
        </div>
        <div className="pt-tools">
          {onLock && <LockButton onLock={onLock} />}
          <ThemeButton />
        </div>
      </div>
      {children}
    </header>
  )
}
