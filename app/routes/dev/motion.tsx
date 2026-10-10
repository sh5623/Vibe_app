import { motion, useReducedMotion, useSpring, type Variants } from 'framer-motion'
import { type CSSProperties, type ReactNode, useRef } from 'react'
import { EASE_OUT } from '@/components/Motion'

// CountUp·parseStat·EASE_OUT 은 소개 페이지와 함께 쓰므로 공용 모듈에 있다
export { CountUp, EASE_OUT, parseStat } from '@/components/Motion'

// ── 모션 토큰 — /dev 전 섹션이 같은 리듬을 쓴다 ─────────────────────────
export const VIEWPORT = { once: true, margin: '-80px' } as const
export const SPRING = { stiffness: 220, damping: 18, mass: 0.6 } as const

export const GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'

export const gradientText: CSSProperties = {
  background: GRADIENT,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

/**
 * custom 으로 지연(초)을 받는 fade-up. 히어로 타임라인처럼 개별 지연이 필요할 때 쓴다.
 * custom 이 없으면 delay 키를 아예 넣지 않는다 — 자식 transition 의 delay 는 부모 stagger
 * 지연을 덮어쓰므로, `delay: 0` 을 기본값으로 두면 staggerChildren 이 무력화된다.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay?: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, ...(delay === undefined ? {} : { delay }) },
  }),
}

/** 클립 마스크 안에서 아래로부터 올라오는 reveal. 부모에 overflow-clip 이 있어야 한다. */
export const maskUp: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.8, ease: EASE_OUT } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', ...SPRING } },
}

export function stagger(staggerChildren = 0.06, delayChildren = 0): Variants {
  return { hidden: {}, visible: { transition: { staggerChildren, delayChildren } } }
}

// ── 순수 함수 (motion.test.ts) ─────────────────────────────────────────
interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

const clampHalf = (n: number) => Math.min(0.5, Math.max(-0.5, n))

/** 포인터 위치 → 카드 3D 틸트 각도(도). 중심 0, 가장자리 ±max. */
export function tiltFromPointer(x: number, y: number, rect: RectLike, max: number) {
  if (rect.width === 0 || rect.height === 0) return { rotateX: 0, rotateY: 0 }
  const nx = clampHalf((x - rect.left) / rect.width - 0.5)
  const ny = clampHalf((y - rect.top) / rect.height - 0.5)
  // -0 을 0 으로 정규화(toEqual 이 -0 과 0 을 구분한다)
  return { rotateX: -ny * max * 2 + 0, rotateY: nx * max * 2 + 0 }
}

/**
 * 글자 단위로 쪼갠 그라디언트 텍스트가 한 덩어리처럼 보이게, 단어 폭만큼 늘린 배경에서
 * index 번째 조각을 잘라 쓴다. (transform 이 걸린 자식에는 부모의 background-clip:text 가
 * 적용되지 않으므로 글자마다 배경을 직접 칠해야 한다.)
 */
export function gradientSlice(index: number, total: number) {
  const position = total > 1 ? (index / (total - 1)) * 100 : 0
  return {
    backgroundSize: `${total * 100}% 100%`,
    backgroundPosition: `${position}% 50%`,
  }
}

// ── 공용 컴포넌트 ──────────────────────────────────────────────────────
interface SectionTitleProps {
  index: string
  title: string
}

/** About·Stack·Work 공통 섹션 제목 — 번호와 제목이 마스크 안에서 차례로 올라온다. */
export function SectionTitle({ index, title }: SectionTitleProps) {
  return (
    <motion.div
      className="flex items-baseline gap-6 mb-20 max-[768px]:mb-12 max-[768px]:flex-col max-[768px]:gap-2"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={stagger(0.12)}
    >
      <span className="overflow-clip shrink-0">
        <motion.span
          variants={maskUp}
          className="inline-block text-[0.75rem] tracking-[0.25em] font-semibold"
          style={{ fontFamily: 'var(--font-mono), monospace', ...gradientText }}
        >
          [ {index} ]
        </motion.span>
      </span>
      <h2 className="overflow-clip pb-[0.06em] text-[clamp(2.2rem,5.5vw,5rem)] font-extrabold tracking-[-0.025em] leading-[1] text-[#0f172a]">
        <motion.span variants={maskUp} className="block">
          {title}
        </motion.span>
      </h2>
    </motion.div>
  )
}

interface MagneticProps {
  children: ReactNode
  className?: string
  strength?: number
}

/** 마우스 커서 쪽으로 살짝 끌려오는 래퍼. 터치·reduced-motion 에서는 움직이지 않는다. */
export function Magnetic({ children, className = '', strength = 0.3 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, SPRING)
  const y = useSpring(0, SPRING)
  const reduceMotion = useReducedMotion()

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left - rect.width / 2) * strength)
    y.set((e.clientY - rect.top - rect.height / 2) * strength)
  }

  function handlePointerLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-flex ${className}`}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  )
}
