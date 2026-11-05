'use client'

// 원본은 'motion/react'·'@hugeicons/core-free-icons'를 쓴다 — 이 레포는 같은 API의 framer-motion 12가 있어 새 의존성 없이 바꿨다(설계 §4-10)
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import React, {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import './SpringCheck.css'

export type StrikeSide = 'left' | 'center' | 'right' | 'none'

export interface SpringCheckProps {
  label?: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  color?: string
  fillColor?: string
  checkColor?: string
  boxSize?: number
  boxRadius?: number
  fontSize?: number
  bounce?: number
  strikeLag?: number
  doneOpacity?: number
  strike?: StrikeSide
  ariaLabel?: string
  className?: string
}

const VISUAL_DURATION = 0.2
const RULE_END = 0.84
const SWELL = 0.35
const TICK_PATH = 'M5 14L8.5 17.5L19 6.5' // hugeicons Tick02Icon 의 경로
const ORIGIN: Record<StrikeSide, string> = {
  left: 'left center',
  center: 'center',
  right: 'right center',
  none: 'left center',
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const zetaOf = (bounce: number) =>
  bounce <= 0 ? 1 : -Math.log(bounce) / Math.sqrt(Math.PI ** 2 + Math.log(bounce) ** 2)

const readings = (t: number, doneOpacity: number, strikeLag: number) => {
  const held = clamp01(t)
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`,
  }
}

/**
 * (이 레포에서 추가) 체크박스 줄이 아닌 곳에 같은 스프링을 거는 함수 — 할 일 행이 DONE이 되는 순간에 쓴다.
 * 원본과 같은 스프링(bounce 0.2 · visualDuration 0.2s) 한 값으로 원 채움(.si-disc) · 부풂(.si) · 체크(.si-chk) · 제목 줄긋기(.trow-tt)를 움직이고,
 * 끝나면 인라인 값을 지워 CSS(.s-done)에 넘긴다. 줄에는 data-spring 을 잠시 붙인다(React 가 관리하지 않는 속성).
 */
export function springDone(
  rows: Iterable<Element>,
  { tickLength = 13 }: { tickLength?: number } = {}
) {
  const parts = [...rows].map((r) => ({
    r: r as HTMLElement,
    disc: r.querySelector<SVGElement>('.si-disc'),
    box: r.querySelector<SVGElement>('.si'),
    chk: r.querySelector<SVGElement>('.si-chk'),
    tt: r.querySelector<HTMLElement>('.trow-tt'),
  }))
  if (!parts.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const els = (x: (typeof parts)[number]) => [x.disc, x.box, x.chk, x.tt]
  const write = (t: number) => {
    const held = clamp01(t)
    const rule = clamp01((held - 0.12) / (RULE_END - 0.12))
    for (const x of parts) {
      if (x.disc)
        Object.assign(x.disc.style, { transition: 'none', transform: `scale(${Math.max(t, 0)})` })
      if (x.box)
        Object.assign(x.box.style, {
          transition: 'none',
          transformOrigin: 'center',
          transform: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
        })
      if (x.chk)
        Object.assign(x.chk.style, {
          transition: 'none',
          strokeDashoffset: String(tickLength * (1 - held)),
        })
      if (x.tt)
        Object.assign(x.tt.style, {
          transition: 'color 0.3s',
          backgroundSize: `${rule * 100}% 1.2px`,
        })
    }
  }
  const clear = () => {
    for (const x of parts) {
      delete x.r.dataset.spring
      for (const el of els(x)) el?.removeAttribute('style')
    }
  }
  for (const x of parts) x.r.dataset.spring = ''
  write(0)
  animate(0, 1, {
    type: 'spring',
    visualDuration: VISUAL_DURATION,
    bounce: 1 - zetaOf(0.2),
    onUpdate: write,
    onComplete: clear,
  })
}

const SpringCheck: React.FC<SpringCheckProps> = ({
  label = 'Ship the build',
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  color = '#ffffff',
  fillColor = '#ffffff',
  checkColor = '#0b0b0f',
  boxSize = 28,
  boxRadius = 9,
  fontSize = 18,
  bounce = 0.2,
  strikeLag = 0.12,
  doneOpacity = 0.42,
  strike = 'left',
  ariaLabel,
  className = '',
}) => {
  const controlled = checked !== undefined
  const [inner, setInner] = useState(defaultChecked)
  const on = controlled ? checked : inner
  const reduce = useReducedMotion()

  const t = useMotionValue(on ? 1 : 0)
  const viaPointer = useRef(false)
  const instant = useRef(false)
  const rowRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const tickRef = useRef<SVGPathElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)
  const ruleRef = useRef<HTMLSpanElement>(null)
  const cfg = useRef({ doneOpacity, strikeLag })
  cfg.current = { doneOpacity, strikeLag }

  const write = (value: number) => {
    const r = readings(value, cfg.current.doneOpacity, cfg.current.strikeLag)
    if (fillRef.current) fillRef.current.style.transform = r.fill
    if (boxRef.current) boxRef.current.style.transform = r.box
    if (tickRef.current) tickRef.current.style.strokeDashoffset = String(r.tick)
    if (wordRef.current) wordRef.current.style.opacity = String(r.word)
    if (ruleRef.current) ruleRef.current.style.transform = r.rule
  }
  useMotionValueEvent(t, 'change', write)
  useLayoutEffect(() => {
    write(t.get())
  })

  useEffect(() => {
    const target = on ? 1 : 0
    if (reduce || instant.current) {
      instant.current = false
      t.jump(target)
      return undefined
    }
    if (t.get() === target && t.getVelocity() === 0) return undefined
    const controls = animate(t, target, {
      type: 'spring',
      visualDuration: VISUAL_DURATION,
      bounce: 1 - zetaOf(bounce),
    })
    return () => controls.stop()
  }, [on, reduce, bounce, t])

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || disabled) return
    viaPointer.current = true
    if (!reduce && rowRef.current) rowRef.current.dataset.pressed = ''
  }
  const handlePointerUp = () => {
    if (rowRef.current) delete rowRef.current.dataset.pressed
  }
  const handlePointerCancel = () => {
    viaPointer.current = false
    handlePointerUp()
  }
  const toggle = () => {
    if (disabled) return
    instant.current = !viaPointer.current
    viaPointer.current = false
    const next = !on
    if (!controlled) setInner(next)
    onChange?.(next)
  }

  const r = readings(t.get(), doneOpacity, strikeLag)
  const ring = boxSize >= 24 ? 2 : 1.5
  const gap = Math.min(16, Math.max(8, Math.round(boxSize * 0.43)))
  const ruleHeight = Math.max(1.5, Math.round(fontSize / 6) / 2)

  const cssVars = {
    '--sc-ink': color,
    '--sc-fill': fillColor,
    '--sc-check': checkColor,
    '--sc-box': `${boxSize}px`,
    '--sc-radius': `${boxRadius}px`,
    '--sc-font': `${fontSize}px`,
    '--sc-ring': `${ring}px`,
    '--sc-gap': `${gap}px`,
    '--sc-row': `${Math.max(44, boxSize + 16)}px`,
    '--sc-rule': `${ruleHeight}px`,
    '--sc-origin': ORIGIN[strike] || ORIGIN.left,
  } as CSSProperties

  return (
    <button
      ref={rowRef}
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`spring-check${className ? ` ${className}` : ''}`}
      style={cssVars}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onClick={toggle}
    >
      <span className="spring-check__press">
        <span ref={boxRef} className="spring-check__box" style={{ transform: r.box }}>
          <span className="spring-check__ring" aria-hidden="true" />
          <span ref={fillRef} className="spring-check__fill" style={{ transform: r.fill }} />
          <svg className="spring-check__tick" viewBox="0 0 24 24" aria-hidden="true">
            <path
              ref={tickRef}
              d={TICK_PATH}
              pathLength={1}
              strokeDasharray={1}
              style={{ strokeDashoffset: r.tick }}
            />
          </svg>
        </span>
      </span>
      <span className="spring-check__label">
        <span ref={wordRef} className="spring-check__word" style={{ opacity: r.word }}>
          {label}
        </span>
        {strike !== 'none' ? (
          <span
            ref={ruleRef}
            className="spring-check__rule"
            aria-hidden="true"
            style={{ transform: r.rule }}
          />
        ) : null}
      </span>
    </button>
  )
}

export default SpringCheck
