import {
  type CSSProperties,
  type Ref,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { DaySummary } from '../../../api/morning-signal'
import { calendarCells, dateParts, labelKo } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string | number>
/** html[data-ms-theme] 를 이 라우트가 마운트된 동안만 둔다 — 늘 light(밝은 화면 고정). Shell 이 부른다(페인트 전에 토큰이 붙어야 첫 프레임부터 색이 맞는다). */
export function useMsThemeAttr() {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.msTheme = 'light'
    return () => {
      delete root.dataset.msTheme
    }
  }, [])
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
        <span>토</span>
        <span>일</span>
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

interface DateNavProps {
  days: DaySummary[]
  cur: string | null
  /** 직전 이동 방향: -1 과거로, 1 최근으로, 0 이동 아님(넘김 없음) */
  dir: number
  onGo: (date: string) => void
}

/** 날짜 이동(‹ 날짜 › + 달력) — 상단 막대 오른쪽 칸(.top-slot)에 포털로 들어간다. */
export function DateNav({ days, cur, onGo }: DateNavProps) {
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

  return (
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
        <span className="t">{cur ? labelKo(cur) : '—'}</span>
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
  )
}
