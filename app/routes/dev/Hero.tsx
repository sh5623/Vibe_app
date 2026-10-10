import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import { Keyboard as KeyboardIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Keyboard from './Keyboard'
import {
  EASE_OUT,
  fadeUp,
  GRADIENT,
  gradientSlice,
  Magnetic,
  SPRING,
  tiltFromPointer,
} from './motion'
import { type KeyId, keyFromCode, useTypingScript } from './typing-script'

const NAME = 'SEUNGHO LEE'
// 화면 줄바꿈은 기존 정체성(SEUNG / HO LEE)을 유지한다 — 타이핑 순서는 NAME 그대로
const NAME_LINES = [
  { start: 0, end: 5, gradient: true },
  { start: 5, end: NAME.length, gradient: false },
] as const
const ROLES = [
  'Frontend Developer',
  'React / Next.js Developer',
  'Vue.js / Nuxt.js Developer',
] as const

// 키가 눌리면 글자가 위에서 흐릿하게 떨어져 착지한다
const letterIn: Variants = {
  hidden: { opacity: 0, y: '-0.4em', scale: 1.5, filter: 'blur(12px)' },
  shown: {
    opacity: 1,
    y: '0em',
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      default: { type: 'spring', stiffness: 520, damping: 26 },
      opacity: { duration: 0.15 },
      filter: { duration: 0.28 },
    },
  },
}

const ctaStyle = {
  fontFamily: 'var(--font-mono), monospace',
  fontSize: '0.8rem',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
} as const

function Caret({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-[0.1em] h-[0.8em] w-[0.07em] bg-linear-to-b from-[#4f46e5] to-[#06b6d4] animate-[blink_1s_step-end_infinite] ${className}`}
    />
  )
}

interface LetterProps {
  char: string
  /** 줄 안에서의 위치 — 물결 위상과 그라디언트 조각 계산용 */
  slot: number
  lineLength: number
  gradient: boolean
  visible: boolean
  caretAfter: boolean
  pulseId: number
  hit: boolean
}

/**
 * 글자 한 개 = 세 층. transform 을 쓰는 주체가 셋이라 층을 나눠야 서로 덮어쓰지 않는다:
 * 바깥(착지, framer) → 가운데(물결, CSS keyframe) → 안쪽(키 입력 반응, framer).
 */
function Letter({
  char,
  slot,
  lineLength,
  gradient,
  visible,
  caretAfter,
  pulseId,
  hit,
}: LetterProps) {
  const controls = useAnimationControls()
  const lastPulse = useRef(pulseId)

  useEffect(() => {
    if (pulseId === lastPulse.current) return
    lastPulse.current = pulseId
    if (!hit) return
    controls.start({
      y: ['0em', '-0.16em', '0em'],
      scale: [1, 1.08, 1],
      ...(gradient
        ? {}
        : { color: ['rgba(79,70,229,0)', 'rgba(79,70,229,0.85)', 'rgba(79,70,229,0)'] }),
      transition: { duration: 0.45, ease: EASE_OUT },
    })
  }, [pulseId, hit, gradient, controls])

  const glyphStyle = gradient
    ? {
        backgroundImage: GRADIENT,
        ...gradientSlice(slot, lineLength),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : { WebkitTextStroke: '2px rgba(79,70,229,0.3)', color: 'rgba(79,70,229,0)' }

  return (
    <motion.span
      className="relative inline-block"
      initial={false}
      animate={visible ? 'shown' : 'hidden'}
      variants={letterIn}
    >
      <span
        className="inline-block animate-[letterWave_4.2s_ease-in-out_infinite]"
        style={{ animationDelay: `${-slot * 0.22}s` }}
      >
        <motion.span className="inline-block" animate={controls} style={glyphStyle}>
          {char === ' ' ? ' ' : char}
        </motion.span>
      </span>
      {caretAfter && <Caret className="left-full ml-[0.04em]" />}
    </motion.span>
  )
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  // 히어로가 화면 밖이면 타이핑을 멈춘다(다른 섹션을 읽는 동안 초당 10여 회 리렌더를 하지 않게)
  const inView = useInView(sectionRef, { amount: 0.2 })
  const typing = useTypingScript(NAME, ROLES, { running: inView, reduced: reduceMotion })

  // 방문자가 실제로 누르는 키 — 화면 키보드에 그대로 비친다
  const [heldKeys, setHeldKeys] = useState<KeyId[]>([])
  const [userPressId, setUserPressId] = useState(0)
  // 이름 글자 반응 신호 — 이름 확정 뒤의 자동 타이핑 + 방문자 입력
  const [pulse, setPulse] = useState<{ keys: readonly KeyId[]; id: number }>({ keys: [], id: 0 })

  useEffect(() => {
    if (!typing.committed || typing.pressed.length === 0) return
    setPulse((p) => ({ keys: typing.pressed, id: p.id + 1 }))
  }, [typing.committed, typing.pressed])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = keyFromCode(e.code)
      if (!key) return
      setHeldKeys((keys) => (keys.includes(key) ? keys : [...keys, key]))
      if (e.repeat) return
      setUserPressId((n) => n + 1)
      setPulse((p) => ({ keys: [key], id: p.id + 1 }))
    }
    function handleKeyUp(e: KeyboardEvent) {
      const key = keyFromCode(e.code)
      if (key) setHeldKeys((keys) => keys.filter((k) => k !== key))
    }
    // 창을 벗어나면 keyup 을 못 받으므로 눌림 상태를 비운다
    function handleBlur() {
      setHeldKeys([])
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // 이름 확정(ENTER) 순간 이름 전체가 한 번 빛난다
  const nameControls = useAnimationControls()
  useEffect(() => {
    if (!typing.committed || reduceMotion) return
    nameControls.start({
      filter: [
        'drop-shadow(0 0 0px rgba(79,70,229,0))',
        'drop-shadow(0 0 28px rgba(79,70,229,0.55))',
        'drop-shadow(0 0 0px rgba(79,70,229,0))',
      ],
      scale: [1, 1.02, 1],
      transition: { duration: 0.9, ease: EASE_OUT },
    })
  }, [typing.committed, reduceMotion, nameControls])

  // 스크롤 패럴랙스 — 두 orb 가 서로 반대 방향으로 흘러간다
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const orbTopY = useTransform(scrollYProgress, [0, 1], [0, 180])
  const orbBottomY = useTransform(scrollYProgress, [0, 1], [0, -110])

  // 키보드 3D 틸트 — 히어로 위 마우스 위치를 따라간다
  const tiltX = useSpring(0, SPRING)
  const tiltY = useSpring(0, SPRING)

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    const tilt = tiltFromPointer(e.clientX, e.clientY, rect, 9)
    tiltX.set(tilt.rotateX)
    tiltY.set(tilt.rotateY)
  }

  function handlePointerLeave() {
    tiltX.set(0)
    tiltY.set(0)
  }

  const pressedKeys = [...typing.pressed, ...heldKeys]
  const typingCaretIndex = typing.committed ? -1 : typing.nameCount - 1

  return (
    <section
      ref={sectionRef}
      id="hero"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="min-h-screen grid grid-cols-[1.08fr_0.92fr] items-center gap-10 px-12 pt-28 pb-24 relative overflow-hidden max-[1100px]:grid-cols-1 max-[1100px]:content-center max-[768px]:px-6 max-[768px]:pt-24 max-[768px]:pb-16"
    >
      {/* Orbs — 바깥은 스크롤 패럴랙스(framer), 안쪽은 떠다니기(CSS keyframe) */}
      <motion.div
        aria-hidden="true"
        className="absolute w-[700px] h-[700px] pointer-events-none top-[-200px] right-[-150px] max-[768px]:w-[380px] max-[768px]:h-[380px] max-[768px]:top-[-100px] max-[768px]:right-[-80px]"
        style={{ y: orbTopY }}
      >
        <div
          className="size-full rounded-full animate-[orbFloat_9s_ease-in-out_infinite]"
          style={{
            background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)',
          }}
        />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="absolute w-[500px] h-[500px] pointer-events-none bottom-[-80px] left-[-80px] max-[768px]:w-[280px] max-[768px]:h-[280px]"
        style={{ y: orbBottomY }}
      >
        <div
          className="size-full rounded-full animate-[orbFloat_13s_ease-in-out_infinite_reverse]"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
          }}
        />
      </motion.div>

      <div className="relative z-[1] flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="inline-flex items-center gap-[0.6rem] text-[0.72rem] text-[#64748b] tracking-[0.1em] mb-8 bg-white/85 border border-[rgba(79,70,229,0.12)] rounded-[100px] py-[0.4rem] pl-[0.65rem] pr-4 w-fit backdrop-blur-[10px]"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0 animate-[dotGlow_2.2s_ease-in-out_infinite]" />
          Available for work
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.08}
          className="text-[0.75rem] tracking-[0.3em] text-[#4f46e5] uppercase mb-5"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          Portfolio
        </motion.div>

        {/* 이름 — 화면 키보드가 한 글자씩 쳐서 찍는다. 스크린리더에는 aria-label 한 번만 읽힌다 */}
        <motion.h1
          aria-label={NAME}
          animate={nameControls}
          className="text-[clamp(3rem,17vw,9rem)] min-[1100px]:text-[clamp(4.5rem,9.6vw,11rem)] font-extrabold leading-[0.95] tracking-[-0.03em] mb-8 origin-left"
        >
          {NAME_LINES.map((line, lineIndex) => {
            const chars = [...NAME.slice(line.start, line.end)]
            return (
              <span
                key={line.start}
                aria-hidden="true"
                className="relative block whitespace-nowrap pb-[0.04em]"
              >
                {lineIndex === 0 && typing.nameCount === 0 && !typing.committed && (
                  <Caret className="left-0" />
                )}
                {chars.map((char, slot) => {
                  const index = line.start + slot
                  return (
                    <Letter
                      // biome-ignore lint/suspicious/noArrayIndexKey: static name split into characters — position IS identity
                      key={slot}
                      char={char}
                      slot={slot}
                      lineLength={chars.length}
                      gradient={line.gradient}
                      visible={index < typing.nameCount}
                      caretAfter={index === typingCaretIndex}
                      pulseId={pulse.id}
                      hit={char !== ' ' && pulse.keys.includes(char)}
                    />
                  )
                })}
              </span>
            )
          })}
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.4}
          aria-hidden="true"
          className="text-[clamp(0.95rem,1.6vw,1.25rem)] text-[#64748b] mb-12 min-h-[2em] flex items-center"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          <span className="text-[#4f46e5] mr-3">&gt;</span>
          {typing.role}
          {typing.committed && (
            <span className="inline-block w-[0.55em] h-[1.15em] bg-[#4f46e5]/80 ml-[3px] align-middle animate-[blink_1s_step-end_infinite] shrink-0" />
          )}
        </motion.div>
        <p className="sr-only">{ROLES.join(' · ')}</p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.5}
          className="flex gap-4 flex-wrap"
        >
          <Magnetic className="max-[480px]:flex-1">
            <a
              href="#work"
              className="inline-flex items-center gap-2 py-[0.9rem] px-[2.25rem] bg-linear-to-br from-[#4f46e5] to-[#6d28d9] text-white no-underline rounded-[10px] transition-all duration-[250ms] shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:-translate-y-[3px] hover:shadow-[0_10px_32px_rgba(79,70,229,0.45)] max-[480px]:flex-1 max-[480px]:justify-center max-[480px]:px-4 whitespace-nowrap"
              style={ctaStyle}
            >
              View Projects
            </a>
          </Magnetic>
          <Magnetic className="max-[480px]:flex-1">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 py-[0.9rem] px-[2.25rem] bg-white/90 text-[#4f46e5] border-[1.5px] border-[rgba(79,70,229,0.2)] no-underline rounded-[10px] transition-all duration-[250ms] backdrop-blur-[10px] hover:border-[#4f46e5] hover:bg-[rgba(79,70,229,0.06)] hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(79,70,229,0.12)] max-[480px]:flex-1 max-[480px]:justify-center max-[480px]:px-4 whitespace-nowrap"
              style={ctaStyle}
            >
              Get in Touch
            </a>
          </Magnetic>
        </motion.div>
      </div>

      {/* 키보드 — 바깥 래퍼의 opacity 는 3D 사슬 밖이라 키 깊이를 평평하게 만들지 않는다 */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.3}
        className="relative z-[1] flex flex-col items-center max-[1100px]:mt-4"
      >
        <Keyboard
          pressed={pressedKeys}
          pressId={typing.pressId + userPressId}
          tiltX={tiltX}
          tiltY={tiltY}
        />
        <p
          aria-hidden="true"
          className="mt-12 text-[0.65rem] tracking-[0.3em] uppercase text-[#94a3b8] pointer-coarse:hidden max-[1100px]:mt-8"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          <KeyboardIcon size={13} className="inline-block mr-2 -mt-px align-middle" />
          try typing
        </p>
      </motion.div>

      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[0.65rem] text-[#94a3b8] tracking-[0.25em] uppercase after:content-[''] after:w-px after:h-10 after:bg-linear-to-b after:from-[#4f46e5] after:to-transparent animate-[slideIn_0.8s_ease_0.6s_both] max-[1100px]:hidden"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        Scroll
      </div>
    </section>
  )
}
