import { useEffect, useMemo, useState } from 'react'

/**
 * /dev 히어로 키보드 타이핑 엔진.
 * 스크립트 = intro(이름 타이핑 → ENTER) 1회 + loop(역할 타이핑 → 대기 → 지우기) 무한 반복.
 * 순수 함수(buildScript·advance·release)는 typing-script.test.ts 가 검증하고,
 * useTypingScript 는 그 함수들을 타이머로 굴리기만 한다.
 */

/** 화면 키보드의 키 식별자 — 'A'~'Z', ',', '.', '/', 'SPACE', 'ENTER', 'BACKSPACE', 'SHIFT' … */
export type KeyId = string

export interface Step {
  action: 'name' | 'enter' | 'role-type' | 'role-erase' | 'wait'
  /** 이 스텝에서 눌리는 키(없으면 []) */
  keys: KeyId[]
  /** role-type 에서 찍히는 글자 */
  char?: string
  /** 이 스텝을 적용하기 전에 기다리는 시간(ms) */
  delay: number
}

export interface Script {
  intro: Step[]
  loop: Step[]
}

export interface TypingState {
  /** 다음에 적용할 스텝 위치(intro → loop 순으로 이어 센다) */
  index: number
  /** 지금까지 찍힌 이름 글자 수 */
  nameCount: number
  /** ENTER 로 이름이 확정됐는가 */
  committed: boolean
  role: string
  pressed: KeyId[]
  /** 키가 눌릴 때마다 1씩 증가 — 같은 키를 연달아 눌러도 애니메이션이 다시 걸리게 한다 */
  pressId: number
}

export const INITIAL_TYPING: TypingState = {
  index: 0,
  nameCount: 0,
  committed: false,
  role: '',
  pressed: [],
  pressId: 0,
}

const PUNCTUATION = new Set([',', '.', '/'])

export function keysForChar(char: string, { shiftUpper }: { shiftUpper: boolean }): KeyId[] {
  if (char === ' ') return ['SPACE']
  if (PUNCTUATION.has(char)) return [char]
  if (/^[a-z]$/i.test(char)) {
    const key = char.toUpperCase()
    return shiftUpper && char === key ? ['SHIFT', key] : [key]
  }
  return []
}

const CODE_MAP: Record<string, KeyId> = {
  Space: 'SPACE',
  Enter: 'ENTER',
  Backspace: 'BACKSPACE',
  ShiftLeft: 'SHIFT',
  ShiftRight: 'SHIFT',
  MetaLeft: 'META',
  MetaRight: 'META',
  AltLeft: 'ALT',
  AltRight: 'ALT',
  ControlLeft: 'CTRL',
  ControlRight: 'CTRL',
  CapsLock: 'CAPS',
  Comma: ',',
  Period: '.',
  Slash: '/',
}

/** KeyboardEvent.code → 키 식별자. key 가 아니라 code 를 써서 한글 IME 상태에서도 같은 키가 눌린다. */
export function keyFromCode(code: string): KeyId | null {
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter?.[1]) return letter[1]
  return CODE_MAP[code] ?? null
}

// 사람이 치는 것처럼 박자를 조금씩 흔든다(결정적이라 테스트 가능)
const JITTER = [0, 45, -25, 30, -15, 20]
const rhythm = (base: number, i: number) => base + (JITTER[i % JITTER.length] ?? 0)

export function buildScript(name: string, roles: readonly string[]): Script {
  const intro: Step[] = [
    { action: 'wait', keys: [], delay: 650 },
    ...[...name].map((char, i) => ({
      action: 'name' as const,
      keys: keysForChar(char, { shiftUpper: false }),
      delay: rhythm(135, i),
    })),
    { action: 'enter', keys: ['ENTER'], delay: 320 },
    { action: 'wait', keys: [], delay: 650 },
  ]

  const loop: Step[] = roles.flatMap((role) => [
    ...[...role].map((char, i) => ({
      action: 'role-type' as const,
      keys: keysForChar(char, { shiftUpper: true }),
      char,
      delay: rhythm(78, i),
    })),
    { action: 'wait' as const, keys: [], delay: 1900 },
    ...[...role].map(() => ({ action: 'role-erase' as const, keys: ['BACKSPACE'], delay: 34 })),
    { action: 'wait' as const, keys: [], delay: 420 },
  ])

  return { intro, loop }
}

export function stepAt(script: Script, index: number): Step | undefined {
  if (index < script.intro.length) return script.intro[index]
  return script.loop[index - script.intro.length]
}

/** index 의 스텝을 적용하고 다음 위치로 옮긴다. loop 끝에 닿으면 loop 처음으로 돌아간다. */
export function advance(script: Script, state: TypingState): TypingState {
  const step = stepAt(script, state.index)
  if (!step) return state

  const total = script.intro.length + script.loop.length
  const nextIndex = state.index + 1 >= total ? script.intro.length : state.index + 1
  const next: TypingState = { ...state, index: nextIndex }

  switch (step.action) {
    case 'name':
      next.nameCount = state.nameCount + 1
      break
    case 'enter':
      next.committed = true
      break
    case 'role-type':
      next.role = state.role + (step.char ?? '')
      break
    case 'role-erase':
      next.role = state.role.slice(0, -1)
      break
    case 'wait':
      break
  }

  if (step.keys.length > 0) {
    next.pressed = step.keys
    next.pressId = state.pressId + 1
  }
  return next
}

export function release(state: TypingState): TypingState {
  return { ...state, pressed: [] }
}

/** 모션 최소화일 때 보여 줄 정지 상태 */
export function restingState(name: string, roles: readonly string[]): TypingState {
  return { ...INITIAL_TYPING, nameCount: [...name].length, committed: true, role: roles[0] ?? '' }
}

const KEY_HOLD_MS = 110

/**
 * 스크립트를 타이머로 굴린다. running 이 false 면(화면 밖 등) 그 자리에서 멈췄다가 이어서 친다.
 * roles 는 렌더마다 새로 만들지 말 것(모듈 상수로 둔다) — 스크립트가 다시 만들어진다.
 */
export function useTypingScript(
  name: string,
  roles: readonly string[],
  { running, reduced }: { running: boolean; reduced: boolean }
): TypingState {
  const script = useMemo(() => buildScript(name, roles), [name, roles])
  const [state, setState] = useState<TypingState>(INITIAL_TYPING)

  useEffect(() => {
    if (!running || reduced) return
    const step = stepAt(script, state.index)
    if (!step) return
    const timer = setTimeout(() => setState((s) => advance(script, s)), step.delay)
    return () => clearTimeout(timer)
  }, [running, reduced, script, state.index])

  // 눌린 키는 잠깐 뒤 떼어 준다. 그 사이 새 키가 눌리면(pressId 변경) 이 타이머는 무시된다.
  const { pressId, pressed } = state
  useEffect(() => {
    if (pressed.length === 0) return
    const timer = setTimeout(
      () => setState((s) => (s.pressId === pressId ? release(s) : s)),
      KEY_HOLD_MS
    )
    return () => clearTimeout(timer)
  }, [pressId, pressed])

  return reduced ? restingState(name, roles) : state
}
