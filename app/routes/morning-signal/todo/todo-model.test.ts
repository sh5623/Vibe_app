import { describe, expect, it } from 'vitest'
import type { Todo } from '../../../../api/morning-signal-todo'
import {
  continueList,
  dayHeading,
  dueText,
  groupByCreatedDate,
  isDueSoon,
  kstToday,
  STATUS_LABEL,
  splitPending,
} from './todo-model'

const TODAY = '2026-10-23' // 금요일

function todo(id: string, over: Partial<Todo> = {}): Todo {
  return {
    id,
    title: id,
    body: null,
    link: null,
    dueDate: null,
    dueTime: null,
    status: 'todo',
    attachments: [],
    createdDate: '2026-10-23',
    createdAt: '2026-10-23T01:00:00.000Z',
    updatedAt: '2026-10-23T01:00:00.000Z',
    doneAt: null,
    ...over,
  }
}

describe('todo-model', () => {
  it('STATUS_LABEL', () => {
    expect(STATUS_LABEL).toEqual({ todo: 'TODO', in_progress: 'IN PROGRESS', done: 'DONE' })
  })

  it('splitPending orders by due then created', () => {
    const r = splitPending([
      todo('p-late', { status: 'in_progress', createdAt: '2026-10-22T00:00:00.000Z' }),
      todo('done', { status: 'done', dueDate: '2026-10-24' }),
      todo('p-due', { status: 'in_progress', dueDate: '2026-10-25' }),
      todo('p-early', { status: 'in_progress', createdAt: '2026-10-20T00:00:00.000Z' }),
      todo('t-1', { dueDate: '2026-11-07' }),
      todo('t-2', { dueDate: '2026-10-27' }),
    ])
    expect(r.progress.map((t) => t.id)).toEqual(['p-due', 'p-early', 'p-late'])
    expect(r.todo.map((t) => t.id)).toEqual(['t-2', 't-1'])
  })

  it('groupByCreatedDate sorts and dedupes', () => {
    const g = groupByCreatedDate([
      todo('a', { createdDate: '2026-10-22', createdAt: '2026-10-22T01:00:00.000Z' }),
      todo('b', { createdDate: '2026-10-23', createdAt: '2026-10-23T01:00:00.000Z' }),
      todo('c', { createdDate: '2026-10-23', createdAt: '2026-10-23T05:00:00.000Z' }),
      todo('b', { createdDate: '2026-10-23', createdAt: '2026-10-23T01:00:00.000Z' }),
    ])
    expect(g.map((d) => d.date)).toEqual(['2026-10-23', '2026-10-22'])
    expect(g[0]?.items.map((t) => t.id)).toEqual(['c', 'b'])
    expect(g[1]?.items.map((t) => t.id)).toEqual(['a'])
  })

  it('dayHeading', () => {
    expect(dayHeading('2026-10-23', TODAY)).toEqual({ name: '오늘', sub: '10월 23일 금요일' })
    expect(dayHeading('2026-10-22', TODAY)).toEqual({ name: '어제', sub: '10월 22일 목요일' })
    expect(dayHeading('2026-10-20', TODAY)).toEqual({ name: '10월 20일', sub: '화요일' })
    expect(dayHeading('2025-12-31', TODAY)).toEqual({ name: '2025년 12월 31일', sub: '수요일' })
  })

  it('dueText', () => {
    expect(dueText({ dueDate: '2026-10-27', dueTime: '10:00' })).toBe('10/27 (화) 10:00')
    expect(dueText({ dueDate: '2026-11-07', dueTime: null })).toBe('11/7 (토)')
    expect(dueText({ dueDate: null, dueTime: null })).toBeNull()
  })

  it('isDueSoon', () => {
    expect(isDueSoon(todo('a', { dueDate: '2026-10-26' }), TODAY)).toBe(true)
    expect(isDueSoon(todo('a', { dueDate: '2026-10-27' }), TODAY)).toBe(false)
    expect(isDueSoon(todo('a', { dueDate: '2026-10-20' }), TODAY)).toBe(true)
    expect(isDueSoon(todo('a', { dueDate: '2026-10-23', status: 'done' }), TODAY)).toBe(false)
    expect(isDueSoon(todo('a'), TODAY)).toBe(false)
  })

  it('kstToday', () => {
    expect(kstToday(new Date('2026-10-22T15:30:00Z'))).toBe('2026-10-23')
    expect(kstToday(new Date('2026-10-22T14:59:00Z'))).toBe('2026-10-22')
  })
})

describe('continueList', () => {
  it('글머리·번호·체크를 이어 준다', () => {
    expect(continueList('- 우유', 4)).toEqual({ text: '- 우유\n- ', caret: 7 })
    expect(continueList('1. a', 4)).toEqual({ text: '1. a\n2. ', caret: 8 })
    expect(continueList('- [ ] a', 7)?.text).toBe('- [ ] a\n- [ ] ')
  })

  it('빈 글머리 줄이면 목록을 끝낸다', () => {
    expect(continueList('- a\n- ', 6)).toEqual({ text: '- a\n', caret: 4 })
  })

  it('목록이 아니면 null', () => {
    expect(continueList('그냥 글', 4)).toBeNull()
  })
})
