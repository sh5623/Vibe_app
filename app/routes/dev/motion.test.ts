import { describe, expect, it } from 'vitest'
import { gradientSlice, parseStat, tiltFromPointer } from './motion'

describe('parseStat', () => {
  it('splits a leading number from its suffix', () => {
    expect(parseStat('7+')).toEqual({ value: 7, suffix: '+' })
    expect(parseStat('10+')).toEqual({ value: 10, suffix: '+' })
  })

  it('keeps an empty suffix for bare numbers', () => {
    expect(parseStat('3')).toEqual({ value: 3, suffix: '' })
  })

  it('returns null when the stat does not start with a number', () => {
    expect(parseStat('FE')).toBeNull()
  })
})

describe('tiltFromPointer', () => {
  const rect = { left: 100, top: 200, width: 400, height: 200 }

  it('is flat at the center', () => {
    const tilt = tiltFromPointer(300, 300, rect, 6)
    expect(tilt.rotateX).toBeCloseTo(0)
    expect(tilt.rotateY).toBeCloseTo(0)
  })

  it('tilts toward the pointer up to the max angle at the edges', () => {
    // 부호 규약: 포인터가 오른쪽이면 rotateY+, 아래쪽이면 rotateX-
    expect(tiltFromPointer(500, 400, rect, 6)).toEqual({ rotateX: -6, rotateY: 6 })
    expect(tiltFromPointer(100, 200, rect, 6)).toEqual({ rotateX: 6, rotateY: -6 })
  })

  it('clamps pointers outside the rect', () => {
    expect(tiltFromPointer(900, -50, rect, 6)).toEqual({ rotateX: 6, rotateY: 6 })
  })

  it('stays flat for a zero-size rect', () => {
    expect(tiltFromPointer(10, 10, { left: 0, top: 0, width: 0, height: 0 }, 6)).toEqual({
      rotateX: 0,
      rotateY: 0,
    })
  })
})

describe('gradientSlice', () => {
  it('stretches one gradient across every character and offsets each slice', () => {
    expect(gradientSlice(0, 5)).toEqual({
      backgroundSize: '500% 100%',
      backgroundPosition: '0% 50%',
    })
    expect(gradientSlice(2, 5)).toEqual({
      backgroundSize: '500% 100%',
      backgroundPosition: '50% 50%',
    })
    expect(gradientSlice(4, 5)).toEqual({
      backgroundSize: '500% 100%',
      backgroundPosition: '100% 50%',
    })
  })

  it('does not divide by zero for a single character', () => {
    expect(gradientSlice(0, 1)).toEqual({
      backgroundSize: '100% 100%',
      backgroundPosition: '0% 50%',
    })
  })
})
