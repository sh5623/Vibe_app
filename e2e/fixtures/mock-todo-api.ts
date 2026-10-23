import type { Page } from '@playwright/test'
import type { Attachment, ListResponse, Todo, TodoStatus } from '../../api/morning-signal-todo'

// `pnpm dev` 는 api/ 를 서빙하지 않는다 — /api/morning-signal-todo 를 메모리 상태로 흉내 낸다.
// 쿠키 대신 state.unlocked 플래그를 쓴다. 기존 mockApi(`**/api/morning-signal**`)와 패턴이 겹치므로
// 반드시 mockApi 다음에 등록한다(Playwright 는 나중에 등록한 route 가 먼저 맞는다).

const STORAGE = 'https://example.supabase.co/storage/v1'
const PAGE = 20
// 1×1 투명 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export interface MockTodoState {
  todos: Todo[]
  unlocked: boolean
  pin: string
  lockedUntil: string | null
  fails: number
  notConfigured: boolean
  /** 다음 한 번의 해당 op 를 이 응답으로 실패시킨다 */
  failNext: { op: string; status: number; error: string } | null
  uploadFail: boolean
  uploads: number
  creates: number
}

let seq = 0
function id(): string {
  seq += 1
  return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`
}

export function makeTodo(over: Partial<Todo> = {}): Todo {
  const at = over.createdAt ?? '2026-10-23T01:00:00.000Z'
  return {
    id: id(),
    title: '할 일',
    body: null,
    link: null,
    dueDate: null,
    dueTime: null,
    status: 'todo',
    attachments: [],
    createdDate: '2026-10-23',
    createdAt: at,
    updatedAt: at,
    doneAt: null,
    ...over,
  }
}

/** 오늘(createdDate=today) 할 일 n 개 — 1분 간격, 앞쪽일수록 최근. 전부 DONE(남은 일에 안 섞이게). */
export function makeTodos(n: number, today = '2026-10-23'): Todo[] {
  return Array.from({ length: n }, (_, i) =>
    makeTodo({
      title: `기록 ${i + 1}`,
      status: 'done',
      createdDate: today,
      createdAt: new Date(Date.parse(`${today}T02:00:00.000Z`) - i * 60_000).toISOString(),
    })
  )
}

function order(todos: Todo[]): Todo[] {
  return [...todos].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
  )
}

function kstToday(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10)
}

export async function mockTodoApi(
  page: Page,
  opts: {
    pin?: string
    seed?: Todo[]
    locked?: boolean
    unlocked?: boolean
    notConfigured?: boolean
  } = {}
): Promise<MockTodoState> {
  const state: MockTodoState = {
    todos: [...(opts.seed ?? [])],
    unlocked: opts.unlocked ?? false,
    pin: opts.pin ?? '1234',
    lockedUntil: opts.locked ? new Date(Date.now() + 9 * 60_000).toISOString() : null,
    fails: 0,
    notConfigured: opts.notConfigured ?? false,
    failNext: null,
    uploadFail: false,
    uploads: 0,
    creates: 0,
  }

  await page.route(`${STORAGE}/**`, async (route) => {
    const req = route.request()
    if (req.method() === 'PUT') {
      state.uploads += 1
      await route.fulfill(
        state.uploadFail ? { status: 500, json: { error: 'boom' } } : { json: { Key: 'ok' } }
      )
      return
    }
    await route.fulfill({ contentType: 'image/png', body: PNG })
  })

  await page.route('**/api/morning-signal-todo**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const op = url.searchParams.get('op') ?? ''
    const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
    const send = (status: number, json: unknown) => route.fulfill({ status, json })

    if (state.notConfigured) return send(503, { error: 'TODO_NOT_CONFIGURED' })
    if (state.failNext && state.failNext.op === op) {
      const f = state.failNext
      state.failNext = null
      if (f.error === 'LOCKED_SESSION') state.unlocked = false
      return send(f.status, { error: f.error })
    }
    const locked =
      state.lockedUntil && Date.parse(state.lockedUntil) > Date.now() ? state.lockedUntil : null

    if (op === 'session') return send(200, { unlocked: state.unlocked, lockedUntil: locked })
    if (op === 'unlock') {
      if (locked) return send(429, { error: 'TOO_MANY', until: locked })
      if (typeof body.pin !== 'string' || !/^\d{4}$/.test(body.pin))
        return send(400, { error: 'INVALID_PIN' })
      if (body.pin === state.pin) {
        state.unlocked = true
        state.fails = 0
        return send(200, { ok: true })
      }
      state.fails += 1
      if (state.fails >= 5) {
        state.fails = 0
        state.lockedUntil = new Date(Date.now() + 10 * 60_000).toISOString()
        return send(429, { error: 'TOO_MANY', until: state.lockedUntil })
      }
      return send(401, { error: 'WRONG_PIN', left: 5 - state.fails })
    }
    if (op === 'lock') {
      state.unlocked = false
      return send(200, { ok: true })
    }
    if (!state.unlocked) return send(401, { error: 'LOCKED_SESSION' })

    if (op === 'list') {
      const all = order(state.todos)
      const cursor = url.searchParams.get('cursor')
      const start = cursor ? Number(cursor) : 0
      const items = all.slice(start, start + PAGE)
      const dayCounts: ListResponse['dayCounts'] = {}
      for (const d of new Set(items.map((t) => t.createdDate))) {
        const day = state.todos.filter((t) => t.createdDate === d)
        dayCounts[d] = { done: day.filter((t) => t.status === 'done').length, total: day.length }
      }
      const res: ListResponse = {
        items,
        nextCursor: start + PAGE < all.length ? String(start + PAGE) : null,
        dayCounts,
      }
      if (!cursor) res.pending = all.filter((t) => t.status !== 'done')
      return send(200, res)
    }
    const tid = url.searchParams.get('id')
    const found = state.todos.find((t) => t.id === tid)
    if (op === 'get') {
      if (!found) return send(404, { error: 'NOT_FOUND' })
      const attachments = found.attachments.map((a) => ({
        ...a,
        url: `${STORAGE}/object/sign/ms-todo/${a.path}?token=v`,
      }))
      return send(200, { todo: { ...found, attachments } })
    }
    if (op === 'create') {
      if (typeof body.title !== 'string' || !body.title.trim())
        return send(400, { error: 'INVALID_PAYLOAD' })
      state.creates += 1
      const now = new Date().toISOString()
      let link = typeof body.link === 'string' && body.link ? body.link : null
      if (link && !/^https?:\/\//.test(link)) link = `https://${link}`
      if (link) link = new URL(link).href
      const todo = makeTodo({
        title: body.title.trim(),
        body: typeof body.body === 'string' && body.body ? body.body : null,
        link,
        dueDate: (body.dueDate as string | null | undefined) ?? null,
        dueTime: (body.dueTime as string | null | undefined) ?? null,
        attachments: (body.attachments as Attachment[] | undefined) ?? [],
        createdDate: kstToday(),
        createdAt: now,
      })
      state.todos.push(todo)
      return send(200, { todo })
    }
    if (op === 'update') {
      if (!found) return send(404, { error: 'NOT_FOUND' })
      const p = body as Partial<Todo>
      Object.assign(found, p, { updatedAt: new Date().toISOString() })
      if (p.status) found.doneAt = p.status === 'done' ? new Date().toISOString() : null
      if (p.status) found.status = p.status as TodoStatus
      return send(200, { todo: found })
    }
    if (op === 'delete') {
      if (!found) return send(404, { error: 'NOT_FOUND' })
      state.todos = state.todos.filter((t) => t !== found)
      return send(200, { ok: true })
    }
    if (op === 'upload-url') {
      const path = `todos/${id()}/${String(body.name ?? 'file').replace(/[^A-Za-z0-9._-]+/g, '-')}`
      return send(200, { path, uploadUrl: `${STORAGE}/object/upload/sign/ms-todo/${path}?token=t` })
    }
    return send(405, { error: 'Method Not Allowed' })
  })

  return state
}
