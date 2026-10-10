import {
  AnimatePresence,
  animate,
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion'
import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

/**
 * 소개 페이지(/fe-rail · /self-improvement · /parallel-worktree · /e2e-rail)와 /dev 가 함께 쓰는 모션 헬퍼.
 * 페이지 고유 variants 는 각 페이지에 두고, 여기에는 동작이 같은 것만 둔다.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/**
 * 페이지 루트에 감싼다. framer 애니메이션은 OS 의 모션 최소화 설정을 따르고,
 * 페이지 루트 요소에 `motion-scope` 클래스를 주면 globals.css 가 CSS keyframe 도 멈춘다.
 */
export function PageMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

// ── 숫자 카운트업 ───────────────────────────────────────────────────────
export interface Stat {
  value: number
  suffix: string
}

export function parseStat(raw: string): Stat | null {
  const match = /^(\d+)(.*)$/.exec(raw)
  if (!match?.[1]) return null
  return { value: Number(match[1]), suffix: match[2] ?? '' }
}

/**
 * 뷰포트에 들어오면 0 → 값으로 카운트업. 모션 최소화에서는 최종값을 그대로 보여 주고,
 * 숫자로 시작하지 않는 값('~30분', 'FE')은 애니메이션 없이 출력한다.
 * SPA(라우트는 브라우저에서만 렌더)라 첫 렌더부터 0 으로 시작한다 — 최종값을 먼저 그렸다가 0 으로
 * 되돌리면 첫 화면에 있는 숫자가 한 번 깜빡인다.
 */
export function CountUp({ value, duration = 1.4 }: { value: string; duration?: number }) {
  const stat = parseStat(value)
  const target = stat?.value
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduceMotion = useReducedMotion()
  const [current, setCurrent] = useState(reduceMotion ? target : 0)

  useEffect(() => {
    if (target === undefined || !inView) return
    if (reduceMotion) {
      setCurrent(target)
      return
    }
    const controls = animate(0, target, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setCurrent(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduceMotion, target, duration])

  if (!stat) return <span ref={ref}>{value}</span>
  return (
    <span ref={ref}>
      <span aria-hidden="true">
        {current}
        {stat.suffix}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  )
}

// ── 터미널 타이핑 ───────────────────────────────────────────────────────
export interface TypePos {
  line: number
  char: number
}

/** 다음 타이핑 위치. lengths[i] 는 문자열 줄의 글자 수, 노드 줄은 null(한 번에 나타난다). */
export function nextTypePos(lengths: readonly (number | null)[], pos: TypePos): TypePos {
  if (pos.line >= lengths.length) return pos
  const length = lengths[pos.line]
  if (typeof length === 'number' && pos.char < length) return { line: pos.line, char: pos.char + 1 }
  return { line: pos.line + 1, char: 0 }
}

interface TypeLinesProps {
  /** 줄 목록. 문자열 줄은 한 글자씩 타이핑되고, JSX 줄(구문 강조 등)은 한 번에 나타난다. */
  lines: readonly ReactNode[]
  className?: string
  /** 글자 간격(ms) */
  charMs?: number
  /** 줄 사이 간격(ms) */
  lineGapMs?: number
  /** true 면 다 친 뒤 holdMs 만큼 멈췄다가 처음부터 다시 친다 */
  loop?: boolean
  holdMs?: number
  /** 커서 색 등 */
  caretClassName?: string
}

/**
 * 뷰포트에 들어오면 줄을 차례로 타이핑한다. `<pre>` 안에 넣을 수 있게 전부 span 으로 렌더한다.
 * 아직 안 나온 줄은 visibility:hidden 으로 자리를 잡아 두므로 레이아웃이 밀리지 않고,
 * 모션 최소화에서는 처음부터 전부 보여 준다.
 * visibility:hidden 은 스크린리더에서도 숨겨지므로, 움직이는 사본은 aria-hidden 으로 두고
 * 전체 텍스트를 sr-only 로 처음부터 함께 렌더한다(타이핑 중·뷰포트 밖에서도 내용을 놓치지 않게).
 */
export function TypeLines({
  lines,
  className = '',
  charMs = 26,
  lineGapMs = 170,
  loop = false,
  holdMs = 2600,
  caretClassName = 'bg-current',
}: TypeLinesProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: !loop, margin: '-60px' })
  const reduceMotion = useReducedMotion()
  const [pos, setPos] = useState<TypePos>({ line: 0, char: 0 })

  const lengths = lines.map((line) => (typeof line === 'string' ? line.length : null))
  const lengthKey = lengths.join(',')
  const done = pos.line >= lines.length

  useEffect(() => {
    if (reduceMotion || !inView) return
    const parsed = lengthKey.split(',').map((n) => (n === '' ? null : Number(n)))
    if (pos.line >= parsed.length) {
      if (!loop) return
      const timer = setTimeout(() => setPos({ line: 0, char: 0 }), holdMs)
      return () => clearTimeout(timer)
    }
    const length = parsed[pos.line]
    const typingChars = typeof length === 'number' && pos.char < length
    const timer = setTimeout(
      () => setPos((p) => nextTypePos(parsed, p)),
      typingChars ? charMs : lineGapMs
    )
    return () => clearTimeout(timer)
  }, [reduceMotion, inView, pos, lengthKey, loop, holdMs, charMs, lineGapMs])

  return (
    <span ref={ref} className={`block ${className}`}>
      <span className="sr-only">
        {lines.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 정적 줄 목록의 스크린리더 사본 — 위치가 곧 정체성
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="block">
        {renderAnimatedLines()}
      </span>
    </span>
  )

  function renderAnimatedLines() {
    return lines.map((line, i) => {
      const shown = reduceMotion || done || i < pos.line
      const typing = !shown && i === pos.line
      const key = typeof line === 'string' ? `${i}:${line}` : i
      if (shown) {
        return (
          <motion.span
            key={key}
            className="block"
            initial={reduceMotion ? false : { opacity: typeof line === 'string' ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {line}
          </motion.span>
        )
      }
      if (typing && typeof line === 'string') {
        return (
          <span key={key} className="block">
            {line.slice(0, pos.char)}
            <span
              aria-hidden="true"
              className={`inline-block w-[0.55em] h-[1.1em] -mb-[0.2em] animate-[blink_1s_step-end_infinite] ${caretClassName}`}
            />
            <span className="invisible">{line.slice(pos.char)}</span>
          </span>
        )
      }
      return (
        <span key={key} className="block invisible">
          {line}
        </span>
      )
    })
  }
}

// ── 아코디언 높이 ───────────────────────────────────────────────────────
type CollapseProps = { open: boolean; children: ReactNode } & Omit<
  ComponentProps<typeof motion.div>,
  'children' | 'initial' | 'animate' | 'exit'
>

/** FAQ 답변 등 — 열고 닫을 때 높이가 부드럽게 바뀐다. id·role 등 나머지 props 는 그대로 전달. */
export function Collapse({ open, children, className = '', ...rest }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          {...rest}
          className={`overflow-hidden ${className}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── 순환 강조 ───────────────────────────────────────────────────────────
/**
 * 0 → count-1 을 intervalMs 마다 순환하는 인덱스. ref 요소가 화면에 있을 때만 돈다.
 * 화면 밖이거나 모션 최소화면 null — 호출부는 null 을 「강조 없음」으로 그린다.
 * 화면을 벗어나면 0 으로 되돌려, 다시 들어올 때 첫 단계부터 시작한다.
 */
export function useCycle(
  count: number,
  intervalMs: number,
  ref: RefObject<Element | null>
): number | null {
  const inView = useInView(ref, { amount: 0.3 })
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!inView) {
      setIndex(0)
      return
    }
    if (reduceMotion || count <= 1) return
    const timer = setInterval(() => setIndex((n) => (n + 1) % count), intervalMs)
    return () => clearInterval(timer)
  }, [inView, reduceMotion, count, intervalMs])

  return inView && !reduceMotion ? index : null
}
