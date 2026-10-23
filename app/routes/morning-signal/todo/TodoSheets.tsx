import {
  type ChangeEvent,
  type ReactNode,
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  TodoApiError,
  uploadAttachment,
  useCreateTodo,
  useDeleteTodo,
  useTodoDetail,
  useUpdateTodo,
} from '@/hooks/use-morning-signal-todo'
import type { Attachment, Todo, TodoStatus } from '../../../../api/morning-signal-todo'
import { dueText, STATUS_LABEL } from './todo-model'

// 아래에서 올라오는 시트들 — 시안 todo-list.html 의 .sheet·.opt·.segs.

const STATUSES: TodoStatus[] = ['todo', 'in_progress', 'done']

export const SAVE_FAILED = '저장하지 못했어요. 다시 시도해 주세요.'
const BAD_FILE = '사진이나 PDF만, 파일당 10MB까지 올릴 수 있어요.'
const BAD_LINK = '링크 주소를 확인해 주세요.'
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 5
const ACCEPT = 'image/*,application/pdf'

type Notify = (message: string) => void

/** 세션이 끝난 실패(→ PIN 화면으로 돌아감)는 알리지 않는다 */
function failMessage(e: unknown): string | null {
  if (e instanceof TodoApiError && e.code === 'LOCKED_SESSION') return null
  if (e instanceof TodoApiError && e.code === 'INVALID_LINK') return BAD_LINK
  return SAVE_FAILED
}

/** 상태 → 줄·아이콘 클래스 접미사 */
export function statusClass(s: TodoStatus): 'todo' | 'progress' | 'done' {
  return s === 'in_progress' ? 'progress' : s
}

/** 빈 원(TODO) → 반 찬 원(IN PROGRESS) → 초록 체크(DONE). 색·모양은 부모의 .s-* 클래스가 정한다. */
export function StatusIcon() {
  return (
    <svg className="si" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle className="si-ring" cx="10" cy="10" r="8.5" />
      <path className="si-pie" d="M10 4.6a5.4 5.4 0 0 1 0 10.8z" />
      <circle className="si-disc" cx="10" cy="10" r="9.6" />
      <path className="si-chk" d="M6.2 10.3l2.6 2.6 5-5.2" />
    </svg>
  )
}

const EXIT_MS = 320

interface SheetProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/** 시트 껍데기 — 배경을 누르거나 Escape 로 닫힌다. 닫힐 때 내려가는 모션이 끝난 뒤 내용을 뗀다. */
export function Sheet({ open, onClose, label, children }: SheetProps) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      // 붙인 다음 프레임에 올려야 transition 이 걸린다
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    const t = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (shown)
      panelRef.current
        ?.querySelector<HTMLElement>('[data-autofocus], button, input, textarea')
        ?.focus({ preventScroll: true })
  }, [shown])

  if (!mounted) return null
  return (
    <div className={`todo-sheet${shown ? ' on' : ''}`}>
      <button
        type="button"
        className="todo-dim"
        onClick={onClose}
        aria-label="닫기"
        tabIndex={-1}
      />
      <div className="todo-panel" role="dialog" aria-modal="true" aria-label={label} ref={panelRef}>
        <div className="todo-handle" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

interface StatusSheetProps {
  todo: Todo | null
  onPick: (s: TodoStatus) => void
  onClose: () => void
}

export function StatusSheet({ todo, onPick, onClose }: StatusSheetProps) {
  // 닫히는 동안에도 마지막 할 일을 보여 준다
  const last = useRef<Todo | null>(todo)
  if (todo) last.current = todo
  const t = todo ?? last.current
  return (
    <Sheet open={!!todo} onClose={onClose} label="상태 바꾸기">
      {t && (
        <div className="todo-opts">
          <p className="todo-opts-t">{t.title}</p>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`todo-opt s-${statusClass(s)}`}
              onClick={() => onPick(s)}
            >
              <StatusIcon />
              <span>{STATUS_LABEL[s]}</span>
              {s === t.status && <em>현재</em>}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  )
}

// ── 첨부(만들기·수정 공용) ──────────────────────────────────────────────

interface FileItem {
  key: number
  name: string
  /** 사진이면 미리보기 주소(blob: 또는 서명 주소) */
  preview: string | null
  /** 업로드가 끝난 첨부. null 이면 올리는 중 */
  att: Attachment | null
}

const isImage = (type: string) => type.startsWith('image/')
const isAllowed = (f: File) =>
  ((isImage(f.type) && f.type !== 'image/svg+xml') || f.type === 'application/pdf') &&
  f.size > 0 &&
  f.size <= MAX_FILE_BYTES

let fileKey = 0

function fromAttachments(list: Attachment[]): FileItem[] {
  return list.map((a) => {
    fileKey += 1
    return { key: fileKey, name: a.name, preview: isImage(a.type) ? (a.url ?? null) : null, att: a }
  })
}

/** 고르는 즉시 서명 주소로 올린다. 실패한 파일은 목록에서 빼고 알린다. */
function useAttachments(notify: Notify, initial: Attachment[] = []) {
  const [files, setFiles] = useState<FileItem[]>(() => fromAttachments(initial))

  const add = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = [...(e.target.files ?? [])]
    e.target.value = ''
    const room = MAX_FILES - files.length
    const ok = picked.filter(isAllowed).slice(0, Math.max(0, room))
    if (ok.length < picked.length) notify(BAD_FILE)
    for (const f of ok) {
      fileKey += 1
      const key = fileKey
      const preview = isImage(f.type) ? URL.createObjectURL(f) : null
      setFiles((xs) => [...xs, { key, name: f.name, preview, att: null }])
      uploadAttachment(f).then(
        (att) => setFiles((xs) => xs.map((x) => (x.key === key ? { ...x, att } : x))),
        (err: unknown) => {
          if (preview) URL.revokeObjectURL(preview)
          setFiles((xs) => xs.filter((x) => x.key !== key))
          const m = failMessage(err)
          if (m) notify(m)
        }
      )
    }
  }
  const remove = (key: number) => setFiles((xs) => xs.filter((x) => x.key !== key))
  const reset = (list: Attachment[] = []) => setFiles(fromAttachments(list))

  return {
    files,
    add,
    remove,
    reset,
    uploading: files.some((x) => !x.att),
    attachments: files.flatMap((x) =>
      x.att ? [{ path: x.att.path, name: x.att.name, type: x.att.type, size: x.att.size }] : []
    ),
  }
}

function FileList({ files, onRemove }: { files: FileItem[]; onRemove?: (key: number) => void }) {
  if (!files.length) return null
  return (
    <div className="todo-thumbs">
      {files.map((x) => (
        <span key={x.key} className={`todo-file${x.att ? ' done' : ' up'}`}>
          {x.preview ? <img src={x.preview} alt={x.name} /> : <em>📄 {x.name}</em>}
          {!x.att && <i className="todo-file-sp" aria-label="올리는 중" role="status" />}
          {onRemove && x.att && (
            <button type="button" aria-label={`${x.name} 빼기`} onClick={() => onRemove(x.key)}>
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

// ── 할 일 입력칸(만들기·수정 공용) ─────────────────────────────────────

interface Draft {
  title: string
  body: string
  link: string
  date: string
  time: string
}

const emptyDraft: Draft = { title: '', body: '', link: '', date: '', time: '' }

function draftOf(t: Todo): Draft {
  return {
    title: t.title,
    body: t.body ?? '',
    link: t.link ?? '',
    date: t.dueDate ?? '',
    time: t.dueTime ?? '',
  }
}

function payloadOf(d: Draft) {
  return {
    title: d.title.trim(),
    body: d.body.trim() || null,
    link: d.link.trim() || null,
    dueDate: d.date || null,
    // 시간만 있을 수는 없다(서버 규칙) — 날짜가 없으면 시간은 버린다
    dueTime: d.date && d.time ? d.time : null,
  }
}

// ── 만들기 ─────────────────────────────────────────────────────────────

interface CreateSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (t: Todo) => void
  notify: Notify
}

/** 제목 한 줄로 시작하고, 날짜·링크·첨부는 알약을 눌렀을 때만 펼친다(Todoist 빠른 추가 방식) */
export function CreateSheet({ open, onClose, onCreated, notify }: CreateSheetProps) {
  const create = useCreateTodo()
  const [d, setD] = useState<Draft>(emptyDraft)
  const [show, setShow] = useState({ date: false, link: false })
  const files = useAttachments(notify)
  // 연타 방지 — 상태가 다시 그려지기 전에 들어온 두 번째 제출도 막는다
  const busy = useRef(false)
  const done = useRef(false)

  useEffect(() => {
    if (open) done.current = false
  }, [open])

  const set = (k: keyof Draft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((x) => ({ ...x, [k]: e.target.value }))

  const [, submit, isPending] = useActionState(async () => {
    if (busy.current || done.current || !d.title.trim() || files.uploading) return null
    busy.current = true
    try {
      const todo = await create.mutateAsync({ ...payloadOf(d), attachments: files.attachments })
      done.current = true
      setD(emptyDraft)
      setShow({ date: false, link: false })
      files.reset()
      onCreated(todo)
      onClose()
    } catch (e) {
      const m = failMessage(e)
      if (m) notify(m)
    } finally {
      busy.current = false
    }
    return null
  }, null)

  return (
    <Sheet open={open} onClose={onClose} label="할 일 만들기">
      <form className="todo-new" action={submit} noValidate>
        <input
          className="todo-new-t"
          aria-label="제목"
          placeholder="할 일을 입력하세요"
          maxLength={200}
          value={d.title}
          onChange={set('title')}
          data-autofocus
        />
        <textarea
          className="todo-new-b"
          aria-label="메모"
          placeholder="메모 (선택)"
          maxLength={4000}
          value={d.body}
          onChange={set('body')}
        />
        <div className="todo-pills">
          <button
            type="button"
            className={`todo-pill${show.date ? ' on' : ''}`}
            aria-expanded={show.date}
            onClick={() => setShow((s) => ({ ...s, date: !s.date }))}
          >
            📅 날짜
          </button>
          <button
            type="button"
            className={`todo-pill${show.link ? ' on' : ''}`}
            aria-expanded={show.link}
            onClick={() => setShow((s) => ({ ...s, link: !s.link }))}
          >
            🔗 링크
          </button>
          <label className={`todo-pill${files.files.length ? ' on' : ''}`}>
            📎 첨부
            <input type="file" multiple accept={ACCEPT} hidden onChange={files.add} />
          </label>
        </div>
        {show.date && (
          <div className="todo-xf">
            <input type="date" aria-label="날짜" value={d.date} onChange={set('date')} />
            <input
              type="time"
              aria-label="시간"
              value={d.time}
              onChange={set('time')}
              disabled={!d.date}
            />
          </div>
        )}
        {show.link && (
          <div className="todo-xf">
            <input
              type="text"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="링크"
              placeholder="https://"
              maxLength={2000}
              value={d.link}
              onChange={set('link')}
            />
          </div>
        )}
        <FileList files={files.files} onRemove={files.remove} />
        <div className="todo-actions">
          <button
            type="submit"
            className="todo-btn primary"
            disabled={!d.title.trim() || files.uploading || isPending}
          >
            추가
          </button>
        </div>
      </form>
    </Sheet>
  )
}

// ── 상세·수정·삭제 ───────────────────────────────────────────────────────

interface DetailSheetProps {
  id: string | null
  onClose: () => void
  notify: Notify
}

export function DetailSheet({ id, onClose, notify }: DetailSheetProps) {
  // 닫히는 동안에도 마지막 내용을 보여 준다
  const last = useRef<string | null>(id)
  if (id) last.current = id
  const cur = id ?? last.current
  const detail = useTodoDetail(cur)
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm'>('view')

  useEffect(() => {
    if (id) setMode('view')
  }, [id])

  const t = detail.data
  return (
    <Sheet open={!!id} onClose={onClose} label="할 일 상세">
      {!t ? (
        <div className="todo-loader" role="status" aria-label="불러오는 중" />
      ) : mode === 'edit' ? (
        <EditForm key={t.id} t={t} notify={notify} onDone={() => setMode('view')} />
      ) : (
        <DetailView t={t} mode={mode} setMode={setMode} onClose={onClose} notify={notify} />
      )}
    </Sheet>
  )
}

interface DetailViewProps {
  t: Todo
  mode: 'view' | 'confirm'
  setMode: (m: 'view' | 'edit' | 'confirm') => void
  onClose: () => void
  notify: Notify
}

function DetailView({ t, mode, setMode, onClose, notify }: DetailViewProps) {
  const update = useUpdateTodo()
  const del = useDeleteTodo()
  const due = dueText(t)
  const files = fromAttachments(t.attachments)
  const onError = (e: unknown) => {
    const m = failMessage(e)
    if (m) notify(m)
  }

  return (
    <div className="todo-dt">
      <h3>{t.title}</h3>
      <fieldset className="todo-segs">
        <legend className="sr-only">상태</legend>
        {STATUSES.map((s) => (
          <label key={s} className={`seg-${statusClass(s)}${t.status === s ? ' on' : ''}`}>
            <input
              type="radio"
              name={`todo-status-${t.id}`}
              checked={t.status === s}
              onChange={() => update.mutate({ id: t.id, patch: { status: s } }, { onError })}
            />
            {STATUS_LABEL[s]}
          </label>
        ))}
      </fieldset>
      <dl className="todo-kv">
        {due && (
          <div>
            <dt>날짜</dt>
            <dd>{due}</dd>
          </div>
        )}
        {t.link && (
          <div>
            <dt>링크</dt>
            <dd>
              <a href={t.link} target="_blank" rel="noreferrer">
                {t.link}
              </a>
            </dd>
          </div>
        )}
        {files.length > 0 && (
          <div>
            <dt>첨부</dt>
            <dd>
              <div className="todo-thumbs">
                {t.attachments.map((a) => (
                  <a
                    key={a.path}
                    className="todo-file done"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {isImage(a.type) && a.url ? (
                      <img src={a.url} alt={a.name} />
                    ) : (
                      <em>📄 {a.name}</em>
                    )}
                  </a>
                ))}
              </div>
            </dd>
          </div>
        )}
        <div>
          <dt>추가</dt>
          <dd>{dueText({ dueDate: t.createdDate, dueTime: null })}</dd>
        </div>
      </dl>
      {t.body && <p className="todo-note">{t.body}</p>}

      {mode === 'confirm' ? (
        <div className="todo-confirm" role="alert">
          <p>이 할 일을 지울까요?</p>
          <div className="todo-actions">
            <button type="button" className="todo-btn" onClick={() => setMode('view')}>
              취소
            </button>
            <button
              type="button"
              className="todo-btn danger"
              disabled={del.isPending}
              onClick={() => del.mutate(t.id, { onSuccess: onClose, onError })}
            >
              지우기
            </button>
          </div>
        </div>
      ) : (
        <div className="todo-actions">
          <button type="button" className="todo-btn" onClick={() => setMode('confirm')}>
            삭제
          </button>
          <button type="button" className="todo-btn primary" onClick={() => setMode('edit')}>
            수정
          </button>
        </div>
      )}
    </div>
  )
}

function EditForm({ t, notify, onDone }: { t: Todo; notify: Notify; onDone: () => void }) {
  const update = useUpdateTodo()
  const [d, setD] = useState<Draft>(() => draftOf(t))
  const files = useAttachments(notify, t.attachments)
  const set = (k: keyof Draft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((x) => ({ ...x, [k]: e.target.value }))

  const [, save, isPending] = useActionState(async () => {
    if (!d.title.trim() || files.uploading) return null
    try {
      await update.mutateAsync({
        id: t.id,
        patch: { ...payloadOf(d), attachments: files.attachments },
      })
      onDone()
    } catch (e) {
      const m = failMessage(e)
      if (m) notify(m)
    }
    return null
  }, null)

  return (
    <form className="todo-new todo-edit" action={save} noValidate>
      <input
        className="todo-new-t"
        aria-label="제목"
        maxLength={200}
        value={d.title}
        onChange={set('title')}
        data-autofocus
      />
      <textarea
        className="todo-new-b"
        aria-label="메모"
        placeholder="메모 (선택)"
        maxLength={4000}
        value={d.body}
        onChange={set('body')}
      />
      <div className="todo-xf">
        <input type="date" aria-label="날짜" value={d.date} onChange={set('date')} />
        <input
          type="time"
          aria-label="시간"
          value={d.time}
          onChange={set('time')}
          disabled={!d.date}
        />
      </div>
      <div className="todo-xf">
        <input
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="링크"
          placeholder="https://"
          maxLength={2000}
          value={d.link}
          onChange={set('link')}
        />
      </div>
      <FileList files={files.files} onRemove={files.remove} />
      <div className="todo-actions">
        <label className="todo-pill">
          📎 첨부
          <input type="file" multiple accept={ACCEPT} hidden onChange={files.add} />
        </label>
        <button type="button" className="todo-btn" onClick={onDone}>
          취소
        </button>
        <button
          type="submit"
          className="todo-btn primary"
          disabled={!d.title.trim() || files.uploading || isPending}
        >
          저장
        </button>
      </div>
    </form>
  )
}
