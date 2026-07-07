import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, ChevronDown, Loader2, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BirthdayModal } from '@/components/BirthdayModal'
import {
  DEFAULT_INTERVIEW_CONTENT,
  type InterviewCategory,
  type InterviewContent,
  type InterviewQaItem,
} from '@/lib/ahram-content'

const SESSION_KEY = 'ahram-interview-pin'
const QUERY_KEY = ['ahram-content']
const FONT_FAMILY = "'Noto Sans KR', sans-serif"

export type EditTarget =
  | { type: 'root'; field: 'selfIntro' | 'motivation' }
  | { type: 'item'; categoryId: string; itemId: string; field: 'answer' | 'answerB' }

async function fetchAhramContent(): Promise<InterviewContent> {
  const res = await fetch('/api/ahram')
  if (!res.ok) throw new Error('Failed to fetch interview content')
  return res.json() as Promise<InterviewContent>
}

async function saveAhramContent(pin: string, content: InterviewContent): Promise<InterviewContent> {
  const res = await fetch('/api/ahram', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, content }),
  })
  if (!res.ok) throw new Error('Failed to save interview content')
  return res.json() as Promise<InterviewContent>
}

export function applyEdit(
  content: InterviewContent,
  target: EditTarget,
  value: string
): InterviewContent {
  if (target.type === 'root') {
    return { ...content, [target.field]: value }
  }
  return {
    ...content,
    categories: content.categories.map((category) => {
      if (category.id !== target.categoryId) return category
      return {
        ...category,
        items: category.items.map((item) =>
          item.id === target.itemId ? { ...item, [target.field]: value } : item
        ),
      }
    }),
  }
}

export function AhramInterview() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      setPin(saved)
      setIsAuthed(true)
    } else {
      setModalOpen(true)
    }
  }, [])

  const handleConfirm = (birthday: string): boolean => {
    if (birthday === import.meta.env.VITE_BIRTHDAY) {
      sessionStorage.setItem(SESSION_KEY, birthday)
      setPin(birthday)
      setIsAuthed(true)
      setModalOpen(false)
      return true
    }
    return false
  }

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-10" style={{ fontFamily: FONT_FAMILY }}>
      {isAuthed ? (
        <InterviewContentView pin={pin} />
      ) : (
        <div className="mx-auto flex h-96 max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-stone-200/70 bg-white/70 px-8 text-center shadow-sm">
          {!modalOpen && (
            <>
              <p className="text-sm text-stone-500">이 페이지는 생일 인증이 필요합니다.</p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-amber-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-900"
              >
                생일 인증하기
              </button>
            </>
          )}
        </div>
      )}
      <BirthdayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

function InterviewContentView({ pin }: { pin: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAhramContent,
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const content = data ?? DEFAULT_INTERVIEW_CONTENT

  const mutation = useMutation({
    mutationFn: (next: InterviewContent) => saveAhramContent(pin, next),
    onSuccess: (saved) => {
      queryClient.setQueryData(QUERY_KEY, saved)
      setEditingId(null)
    },
  })

  function handleSave(target: EditTarget, value: string) {
    mutation.mutate(applyEdit(content, target, value))
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="px-1">
        <p className="text-xs font-semibold tracking-wider text-amber-700/80 uppercase">
          면접 준비 노트
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">서울아레나컨벤션 예약실 면접</h1>
        <p className="mt-1 text-sm text-stone-500">곽아람</p>
      </header>
      {isPending ? (
        <SkeletonBlock />
      ) : (
        <>
          {isError && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>서버 연결에 실패해 기본 내용을 보여드리고 있어요.</span>
              <button
                type="button"
                onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEY })}
                className="ml-auto font-medium underline underline-offset-2"
              >
                다시 시도
              </button>
            </div>
          )}

          <EditableProse
            id="selfIntro"
            label="1분 자기소개"
            value={content.selfIntro}
            editingId={editingId}
            onEdit={() => setEditingId('selfIntro')}
            onCancel={() => setEditingId(null)}
            onSave={(value) => handleSave({ type: 'root', field: 'selfIntro' }, value)}
            saving={mutation.isPending}
          />

          <EditableProse
            id="motivation"
            label="이직 동기"
            value={content.motivation}
            editingId={editingId}
            onEdit={() => setEditingId('motivation')}
            onCancel={() => setEditingId(null)}
            onSave={(value) => handleSave({ type: 'root', field: 'motivation' }, value)}
            saving={mutation.isPending}
          />

          {content.categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              editingId={editingId}
              onEditStart={setEditingId}
              onEditCancel={() => setEditingId(null)}
              onSaveItem={(itemId, field, value) =>
                handleSave({ type: 'item', categoryId: category.id, itemId, field }, value)
              }
              saving={mutation.isPending}
            />
          ))}

          {mutation.isError && (
            <p className="text-sm text-red-600">저장에 실패했습니다. 다시 시도해주세요.</p>
          )}
        </>
      )}
    </div>
  )
}

function SkeletonBlock() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-24 animate-pulse rounded-2xl bg-amber-100/70" />
      ))}
    </div>
  )
}

function EditableProse({
  id,
  label,
  value,
  editingId,
  onEdit,
  onCancel,
  onSave,
  saving,
}: {
  id: string
  label: string
  value: string
  editingId: string | null
  onEdit: () => void
  onCancel: () => void
  onSave: (value: string) => void
  saving: boolean
}) {
  const [draft, setDraft] = useState(value)
  const isEditing = editingId === id

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-amber-700/80 uppercase">{label}</h2>
        {!isEditing && (
          <button
            type="button"
            aria-label={`${label} 수정`}
            onClick={() => {
              setDraft(value)
              onEdit()
            }}
            className="text-stone-400 transition-colors hover:text-amber-700"
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="w-full resize-y rounded-xl border border-stone-300 p-3 text-sm leading-7 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
            >
              <X className="size-4" /> 취소
            </button>
            <button
              type="button"
              disabled={saving || draft.trim().length === 0}
              onClick={() => onSave(draft.trim())}
              className="flex items-center gap-1 rounded-full bg-amber-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-amber-900 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{' '}
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-[15px] leading-7 text-stone-700">{value}</p>
      )}
    </section>
  )
}

function CategorySection({
  category,
  editingId,
  onEditStart,
  onEditCancel,
  onSaveItem,
  saving,
}: {
  category: InterviewCategory
  editingId: string | null
  onEditStart: (id: string) => void
  onEditCancel: () => void
  onSaveItem: (itemId: string, field: 'answer' | 'answerB', value: string) => void
  saving: boolean
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold tracking-wide text-amber-700/80 uppercase">
        {category.label}
      </h2>
      <div className="flex flex-col gap-2">
        {category.items.map((item) => (
          <QaAccordionItem
            key={item.id}
            item={item}
            editingId={editingId}
            onEditStart={onEditStart}
            onEditCancel={onEditCancel}
            onSave={(field, value) => onSaveItem(item.id, field, value)}
            saving={saving}
          />
        ))}
      </div>
    </section>
  )
}

function QaAccordionItem({
  item,
  editingId,
  onEditStart,
  onEditCancel,
  onSave,
  saving,
}: {
  item: InterviewQaItem
  editingId: string | null
  onEditStart: (id: string) => void
  onEditCancel: () => void
  onSave: (field: 'answer' | 'answerB', value: string) => void
  saving: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [version, setVersion] = useState<'A' | 'B'>('A')
  const [draft, setDraft] = useState('')

  const hasDualAnswer = item.answerB !== undefined
  const editingField: 'answer' | 'answerB' = version === 'B' ? 'answerB' : 'answer'
  const editingKey = `${item.id}:${editingField}`
  const isEditing = editingId === editingKey
  const displayedAnswer = version === 'B' && item.answerB ? item.answerB : item.answer

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-amber-50/60"
      >
        <span className="text-sm font-medium text-stone-800">{item.question}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 px-5 py-4">
              {hasDualAnswer && (
                <div className="mb-3 inline-flex rounded-full border border-stone-200 p-0.5 text-xs">
                  <button
                    type="button"
                    aria-pressed={version === 'A'}
                    onClick={() => {
                      setVersion('A')
                      onEditCancel()
                    }}
                    className={`rounded-full px-3 py-1 transition-colors ${version === 'A' ? 'bg-amber-800 text-white' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    버전 A
                  </button>
                  <button
                    type="button"
                    aria-pressed={version === 'B'}
                    onClick={() => {
                      setVersion('B')
                      onEditCancel()
                    }}
                    className={`rounded-full px-3 py-1 transition-colors ${version === 'B' ? 'bg-amber-800 text-white' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    버전 B
                  </button>
                </div>
              )}

              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    className="w-full resize-y rounded-xl border border-stone-300 p-3 text-sm leading-7 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onEditCancel}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
                    >
                      <X className="size-4" /> 취소
                    </button>
                    <button
                      type="button"
                      disabled={saving || draft.trim().length === 0}
                      onClick={() => onSave(editingField, draft.trim())}
                      className="flex items-center gap-1 rounded-full bg-amber-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-amber-900 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}{' '}
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-line text-[15px] leading-7 text-stone-700">
                    {displayedAnswer}
                  </p>
                  <button
                    type="button"
                    aria-label={`${item.question} 답변 수정`}
                    onClick={() => {
                      setDraft(displayedAnswer)
                      onEditStart(editingKey)
                    }}
                    className="shrink-0 text-stone-400 transition-colors hover:text-amber-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
