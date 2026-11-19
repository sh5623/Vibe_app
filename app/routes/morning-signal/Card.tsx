import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from 'react'

type CssVars = CSSProperties & Record<`--${string}`, string | number>

/**
 * 눈금 막대 — 한 칸이 한 건. parts = [칸 수, 색] 목록(시안 news.js MSU.ticks).
 * 카드가 처음 화면에 들어오면(.in) 칸마다 26ms 간격으로 켜진다.
 */
export function Ticks({ parts }: { parts: readonly (readonly [number, string])[] }) {
  const cells: ReactNode[] = []
  for (const [count, color] of parts) {
    for (let k = 0; k < count; k++) {
      const n = cells.length
      const style: CssVars = { '--c': color, '--i': n }
      cells.push(<i key={n} style={style} />)
    }
  }
  return (
    <div className="ticks" aria-hidden="true">
      {cells}
    </div>
  )
}

/**
 * 카드가 화면에 들어와 있는 동안 `.live`(FE 높음 칩 고리 재생)를 붙이고, 처음 들어올 때 한 번 `.in`(눈금 켜짐)을 붙인다.
 * 시안 app.js 의 IntersectionObserver(threshold 0.15)와 같다. 옵저버가 없는 환경이면 둘 다 바로 붙인다.
 */
export function useLive(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in', 'live')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          en.target.classList.toggle('live', en.isIntersecting)
          if (en.isIntersecting) en.target.classList.add('in')
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
}

/** 카드 위 커서 빛 위치(시안 app.js pointermove) — 마우스일 때만, 빛 자체는 CSS 가 정밀 포인터에서만 그린다 */
function onGlow(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - r.left}px`)
  el.style.setProperty('--my', `${e.clientY - r.top}px`)
}

interface CardProps {
  /** 격자 칸 이름(grid-area) — alert · head · mix · feed · trend */
  area: string
  title: string
  /** 제목 줄 오른쪽(건수 · 탭 등) */
  aux?: ReactNode
  className?: string
  children: ReactNode
}

/** NEWS 카드 — 시안 grid.css 의 `.p` + 제목 줄 `.ph`(높이 36 고정이라 오른쪽에 무엇이 와도 제목 자리가 같다) */
export default function Card({ area, title, aux, className, children }: CardProps) {
  const ref = useRef<HTMLElement>(null)
  const id = useId()
  useLive(ref)
  return (
    <section
      ref={ref}
      className={className ? `p ${className}` : 'p'}
      style={{ gridArea: area }}
      data-area={area}
      aria-labelledby={id}
      onPointerMove={onGlow}
    >
      <div className="ph">
        <h2 id={id}>{title}</h2>
        {aux}
      </div>
      {children}
    </section>
  )
}
