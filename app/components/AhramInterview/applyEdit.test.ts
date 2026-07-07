import { describe, expect, it } from 'vitest'
import { DEFAULT_INTERVIEW_CONTENT } from '@/lib/ahram-content'
import { applyEdit } from './index'

describe('applyEdit', () => {
  it('updates a root field (selfIntro) without mutating the original content', () => {
    const next = applyEdit(
      DEFAULT_INTERVIEW_CONTENT,
      { type: 'root', field: 'selfIntro' },
      '수정된 자기소개'
    )

    expect(next.selfIntro).toBe('수정된 자기소개')
    expect(DEFAULT_INTERVIEW_CONTENT.selfIntro).not.toBe('수정된 자기소개')
  })

  it('updates a root field (motivation) without mutating the original content', () => {
    const next = applyEdit(
      DEFAULT_INTERVIEW_CONTENT,
      { type: 'root', field: 'motivation' },
      '수정된 이직 동기'
    )

    expect(next.motivation).toBe('수정된 이직 동기')
    expect(DEFAULT_INTERVIEW_CONTENT.motivation).not.toBe('수정된 이직 동기')
  })

  it('updates a single QA item answer within its category, leaving sibling items untouched', () => {
    const category = DEFAULT_INTERVIEW_CONTENT.categories.find((c) => c.id === 'apply-reason')
    const item = category?.items[0]
    if (!category || !item) throw new Error('fixture missing')

    const next = applyEdit(
      DEFAULT_INTERVIEW_CONTENT,
      { type: 'item', categoryId: category.id, itemId: item.id, field: 'answer' },
      '수정된 답변'
    )

    const nextCategory = next.categories.find((c) => c.id === category.id)
    const nextItem = nextCategory?.items.find((i) => i.id === item.id)
    const siblingItem = nextCategory?.items[1]

    expect(nextItem?.answer).toBe('수정된 답변')
    expect(siblingItem?.answer).toBe(category.items[1]?.answer)
    expect(item.answer).not.toBe('수정된 답변')
  })

  it('updates the answerB variant of the personality-weakness item independently of answer', () => {
    const category = DEFAULT_INTERVIEW_CONTENT.categories.find((c) => c.id === 'personality')
    const item = category?.items.find((i) => i.id === 'personality-weakness')
    if (!category || !item) throw new Error('fixture missing')

    const next = applyEdit(
      DEFAULT_INTERVIEW_CONTENT,
      { type: 'item', categoryId: category.id, itemId: item.id, field: 'answerB' },
      '수정된 B 버전'
    )

    const nextItem = next.categories
      .find((c) => c.id === category.id)
      ?.items.find((i) => i.id === item.id)

    expect(nextItem?.answerB).toBe('수정된 B 버전')
    expect(nextItem?.answer).toBe(item.answer)
  })

  it('leaves content unchanged when the categoryId/itemId does not match anything', () => {
    const next = applyEdit(
      DEFAULT_INTERVIEW_CONTENT,
      { type: 'item', categoryId: 'nonexistent', itemId: 'nonexistent', field: 'answer' },
      '무시되어야 함'
    )

    expect(next).toEqual(DEFAULT_INTERVIEW_CONTENT)
  })
})
