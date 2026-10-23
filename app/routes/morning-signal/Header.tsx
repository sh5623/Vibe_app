import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type Ref,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router'
import type { DaySummary } from '../../../api/morning-signal'
import { calendarCells, dateParts, labelEn } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string | number>
type MsTheme = 'light' | 'dark'

const THEME_KEY = 'ms-theme'

function readTheme(): MsTheme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'dark' || t === 'light') return t
  } catch {
    // 저장소를 못 읽으면 기본(라이트)
  }
  return 'light'
}

/** 테마 버튼 — 레퍼런스 409–423행. html[data-ms-theme] 는 이 라우트가 마운트된 동안만 둔다. */
function ThemeButton() {
  const [theme, setTheme] = useState<MsTheme>(readTheme)

  // 페인트 전에 토큰이 붙어야 첫 프레임부터 색이 맞는다. 언마운트하면 속성을 지워 다른 라우트로 새지 않게 한다.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.msTheme = theme
    return () => {
      delete root.dataset.msTheme
    }
  }, [theme])

  const toggle = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const next: MsTheme = theme === 'dark' ? 'light' : 'dark'
    // 뷰 전환이 새 화면을 찍기 전에 DOM 이 바뀌어 있어야 하므로 동기로 커밋한다
    const apply = () => {
      flushSync(() => setTheme(next))
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // 저장 실패는 무시한다(이번 방문 동안만 유지)
      }
    }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (typeof document.startViewTransition !== 'function' || reduce) {
      apply()
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document
      .startViewTransition(apply)
      .ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
          {
            duration: 700,
            easing: 'cubic-bezier(.16,1,.3,1)',
            pseudoElement: '::view-transition-new(root)',
          }
        )
      })
      .catch(() => {})
  }

  return (
    <button
      className="theme"
      type="button"
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <mask id="ms-moon-mask">
          <rect x="-6" y="-6" width="36" height="36" fill="#fff" />
          <circle className="bite" cx="17" cy="7" r="7" fill="#000" />
        </mask>
        <circle
          className="core"
          cx="12"
          cy="12"
          r="8"
          fill="currentColor"
          mask="url(#ms-moon-mask)"
        />
        <g className="rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
          <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
          <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
          <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
        </g>
      </svg>
    </button>
  )
}

interface CalendarProps {
  days: DaySummary[]
  cur: string
  onPick: (date: string) => void
  ref: Ref<HTMLDivElement>
}

/** 달력 팝오버 — 레퍼런스 buildCal(604–619행). 열 때마다 새로 마운트돼 그 날짜의 달로 시작한다. */
function Calendar({ days, cur, onPick, ref }: CalendarProps) {
  const [month, setMonth] = useState(() => {
    const p = dateParts(cur)
    return { y: p.y, m: p.m }
  })
  const have = useMemo(() => new Set(days.map((d) => d.date)), [days])
  const cells = calendarCells(month.y, month.m, have, cur)
  const ym = `${month.y}-${String(month.m).padStart(2, '0')}`
  const firstK = days[0]?.date
  const lastK = days[days.length - 1]?.date

  const shift = (delta: -1 | 1) =>
    setMonth(({ y, m }) => {
      const n = m + delta
      if (n < 1) return { y: y - 1, m: 12 }
      if (n > 12) return { y: y + 1, m: 1 }
      return { y, m: n }
    })

  return (
    <div className="card cal" role="dialog" aria-label="날짜 선택" ref={ref}>
      <div className="hd">
        <button
          type="button"
          aria-label="이전 달"
          disabled={!firstK || firstK.slice(0, 7) >= ym}
          onClick={() => shift(-1)}
        >
          ‹
        </button>
        <span>{`${month.y}년 ${month.m}월`}</span>
        <button
          type="button"
          aria-label="다음 달"
          disabled={!lastK || lastK.slice(0, 7) <= ym}
          onClick={() => shift(1)}
        >
          ›
        </button>
      </div>
      <div className="wk">
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
      </div>
      <div className="days">
        {cells.map((c, i) => {
          const date = c.date
          // biome-ignore lint/suspicious/noArrayIndexKey: 빈칸은 내용이 없어 순번이 곧 정체성이다
          if (date === null) return <span key={`lead-${i}`} />
          const style: CssVars = { '--d': `${i * 14}ms`, '--dot': c.has ? 1 : 0 }
          return (
            <button
              key={date}
              type="button"
              className={c.on ? 'on' : undefined}
              style={style}
              disabled={!c.has}
              aria-label={`${month.m}월 ${c.day}일`}
              onClick={() => onPick(date)}
            >
              {c.day}
            </button>
          )
        })}
      </div>
      <p>점이 있는 날에 뉴스가 있어요.</p>
    </div>
  )
}

/** 로고 + 제목 + (뉴스만) 갱신 스탬프 */
function Brand({ stamp }: { stamp?: string }) {
  return (
    <div className="brand">
      <div className="logo" aria-hidden="true">
        <span>
          <i />
          <i />
          <i />
        </span>
      </div>
      <div>
        <h1>Morning Signal</h1>
        {stamp !== undefined && (
          <p>
            <i className="live" />
            <span>{stamp}</span>
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * 뉴스 | TO-DO 보기 전환 — 레퍼런스 .vsw(dashboard/morning-signal.html 230–235·287행). 두 화면 같은 모양.
 * 페이지를 오가는 링크라서 tablist 가 아니라 nav + aria-current 다(피드의 AI·시사·GitHub 탭과도 겹치지 않는다).
 */
export function ViewSwitch({ view }: { view: 'news' | 'todo' }) {
  const links = [
    { key: 'news', label: '뉴스', to: '/morning-signal' },
    { key: 'todo', label: 'TO-DO', to: '/morning-signal/todo' },
  ] as const
  return (
    <nav className="vsw" aria-label="보기 전환">
      {links.map((l) => (
        <Link
          key={l.key}
          to={l.to}
          aria-current={view === l.key ? 'page' : undefined}
          className={view === l.key ? 'on' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

/** TO-DO·PIN 화면 헤더 — 날짜 이동·스탬프 대신 (잠금이 풀렸을 때만) 자물쇠 버튼 */
export function TodoHeader({ onLock }: { onLock?: () => void }) {
  return (
    <header className="top">
      <Brand />
      <div className="mid">
        <ViewSwitch view="todo" />
        {onLock && (
          <button type="button" className="lockbtn" aria-label="다시 잠그기" onClick={onLock}>
            <svg width="17" height="17" viewBox="0 0 22 24" fill="none" aria-hidden="true">
              <rect
                x="2"
                y="10"
                width="18"
                height="12"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M6 10V7a5 5 0 0 1 10 0v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      <ThemeButton />
    </header>
  )
}

interface HeaderProps {
  days: DaySummary[]
  cur: string | null
  /** 직전 이동 방향: -1 과거로, 1 최근으로, 0 이동 아님(라벨 슬라이드 없음) */
  dir: number
  stamp: string
  onGo: (date: string) => void
}

/** 헤더 — 레퍼런스 281–310행(보기 전환 버튼 제외)·597–635행. */
export default function Header({ days, cur, dir, stamp, onGo }: HeaderProps) {
  const [calOpen, setCalOpen] = useState(false)
  const curBtnRef = useRef<HTMLButtonElement>(null)
  const calRef = useRef<HTMLDivElement>(null)

  // 날짜 버튼·달력 바깥을 누르거나 Escape 를 누르면 닫는다(레퍼런스는 둘만 stopPropagation)
  useEffect(() => {
    if (!calOpen) return
    const onClick = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Node)) return
      if (curBtnRef.current?.contains(t) || calRef.current?.contains(t)) return
      setCalOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCalOpen(false)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [calOpen])

  const i = cur ? days.findIndex((d) => d.date === cur) : -1
  const prev = i > 0 ? days[i - 1] : undefined
  const next = i >= 0 && i < days.length - 1 ? days[i + 1] : undefined
  const latest = i >= 0 && i === days.length - 1
  const slide = dir < 0 ? ' in-l' : dir > 0 ? ' in-r' : ''

  return (
    <header className="top">
      <Brand stamp={stamp} />
      <div className="mid">
        <ViewSwitch view="news" />
        <div className="datenav">
          <button
            type="button"
            aria-label="이전 날짜"
            disabled={!prev}
            onClick={() => prev && onGo(prev.date)}
          >
            ‹
          </button>
          <button
            type="button"
            className="cur"
            aria-haspopup="dialog"
            aria-expanded={calOpen}
            ref={curBtnRef}
            onClick={() => {
              if (cur) setCalOpen((o) => !o)
            }}
          >
            {/* key 로 다시 마운트해 이동할 때마다 슬라이드 애니메이션을 새로 건다(레퍼런스 updNav) */}
            <span key={cur ?? ''} className={`t${slide}`}>
              {cur ? labelEn(cur) : '—'}
            </span>
            {latest && <em>최신</em>}
          </button>
          <button
            type="button"
            aria-label="다음 날짜"
            disabled={!next}
            onClick={() => next && onGo(next.date)}
          >
            ›
          </button>
          {calOpen && cur && (
            <Calendar
              ref={calRef}
              days={days}
              cur={cur}
              onPick={(date) => {
                onGo(date)
                setCalOpen(false)
              }}
            />
          )}
        </div>
      </div>
      <ThemeButton />
    </header>
  )
}
