import { describe, expect, it } from 'vitest'
import type { Todo } from '../../../../api/morning-signal-todo'
import {
  continueList,
  doneGroups,
  doneToday,
  dueLeft,
  dueText,
  dueWithin,
  filterPending,
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
    important: false,
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
    expect(r.important).toEqual([])
  })

  it('splitPending pulls important to its own group — in progress first, then due', () => {
    const r = splitPending([
      todo('t', { dueDate: '2026-10-24' }),
      todo('i-todo-due', { important: true, dueDate: '2026-10-25' }),
      todo('i-todo', { important: true }),
      todo('i-prog', { important: true, status: 'in_progress', dueDate: '2026-11-30' }),
      todo('p', { status: 'in_progress' }),
      todo('i-done', { important: true, status: 'done' }),
    ])
    expect(r.important.map((t) => t.id)).toEqual(['i-prog', 'i-todo-due', 'i-todo'])
    expect(r.progress.map((t) => t.id)).toEqual(['p'])
    expect(r.todo.map((t) => t.id)).toEqual(['t'])
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

describe('dueWithin', () => {
  const due = (dueDate: string | null, status: Todo['status'] = 'todo') => ({ dueDate, status })
  it('오늘과 N일 뒤까지 true, 그 다음 날은 false', () => {
    expect(dueWithin(due('2026-10-23'), TODAY, 3)).toBe(true)
    expect(dueWithin(due('2026-10-26'), TODAY, 3)).toBe(true)
    expect(dueWithin(due('2026-10-27'), TODAY, 3)).toBe(false)
  })
  it('지난 마감도 true', () => {
    expect(dueWithin(due('2026-10-20'), TODAY, 1)).toBe(true)
  })
  it('days=1 이면 내일까지', () => {
    expect(dueWithin(due('2026-10-24'), TODAY, 1)).toBe(true)
    expect(dueWithin(due('2026-10-25'), TODAY, 1)).toBe(false)
  })
  it('완료나 마감 없음은 false', () => {
    expect(dueWithin(due('2026-10-23', 'done'), TODAY, 3)).toBe(false)
    expect(dueWithin(due(null), TODAY, 3)).toBe(false)
  })
})

describe('filterPending', () => {
  const list = [
    todo('t1'),
    todo('p1', { status: 'in_progress' }),
    todo('t2', { important: true }),
    todo('p2', { status: 'in_progress', important: true }),
  ]
  it('전체는 그대로', () => {
    expect(filterPending(list, 'all').map((t) => t.id)).toEqual(['t1', 'p1', 't2', 'p2'])
  })
  it('할 일만', () => {
    expect(filterPending(list, 'todo').map((t) => t.id)).toEqual(['t1', 't2'])
  })
  it('진행 중만', () => {
    expect(filterPending(list, 'progress').map((t) => t.id)).toEqual(['p1', 'p2'])
  })
})

describe('doneGroups', () => {
  const T = '2026-11-19' // 목요일
  const done = (id: string, doneAt: string | null) => todo(id, { status: 'done', doneAt })
  it('완료 시각의 KST 날짜로 묶고 최신 날짜가 먼저 — 오늘·어제·M월 D일', () => {
    const g = doneGroups(
      [
        done('old', '2026-11-12T03:00:00.000Z'),
        done('y', '2026-11-18T03:00:00.000Z'),
        done('t-late', '2026-11-19T08:00:00.000Z'),
        // UTC 로는 11/18 이지만 KST 로는 11/19 01:00 — 오늘
        done('t-early', '2026-11-18T16:00:00.000Z'),
      ],
      T
    )
    expect(g.map((x) => x.label)).toEqual(['오늘', '어제', '11월 12일'])
    expect(g[0]?.items.map((t) => t.id)).toEqual(['t-late', 't-early'])
    expect(g[1]?.items.map((t) => t.id)).toEqual(['y'])
    expect(g[2]?.items.map((t) => t.id)).toEqual(['old'])
  })
  it('완료 시각이 없으면 뺀다', () => {
    expect(doneGroups([done('x', null)], T)).toEqual([])
  })
})

describe('dueLeft', () => {
  const d = (dueDate: string) => ({ dueDate })
  it('남은 날 수를 말로', () => {
    expect(dueLeft(d('2026-10-23'), TODAY)).toBe('오늘')
    expect(dueLeft(d('2026-10-24'), TODAY)).toBe('내일')
    expect(dueLeft(d('2026-10-26'), TODAY)).toBe('3일 남음')
    expect(dueLeft(d('2026-10-21'), TODAY)).toBe('2일 지남')
  })
  it('마감이 없으면 null', () => {
    expect(dueLeft({ dueDate: null }, TODAY)).toBeNull()
  })
})

describe('doneToday', () => {
  const T = '2026-11-19'
  const done = (id: string, doneAt: string | null) => todo(id, { status: 'done', doneAt })
  it('완료 시각의 KST 날짜가 오늘인 것만 센다 — 어제 완료는 세지 않는다', () => {
    expect(
      doneToday(
        [
          done('t', '2026-11-19T03:00:00.000Z'),
          // UTC 로는 11/18 이지만 KST 로는 11/19 01:00 — 오늘
          done('t-kst', '2026-11-18T16:00:00.000Z'),
          done('y', '2026-11-18T03:00:00.000Z'),
          done('none', null),
        ],
        T
      )
    ).toBe(2)
    expect(doneToday([done('y', '2026-11-18T03:00:00.000Z')], T)).toBe(0)
  })
})
