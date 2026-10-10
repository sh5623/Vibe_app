import { describe, expect, it } from 'vitest'
import {
  advance,
  buildScript,
  INITIAL_TYPING,
  keyFromCode,
  keysForChar,
  release,
  restingState,
  type TypingState,
} from './typing-script'

describe('keysForChar', () => {
  it('maps letters to their key, adding SHIFT only for uppercase when asked', () => {
    expect(keysForChar('s', { shiftUpper: true })).toEqual(['S'])
    expect(keysForChar('F', { shiftUpper: true })).toEqual(['SHIFT', 'F'])
    expect(keysForChar('F', { shiftUpper: false })).toEqual(['F'])
  })

  it('maps space and punctuation that exist on the keyboard', () => {
    expect(keysForChar(' ', { shiftUpper: true })).toEqual(['SPACE'])
    expect(keysForChar('.', { shiftUpper: true })).toEqual(['.'])
    expect(keysForChar('/', { shiftUpper: true })).toEqual(['/'])
  })

  it('presses nothing for characters missing from the keyboard', () => {
    expect(keysForChar('7', { shiftUpper: true })).toEqual([])
  })
})

describe('keyFromCode', () => {
  it('maps KeyboardEvent.code so Hangul IME input still lights the key', () => {
    expect(keyFromCode('KeyA')).toBe('A')
    expect(keyFromCode('Space')).toBe('SPACE')
    expect(keyFromCode('ShiftRight')).toBe('SHIFT')
    expect(keyFromCode('MetaLeft')).toBe('META')
    expect(keyFromCode('Period')).toBe('.')
    expect(keyFromCode('Digit1')).toBeNull()
  })
})

describe('buildScript', () => {
  const script = buildScript('SEUNG HO', ['Hi'])

  it('types every name character, then commits with ENTER', () => {
    const nameSteps = script.intro.filter((s) => s.action === 'name')
    expect(nameSteps).toHaveLength(8)
    expect(nameSteps.map((s) => s.keys.join('+'))).toEqual([
      'S',
      'E',
      'U',
      'N',
      'G',
      'SPACE',
      'H',
      'O',
    ])
    expect(script.intro.some((s) => s.action === 'enter' && s.keys[0] === 'ENTER')).toBe(true)
  })

  it('loops roles: types with SHIFT for capitals, then erases every character', () => {
    const typed = script.loop.filter((s) => s.action === 'role-type')
    const erased = script.loop.filter((s) => s.action === 'role-erase')
    expect(typed.map((s) => s.char).join('')).toBe('Hi')
    expect(typed[0]?.keys).toEqual(['SHIFT', 'H'])
    expect(erased).toHaveLength(2)
    expect(erased.every((s) => s.keys[0] === 'BACKSPACE')).toBe(true)
  })

  it('uses positive delays everywhere', () => {
    expect([...script.intro, ...script.loop].every((s) => s.delay > 0)).toBe(true)
  })
})

describe('advance', () => {
  const script = buildScript('AB', ['x'])
  const runAll = (state: TypingState, steps: number) => {
    let s = state
    for (let i = 0; i < steps; i++) s = advance(script, s)
    return s
  }

  it('reveals the name, commits, then types and erases the role', () => {
    const afterIntro = runAll(INITIAL_TYPING, script.intro.length)
    expect(afterIntro.nameCount).toBe(2)
    expect(afterIntro.committed).toBe(true)

    const typed = runAll(afterIntro, 1)
    expect(typed.role).toBe('x')
    expect(typed.pressed).toEqual(['X'])
    expect(typed.pressId).toBeGreaterThan(afterIntro.pressId)
  })

  it('wraps back to the start of the loop, never replaying the intro', () => {
    const afterIntro = runAll(INITIAL_TYPING, script.intro.length)
    const afterOneLoop = runAll(afterIntro, script.loop.length)
    expect(afterOneLoop.index).toBe(script.intro.length)
    expect(afterOneLoop.role).toBe('')
    expect(afterOneLoop.nameCount).toBe(2)
  })
})

describe('release / restingState', () => {
  it('release clears pressed keys but keeps the press counter', () => {
    const pressed = { ...INITIAL_TYPING, pressed: ['A'], pressId: 3 }
    expect(release(pressed)).toEqual({ ...pressed, pressed: [] })
  })

  it('restingState shows the full name and the first role without presses', () => {
    expect(restingState('AB', ['Dev', 'Ops'])).toMatchObject({
      nameCount: 2,
      committed: true,
      role: 'Dev',
      pressed: [],
    })
  })
})
