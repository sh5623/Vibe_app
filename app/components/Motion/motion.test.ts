import { describe, expect, it } from 'vitest'
import { nextTypePos, parseStat } from './index'

describe('parseStat', () => {
  it('splits a leading number from its suffix', () => {
    expect(parseStat('71%')).toEqual({ value: 71, suffix: '%' })
    expect(parseStat('5')).toEqual({ value: 5, suffix: '' })
  })

  it('returns null for values that do not start with a number', () => {
    expect(parseStat('~30분')).toBeNull()
  })
})

describe('nextTypePos', () => {
  // 줄 길이: 문자열 줄은 글자 수, 노드 줄은 null(한 번에 나타남)
  const lengths = [3, null, 2]

  it('types a string line one character at a time', () => {
    expect(nextTypePos(lengths, { line: 0, char: 0 })).toEqual({ line: 0, char: 1 })
    expect(nextTypePos(lengths, { line: 0, char: 2 })).toEqual({ line: 0, char: 3 })
  })

  it('moves to the next line once a line is complete', () => {
    expect(nextTypePos(lengths, { line: 0, char: 3 })).toEqual({ line: 1, char: 0 })
  })

  it('reveals a node line whole', () => {
    expect(nextTypePos(lengths, { line: 1, char: 0 })).toEqual({ line: 2, char: 0 })
  })

  it('stays put once every line is shown', () => {
    expect(nextTypePos(lengths, { line: 3, char: 0 })).toEqual({ line: 3, char: 0 })
  })
})
