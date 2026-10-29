import { useQueryClient } from '@tanstack/react-query'
import {
  type ChangeEvent,
  type CSSProperties,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { TodoApiError, todoKeys, useUnlock } from '@/hooks/use-morning-signal-todo'

// PIN 잠금 화면 — 시안 D(docs/morning-signal/todo-mockups/pin-gate.html). 타이밍은 시안 값 그대로다.

type CssVars = CSSProperties & Record<`--${string}`, string | number>

const LEN = 4
const RING_R = 35
const RING_C = 2 * Math.PI * RING_R
const WRONG = 'PIN이 맞지 않아요. 다시 입력해 주세요.'
const NETWORK = '확인하지 못했어요. 다시 시도해 주세요.'
/** 숫자 굴림이 멈추는 시점 — 이때 점이 튀고 칸이 살짝 커진다 */
const LAND_MS = 330
const MASK_MS = 900
/** 점 8개가 튀는 방향(시안의 무작위 대신 고정 각도 + 약간의 흔들림) */
const PARTICLES = Array.from({ length: 8 }, (_, k) => {
  const a = (k / 8) * Math.PI * 2 + ((k * 37) % 7) * 0.05
  const r = 30 + ((k * 53) % 10)
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r * 1.1 }
})

type Phase = 'input' | 'checking' | 'verifying' | 'success' | 'fail' | 'clearing'

interface Digit {
  d: string
  /** 굴러가는 숫자 열 — 앞 셋은 임의 숫자, 마지막이 입력한 숫자 */
  seq: string[]
  key: number
  masked: boolean
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * 스크립트 모션(Web Animations). CSS 쪽은 morning-signal.css 의 `.ms *` 규칙이 감속 모션 설정을 따르지만
 * element.animate() 는 그 규칙에 안 걸리므로 여기서 직접 건너뛴다(흔들림·회전이 감속 설정이 막으려는 대표 모션이다).
 */
function play(
  el: Element | null | undefined,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  el.animate(keyframes, options)
}

function rollSeq(d: string): string[] {
  const n = Number(d)
  return [0, 1, 2].map(() => String((n + 3 + Math.floor(Math.random() * 6)) % 10)).concat(d)
}

/** 잠금은 잠글 때마다 두 배로 길어진다(10분 → … → 24시간) — 1시간이 넘으면 시:분:초로 쓴다 */
function remaining(until: string, now: number): string {
  const s = Math.max(0, Math.ceil((Date.parse(until) - now) / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h ? `${h}:${pad(m)}` : m}:${pad(s % 60)} 남음`
}

/** 글자마다 흐림이 걷히며 나타난다(텍스트가 바뀌면 key 가 바뀌어 다시 재생) */
function Chars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((c, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 같은 글자가 반복돼 위치가 곧 정체성이다
        <span key={`${text}-${i}`} style={{ animationDelay: `${i * 26}ms` }}>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </>
  )
}

interface PinGateProps {
  /** 세션 응답의 잠금 시각(막혀 있지 않으면 null) */
  lockedUntil: string | null
  /** 서버에 PIN·비밀값이 설정되지 않았다(503 TODO_NOT_CONFIGURED) */
  configError: boolean
}

/**
 * 세션은 라우트만 구독하고 여기에는 값으로 받는다 — 실패한 세션 조회를 여기서 한 번 더 구독하면
 * TanStack 이 마운트 때 다시 조회하며 status 를 pending 으로 되돌려 라우트가 이 컴포넌트를 내렸다 올리기를 반복한다.
 */
export default function PinGate({ lockedUntil: initialLock, configError }: PinGateProps) {
  const qc = useQueryClient()
  const unlock = useUnlock()

  const [digits, setDigits] = useState<Digit[]>([])
  const [phase, setPhase] = useState<Phase>('input')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<string | null>(initialLock)
  const [now, setNow] = useState(() => Date.now())
  const [title, setTitle] = useState('본인 확인')
  const [desc, setDesc] = useState('PIN 4자리를 입력하세요')
  const [out, setOut] = useState(false)
  const [haloKey, setHaloKey] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const slotsRef = useRef<HTMLDivElement>(null)
  const lockRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<Array<HTMLDivElement | null>>([])
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const nonce = useRef(0)

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
  }
  useEffect(() => {
    const set = timers.current
    return () => {
      for (const t of set) clearTimeout(t)
    }
  }, [])

  // 막힘 카운트다운 — 끝나면 세션을 다시 읽어 입력을 연다
  const locked = !!lockedUntil && Date.parse(lockedUntil) > now
  useEffect(() => {
    if (!lockedUntil) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (Date.parse(lockedUntil) <= t) {
        setLockedUntil(null)
        void qc.invalidateQueries({ queryKey: todoKeys.session })
      }
    }, 1000)
    return () => clearInterval(id)
  }, [lockedUntil, qc])

  const disabled = configError || locked
  const busy = phase !== 'input'
  const value = digits.map((x) => x.d).join('')

  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true })
  }, [disabled])

  const land = (i: number) => {
    later(() => {
      play(
        slotRefs.current[i],
        [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
        { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' }
      )
    }, LAND_MS)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (busy || disabled) return
    const v = e.target.value.replace(/\D/g, '')
    if (v.length < value.length) {
      setDigits((ds) => ds.slice(0, v.length))
      return
    }
    const keep = v.startsWith(value) ? digits : []
    const add = (v.startsWith(value) ? v.slice(value.length) : v).slice(0, LEN - keep.length)
    if (!add) return
    setError(null)
    const fresh = [...add].map((d) => {
      nonce.current += 1
      return { d, seq: rollSeq(d), key: nonce.current, masked: false }
    })
    const next = [...keep, ...fresh]
    setDigits(next)
    fresh.forEach((f, j) => {
      land(keep.length + j)
      later(
        () => setDigits((ds) => ds.map((x) => (x.key === f.key ? { ...x, masked: true } : x))),
        MASK_MS
      )
    })
    try {
      navigator.vibrate?.(8)
    } catch {
      // 진동이 안 되는 기기
    }
    if (next.length === LEN) void verify(next.map((x) => x.d).join(''))
  }

  // 투명 입력칸 안에서 커서가 늘 끝에 있게 — 중간에 끼워 넣기를 막는다
  const keepCaretAtEnd = (e: SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    if (el.selectionStart !== el.value.length)
      el.setSelectionRange(el.value.length, el.value.length)
  }

  async function verify(pin: string) {
    setPhase('checking')
    await sleep(380)
    setPhase('verifying')
    setDesc('PIN을 확인하고 있어요')
    const [r] = await Promise.allSettled([unlock.mutateAsync(pin), sleep(700)])
    if (r.status === 'fulfilled') return success()
    const e = r.reason
    if (e instanceof TodoApiError && e.code === 'TOO_MANY') {
      const until = (e.body as { until?: string } | null)?.until ?? null
      setDigits([])
      setPhase('input')
      setDesc('PIN 4자리를 입력하세요')
      setNow(Date.now())
      setLockedUntil(until)
      return
    }
    if (e instanceof TodoApiError && e.code === 'TODO_NOT_CONFIGURED') {
      void qc.invalidateQueries({ queryKey: todoKeys.session })
    }
    return fail(e instanceof TodoApiError && e.code === 'WRONG_PIN' ? WRONG : NETWORK)
  }

  async function success() {
    setPhase('success')
    setHaloKey((k) => k + 1)
    try {
      navigator.vibrate?.([12, 40, 12])
    } catch {
      // 진동이 안 되는 기기
    }
    later(() => {
      setTitle('확인됐어요')
      setDesc('TO-DO를 열고 있어요')
    }, 300)
    await sleep(1350)
    setOut(true)
    await sleep(260)
    await qc.invalidateQueries({ queryKey: todoKeys.session })
  }

  async function fail(message: string) {
    setPhase('fail')
    setDesc('PIN 4자리를 입력하세요')
    slotRefs.current.forEach((s, i) => {
      play(
        s?.querySelector('.win'),
        [
          { transform: 'scaleY(1)' },
          { transform: 'translateY(5px) scaleY(.55)' },
          { transform: 'scaleY(1)' },
        ],
        { duration: 260, delay: i * 30, easing: 'ease-out' }
      )
    })
    await sleep(240)
    play(
      slotsRef.current,
      [0, -12, 10, -8, 6, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 480, easing: 'cubic-bezier(.36,.07,.19,.97)' }
    )
    play(
      lockRef.current,
      [0, -8, 7, -4, 0].map((d) => ({ transform: `rotate(${d}deg)` })),
      { duration: 420 }
    )
    try {
      navigator.vibrate?.([30, 40, 30])
    } catch {
      // 진동이 안 되는 기기
    }
    setError(message)
    await sleep(910)
    // 되돌리기 — 왼쪽부터 70ms 간격으로 떨어지고 버튼 막대가 비워진다
    setPhase('clearing')
    await sleep(3 * 70 + 300)
    setDigits([])
    setPhase('input')
    inputRef.current?.focus({ preventScroll: true })
  }

  const n = digits.length
  const progress =
    phase === 'clearing' ? 0 : phase === 'input' || phase === 'checking' ? n / LEN : 1
  const ringOffset =
    phase === 'verifying'
      ? RING_C * 0.72
      : phase === 'success' || phase === 'fail'
        ? 0
        : RING_C * (1 - progress)
  const ringState =
    phase === 'success' ? 'ok' : phase === 'fail' || phase === 'clearing' || locked ? 'err' : ''
  const label = phase === 'verifying' ? '확인 중' : phase === 'success' ? '열기 →' : '확인'

  return (
    <section className={`pin${out ? ' out' : ''}${disabled ? ' off' : ''}`} aria-label="TO-DO 잠금">
      <button
        type="button"
        className="eye"
        aria-label={reveal ? '숫자 가리기' : '숫자 보기'}
        aria-pressed={reveal}
        onClick={() => {
          setReveal((r) => !r)
          inputRef.current?.focus({ preventScroll: true })
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          {reveal && (
            <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <div
        className={`lock${phase === 'verifying' ? ' spin' : ''}${ringState ? ` ${ringState}` : ''}`}
        ref={lockRef}
        aria-hidden="true"
      >
        <svg className="pin-ring" viewBox="0 0 76 76" aria-hidden="true">
          <defs>
            <linearGradient id="td-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--td-b1)" />
              <stop offset="1" stopColor="var(--td-b2)" />
            </linearGradient>
          </defs>
          <circle className="trk" cx="38" cy="38" r={RING_R} />
          <circle
            className="arc"
            cx="38"
            cy="38"
            r={RING_R}
            style={{ strokeDasharray: RING_C, strokeDashoffset: ringOffset }}
          />
        </svg>
        <div className="core">
          <svg
            className="ic-lock"
            width="22"
            height="24"
            viewBox="0 0 22 24"
            fill="none"
            aria-hidden="true"
          >
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
            <circle cx="11" cy="16" r="1.4" fill="currentColor" />
          </svg>
          <svg
            className="ic-check"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {haloKey > 0 && <div className="halo" key={haloKey} />}
      </div>

      <h2 className="pin-title" aria-live="polite">
        <Chars text={title} />
      </h2>
      <p className="pin-desc">
        {configError ? (
          'PIN이 아직 설정되지 않았어요'
        ) : locked && lockedUntil ? (
          <>
            잠시 뒤에 다시 시도해 주세요 · <b>{remaining(lockedUntil, now)}</b>
          </>
        ) : (
          <Chars text={desc} />
        )}
      </p>

      <div
        className={`slots${phase === 'fail' || phase === 'clearing' ? ' err' : ''}${phase === 'clearing' ? ' clearing' : ''}`}
        ref={slotsRef}
      >
        {Array.from({ length: LEN }, (_, i) => {
          const x = digits[i]
          const active = !busy && !disabled && i === n
          const cls = [
            'slot',
            x ? 'filled' : '',
            active ? 'active' : '',
            phase === 'success' ? 'ok' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: 칸 4개는 자리 자체가 정체성이다
              key={i}
              className={cls}
              style={{ '--i': i } as CssVars}
              ref={(el) => {
                slotRefs.current[i] = el
              }}
            >
              <div className="win">
                {x &&
                  (reveal ? (
                    <div className="col still">
                      <span>{x.d}</span>
                    </div>
                  ) : x.masked ? (
                    <span className="m" />
                  ) : (
                    <div className="col" key={x.key}>
                      {x.seq.map((c, j) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: 굴림 열의 순서가 곧 정체성이다
                        <span key={j}>{c}</span>
                      ))}
                    </div>
                  ))}
              </div>
              {x && !x.masked && !reveal && (
                <span className="burst" key={x.key} aria-hidden="true">
                  {PARTICLES.map((p, k) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 고정 배열
                    <i key={k} style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as CssVars} />
                  ))}
                </span>
              )}
              <i className="ph" />
              <b className="caret" />
              <i className="ul" />
            </div>
          )
        })}
        <input
          ref={inputRef}
          className="pin-input"
          aria-label="PIN 4자리"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={onChange}
          onSelect={keepCaretAtEnd}
        />
      </div>

      <div className={`err-msg${error ? ' show' : ''}`} role="alert">
        {error && (
          <>
            <i>!</i>
            {error}
          </>
        )}
      </div>

      <div
        className={`cta${phase === 'verifying' ? ' busy' : ''}${phase === 'success' ? ' ok' : ''}`}
        aria-hidden="true"
      >
        <span className="fill" style={{ width: `${progress * 100}%` }} />
        <span className="lbl base">
          {phase === 'verifying' && <i className="sp" />}
          {label}
        </span>
        <span className="lbl over" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>
          {phase === 'verifying' && <i className="sp" />}
          {label}
        </span>
      </div>
    </section>
  )
}
