import { useLayoutEffect, useRef } from 'react'

interface OdometerProps {
  value: number
  id?: string
  /** 루트 태그 — 레퍼런스 도넛 가운데 숫자는 `<b class="odo">` 다(`.ctr b` 글꼴 규칙이 같은 요소에 걸려야 한다) */
  as?: 'span' | 'b'
}

// 자리마다 0–9 를 두 번 쌓은 릴 — 기준점을 10 과 0 사이로 번갈아 옮겨 같은 값이라도 한 바퀴 굴러간다
const REEL = Array.from({ length: 20 }, (_, n) => ({ key: `n${n}`, digit: n % 10 }))

/**
 * 숫자 롤링 — 레퍼런스 odo()(397–406행).
 * 부모가 새 데이터로 다시 그릴 때마다(=이 컴포넌트가 다시 렌더될 때마다) 굴러간다.
 * 그래서 부모(Kpis·Bento)는 데이터가 바뀔 때만 렌더되도록 memo 로 감싼다.
 */
export default function Odometer(props: OdometerProps) {
  const s = String(Math.max(0, Math.round(props.value)))
  const ref = useRef<HTMLElement>(null)
  const flip = useRef(false)
  const seen = useRef<OdometerProps | null>(null)

  // 의존성 없이 커밋마다 돈다. props 객체가 새것일 때만 기준점을 뒤집는다 —
  // StrictMode 가 마운트 효과를 두 번 돌려도(같은 props) 한 번만 뒤집힌다.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (seen.current !== props) {
      seen.current = props
      flip.current = !flip.current
    }
    const base = flip.current ? 10 : 0
    // 자리 수가 바뀌어 새로 만든 릴은 0 에서 출발해야 한다(레퍼런스 void el.offsetWidth)
    el.getBoundingClientRect()
    Array.from(el.children).forEach((d, i) => {
      const reel = d.firstElementChild
      if (!(reel instanceof HTMLElement)) return
      reel.style.transitionDelay = `${i * 80}ms`
      reel.style.transform = `translateY(${-(base + Number(s[i] ?? 0)) * 5}%)`
    })
  })

  const digits = Array.from(s, (_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: 자리는 위치가 곧 정체성이다. 자리 수가 바뀌면 키가 모두 바뀌어 레퍼런스처럼 릴을 새로 만든다
    <span className="d" key={`${s.length}-${i}`}>
      <span className="reel">
        {REEL.map((r) => (
          <i key={r.key}>{r.digit}</i>
        ))}
      </span>
    </span>
  ))
  return props.as === 'b' ? (
    <b className="odo" id={props.id} data-value={s} ref={ref}>
      {digits}
    </b>
  ) : (
    <span className="odo" id={props.id} data-value={s} ref={ref}>
      {digits}
    </span>
  )
}
