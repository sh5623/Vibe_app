import { type MotionValue, motion } from 'framer-motion'
import type { KeyId } from './typing-script'

interface KeyDef {
  id: KeyId
  label: string
  /** 키 폭(키 단위 u). 기본 1 */
  w?: number
  /** 기능키 — 라벨을 작게, 색을 옅게 */
  mod?: boolean
}

const letters = (row: string): KeyDef[] => [...row].map((c) => ({ id: c, label: c }))

// 행마다 합계 12u — 계단식 배열이 실제 키보드처럼 맞물린다
const ROWS: KeyDef[][] = [
  [...letters('QWERTYUIOP'), { id: 'BACKSPACE', label: '⌫', w: 2, mod: true }],
  [
    { id: 'CAPS', label: '⇪', mod: true },
    ...letters('ASDFGHJKL'),
    { id: 'ENTER', label: 'return', w: 2, mod: true },
  ],
  [{ id: 'SHIFT', label: '⇧ shift', w: 2, mod: true }, ...letters('ZXCVBNM,./')],
  [
    { id: 'FN', label: 'fn', mod: true },
    { id: 'CTRL', label: '⌃', mod: true },
    { id: 'ALT', label: '⌥', mod: true },
    { id: 'META', label: '⌘', w: 1.5, mod: true },
    { id: 'SPACE', label: '', w: 5 },
    { id: 'META_R', label: '⌘', w: 1.5, mod: true },
    { id: 'ALT_R', label: '⌥', mod: true },
  ],
]

interface KeyProps {
  def: KeyDef
  isPressed: boolean
  pressId: number
}

function Key({ def, isPressed, pressId }: KeyProps) {
  const w = def.w ?? 1
  return (
    <motion.div
      className="relative shrink-0 [transform-style:preserve-3d]"
      style={{ width: `calc(var(--u) * ${w} + var(--g) * ${w - 1})`, height: 'var(--u)' }}
      animate={{ z: isPressed ? 1 : 9 }}
      transition={{ type: 'spring', stiffness: 1100, damping: 32 }}
    >
      <div
        className={`size-full grid place-items-center rounded-[calc(var(--u)*0.2)] border transition-[background,box-shadow,color,translate,border-color] duration-100 ${
          isPressed
            ? 'translate-y-[calc(var(--u)*0.08)] border-transparent bg-linear-135 from-[#4f46e5] to-[#06b6d4] text-white shadow-[0_calc(var(--u)*0.04)_0_#3730a3,0_0_calc(var(--u)*0.7)_rgba(79,70,229,0.6)]'
            : `border-[rgba(79,70,229,0.14)] bg-linear-160 from-white to-[#eef2ff] shadow-[0_calc(var(--u)*0.14)_0_#c7d2fe,0_calc(var(--u)*0.32)_calc(var(--u)*0.45)_rgba(79,70,229,0.16)] ${
                def.mod ? 'text-[#94a3b8]' : 'text-[#475569]'
              }`
        }`}
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: def.mod ? 'calc(var(--u) * 0.26)' : 'calc(var(--u) * 0.36)',
          fontWeight: 600,
        }}
      >
        {def.label}
      </div>
      {/* 눌린 글자의 잔상이 키 위로 솟아오른다(pressId 로 매번 다시 마운트) */}
      {isPressed && !def.mod && def.label && (
        <motion.span
          key={pressId}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid place-items-center font-extrabold text-[#4f46e5]"
          style={{ fontSize: 'calc(var(--u) * 0.6)' }}
          initial={{ z: 14, opacity: 0 }}
          animate={{ z: [14, 48, 120], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], times: [0, 0.25, 1] }}
        >
          {def.label}
        </motion.span>
      )}
    </motion.div>
  )
}

interface KeyboardProps {
  pressed: readonly KeyId[]
  pressId: number
  tiltX: MotionValue<number>
  tiltY: MotionValue<number>
}

/**
 * CSS 3D 키보드. 층을 나눠 transform 이 서로 덮어쓰지 않게 한다:
 * 바깥(perspective) → 포인터 틸트(framer) → 떠다니기(CSS keyframe) → 판(고정 기울기) → 키(translateZ).
 * opacity·overflow 는 3D 를 평평하게 만드므로 preserve-3d 사슬 안에 두지 않는다.
 */
export default function Keyboard({ pressed, pressId, tiltX, tiltY }: KeyboardProps) {
  const isPressed = (id: KeyId) =>
    pressed.includes(id) ||
    (id === 'META_R' && pressed.includes('META')) ||
    (id === 'ALT_R' && pressed.includes('ALT'))

  return (
    <div
      aria-hidden="true"
      className="[--u:clamp(22px,6.4vw,44px)] [--g:calc(var(--u)*0.14)] min-[1100px]:[--u:clamp(30px,3vw,46px)] [perspective:1400px] select-none"
    >
      <motion.div
        className="[transform-style:preserve-3d]"
        style={{ rotateX: tiltX, rotateY: tiltY }}
      >
        <div className="[transform-style:preserve-3d] animate-[float_6s_ease-in-out_infinite]">
          <div className="mx-auto w-fit flex flex-col gap-(--g) p-[calc(var(--u)*0.38)] rounded-[calc(var(--u)*0.45)] border border-[rgba(79,70,229,0.14)] bg-linear-145 from-white to-[#e0e7ff] shadow-[0_calc(var(--u)*0.28)_0_#c7d2fe,0_calc(var(--u)*1.3)_calc(var(--u)*1.8)_rgba(79,70,229,0.28)] [transform-style:preserve-3d] [transform:rotateX(46deg)_rotateZ(-9deg)]">
            {ROWS.map((row) => (
              <div
                key={row.map((k) => k.id).join('')}
                className="flex gap-(--g) [transform-style:preserve-3d]"
              >
                {row.map((def) => (
                  <Key key={def.id} def={def} isPressed={isPressed(def.id)} pressId={pressId} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
