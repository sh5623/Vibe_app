import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { ListResponse, Todo } from '../../api/morning-signal-todo'
import { findInList, withStatus } from './use-morning-signal-todo'

const todo = (id: string, status: Todo['status'], createdDate = '2026-10-23'): Todo => ({
  id,
  title: id,
  body: null,
  link: null,
  dueDate: null,
  dueTime: null,
  status,
  attachments: [],
  createdDate,
  createdAt: `${createdDate}T00:00:00Z`,
  updatedAt: `${createdDate}T00:00:00Z`,
  doneAt: null,
})

function data(): InfiniteData<ListResponse, string | null> {
  const a = todo('a', 'todo')
  const b = todo('b', 'done')
  return {
    pageParams: [null],
    pages: [
      {
        pending: [a],
        items: [a, b],
        nextCursor: null,
        dayCounts: { '2026-10-23': { done: 1, total: 2 } },
      },
    ],
  }
}

describe('findInList', () => {
  it('끝나지 않은 일과 기록 어디서든 찾는다', () => {
    expect(findInList(data(), 'a')?.id).toBe('a')
    expect(findInList(data(), 'b')?.status).toBe('done')
  })
  it('없으면 undefined', () => {
    expect(findInList(data(), 'zzz')).toBeUndefined()
    expect(findInList(undefined, 'a')).toBeUndefined()
  })
})

describe('withStatus', () => {
  it('DONE 으로 바꾸면 목록·기록의 상태와 완료 건수를 함께 올린다', () => {
    const next = withStatus(data(), 'a', 'done')
    expect(next?.pages[0]?.items[0]?.status).toBe('done')
    expect(next?.pages[0]?.pending?.[0]?.status).toBe('done')
    expect(next?.pages[0]?.dayCounts['2026-10-23']).toEqual({ done: 2, total: 2 })
  })

  it('DONE 에서 나오면 완료 건수를 내린다', () => {
    const next = withStatus(data(), 'b', 'in_progress')
    expect(next?.pages[0]?.dayCounts['2026-10-23']).toEqual({ done: 0, total: 2 })
  })

  it('DONE 이 아닌 상태끼리 바꾸면 건수는 그대로다', () => {
    const next = withStatus(data(), 'a', 'in_progress')
    expect(next?.pages[0]?.dayCounts['2026-10-23']).toEqual({ done: 1, total: 2 })
  })

  it('없는 id·빈 데이터는 건수를 건드리지 않는다', () => {
    expect(withStatus(data(), 'zzz', 'done')?.pages[0]?.dayCounts['2026-10-23']).toEqual({
      done: 1,
      total: 2,
    })
    expect(withStatus(undefined, 'a', 'done')).toBeUndefined()
  })

  it('원본을 바꾸지 않는다', () => {
    const d = data()
    withStatus(d, 'a', 'done')
    expect(d.pages[0]?.items[0]?.status).toBe('todo')
    expect(d.pages[0]?.dayCounts['2026-10-23']?.done).toBe(1)
  })
})
