import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler, {
  decodeCursor,
  encodeCursor,
  type ListResponse,
  normalizeLink,
  parseCookie,
  signSession,
  type Todo,
  verifySession,
} from './morning-signal-todo'

const ORIGINAL_ENV = { ...process.env }
const SECRET = 's'.repeat(32)
const NOW = new Date('2026-10-23T00:00:00Z').getTime()

type MockRequest = IncomingMessage & { query: Record<string, string | string[]> }

function makeReq(
  method: string,
  opts: {
    body?: unknown
    raw?: string
    query?: Record<string, string | string[]>
    cookie?: string
  } = {}
): MockRequest {
  const emitter = new EventEmitter() as unknown as MockRequest
  const headers: Record<string, string> = {}
  if (opts.cookie !== undefined) headers.cookie = opts.cookie
  Object.assign(emitter, { method, query: opts.query ?? {}, headers, pause: () => {} })
  queueMicrotask(() => {
    const raw = opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined)
    if (raw !== undefined) emitter.emit('data', Buffer.from(raw))
    emitter.emit('end')
  })
  return emitter
}

function makeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string | string[]>,
    body: '',
    setHeader(key: string, value: string | string[]) {
      res.headers[key] = value
    },
    end(chunk?: string) {
      res.body = chunk ?? ''
    },
  }
  return res as unknown as ServerResponse & {
    statusCode: number
    headers: Record<string, string | string[]>
    body: string
  }
}

function okJson(data: unknown) {
  return { ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) }
}

function failJson(status: number, text: string) {
  return { ok: false, status, json: async () => ({}), text: async () => text }
}

const REST = 'https://example.supabase.co/rest/v1'

async function call(req: MockRequest) {
  const res = makeRes()
  await handler(req, res)
  return { res, body: res.body ? (JSON.parse(res.body) as Record<string, unknown>) : null }
}

function validCookie(pin = '1234', exp = NOW + 60_000) {
  return `ms_todo=${signSession(exp, SECRET, pin)}`
}

interface Call {
  url: string
  method: string
  body: unknown
}

describe('session token', () => {
  it('signSession/verifySession round-trip', () => {
    const token = signSession(NOW + 1000, SECRET, '1234')
    expect(verifySession(token, NOW, SECRET, '1234')).toBe(true)
    expect(verifySession(token, NOW + 1001, SECRET, '1234')).toBe(false)
    expect(verifySession(token, NOW, SECRET, '9999')).toBe(false)
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')
    expect(verifySession(tampered, NOW, SECRET, '1234')).toBe(false)
    expect(verifySession(undefined, NOW, SECRET, '1234')).toBe(false)
    expect(verifySession('abc', NOW, SECRET, '1234')).toBe(false)
  })

  it('parseCookie finds value among others', () => {
    expect(parseCookie('a=1; ms_todo=x.y; b=2', 'ms_todo')).toBe('x.y')
    expect(parseCookie('a=1', 'ms_todo')).toBeUndefined()
    expect(parseCookie(undefined, 'ms_todo')).toBeUndefined()
  })
})

describe('handler — lock', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let calls: Call[]
  let authRow: { fails: number; locked_until: string | null }
  let rpcRow: { fails: number; locked_until: string | null }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.MS_TODO_PIN = '1234'
    process.env.MS_TODO_SECRET = SECRET
    calls = []
    authRow = { fails: 0, locked_until: null }
    rpcRow = { fails: 1, locked_until: null }
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      if (url.includes('/rpc/ms_todo_fail')) return okJson(rpcRow)
      if (url.includes('/ms_todo_auth') && method === 'GET') return okJson([authRow])
      return okJson([])
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('session without cookie is locked', async () => {
    const { res, body } = await call(makeReq('GET', { query: { op: 'session' } }))
    expect(res.statusCode).toBe(200)
    expect(body).toEqual({ unlocked: false, lockedUntil: null })
  })

  it('session with valid cookie is unlocked', async () => {
    const { body } = await call(makeReq('GET', { query: { op: 'session' }, cookie: validCookie() }))
    expect(body).toEqual({ unlocked: true, lockedUntil: null })
  })

  it('session reports active lockout', async () => {
    authRow = { fails: 0, locked_until: '2026-10-23T00:05:00+00:00' }
    const { body } = await call(makeReq('GET', { query: { op: 'session' } }))
    expect(body).toEqual({ unlocked: false, lockedUntil: '2026-10-23T00:05:00.000Z' })
  })

  it('session ignores an expired lockout', async () => {
    authRow = { fails: 0, locked_until: '2026-10-22T23:00:00Z' }
    const { body } = await call(makeReq('GET', { query: { op: 'session' } }))
    expect(body).toEqual({ unlocked: false, lockedUntil: null })
  })

  it('unlock with right pin sets cookie and resets fails', async () => {
    const { res, body } = await call(
      makeReq('POST', { query: { op: 'unlock' }, body: { pin: '1234' } })
    )
    expect(res.statusCode).toBe(200)
    expect(body).toEqual({ ok: true })
    const cookie = String(res.headers['Set-Cookie'])
    expect(cookie.startsWith('ms_todo=')).toBe(true)
    expect(cookie).toContain('HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400')
    const token = cookie.slice('ms_todo='.length).split(';')[0]
    expect(verifySession(token, NOW + 86_399_000, SECRET, '1234')).toBe(true)
    expect(verifySession(token, NOW + 86_401_000, SECRET, '1234')).toBe(false)
    const patch = calls.find((c) => c.method === 'PATCH')
    expect(patch?.url).toBe(`${REST}/ms_todo_auth?id=eq.1`)
    expect(patch?.body).toEqual({ fails: 0, locked_until: null })
  })

  it('unlock with wrong pin returns left', async () => {
    rpcRow = { fails: 2, locked_until: null }
    const { res, body } = await call(
      makeReq('POST', { query: { op: 'unlock' }, body: { pin: '0000' } })
    )
    expect(res.statusCode).toBe(401)
    expect(body).toEqual({ error: 'WRONG_PIN', left: 3 })
    expect(calls.some((c) => c.method === 'POST' && c.url === `${REST}/rpc/ms_todo_fail`)).toBe(
      true
    )
    expect(res.headers['Set-Cookie']).toBeUndefined()
  })

  it('fifth failure locks', async () => {
    rpcRow = { fails: 0, locked_until: '2026-10-23T00:10:00+00:00' }
    const { res, body } = await call(
      makeReq('POST', { query: { op: 'unlock' }, body: { pin: '0000' } })
    )
    expect(res.statusCode).toBe(429)
    expect(body).toEqual({ error: 'TOO_MANY', until: '2026-10-23T00:10:00.000Z' })
  })

  it('right pin is refused while locked', async () => {
    authRow = { fails: 0, locked_until: '2026-10-23T00:05:00Z' }
    const { res, body } = await call(
      makeReq('POST', { query: { op: 'unlock' }, body: { pin: '1234' } })
    )
    expect(res.statusCode).toBe(429)
    expect(body).toEqual({ error: 'TOO_MANY', until: '2026-10-23T00:05:00.000Z' })
    expect(calls.some((c) => c.method !== 'GET')).toBe(false)
    expect(res.headers['Set-Cookie']).toBeUndefined()
  })

  it('malformed pin is 400', async () => {
    for (const pin of ['12a4', '12345', 1234, '']) {
      const { res, body } = await call(makeReq('POST', { query: { op: 'unlock' }, body: { pin } }))
      expect(res.statusCode).toBe(400)
      expect(body).toEqual({ error: 'INVALID_PIN' })
    }
    expect(calls.some((c) => c.method !== 'GET')).toBe(false)
  })

  it('not configured is 503', async () => {
    process.env.MS_TODO_PIN = ''
    const a = await call(makeReq('POST', { query: { op: 'unlock' }, body: { pin: '1234' } }))
    expect(a.res.statusCode).toBe(503)
    expect(a.body).toEqual({ error: 'TODO_NOT_CONFIGURED' })
    process.env.MS_TODO_PIN = '1234'
    process.env.MS_TODO_SECRET = 'short'
    const b = await call(makeReq('GET', { query: { op: 'session' } }))
    expect(b.res.statusCode).toBe(503)
    expect(b.body).toEqual({ error: 'TODO_NOT_CONFIGURED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lock clears cookie', async () => {
    const { res, body } = await call(makeReq('POST', { query: { op: 'lock' } }))
    expect(res.statusCode).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(String(res.headers['Set-Cookie'])).toContain('Max-Age=0')
  })

  it('other ops need a session', async () => {
    const { res, body } = await call(makeReq('GET', { query: { op: 'list' } }))
    expect(res.statusCode).toBe(401)
    expect(body).toEqual({ error: 'LOCKED_SESSION' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('pin change invalidates sessions', async () => {
    const cookie = validCookie('1234')
    process.env.MS_TODO_PIN = '5678'
    const { res } = await call(makeReq('GET', { query: { op: 'list' }, cookie }))
    expect(res.statusCode).toBe(401)
  })

  it('responses are no-store', async () => {
    const a = await call(makeReq('GET', { query: { op: 'session' } }))
    const b = await call(makeReq('GET', { query: { op: 'list' } }))
    expect(a.res.headers['Cache-Control']).toBe('no-store')
    expect(b.res.headers['Cache-Control']).toBe('no-store')
  })

  it('unknown op or method is 405', async () => {
    const a = await call(makeReq('GET', { query: { op: 'nope' }, cookie: validCookie() }))
    const b = await call(makeReq('PUT', { query: { op: 'session' } }))
    expect(a.res.statusCode).toBe(405)
    expect(b.res.statusCode).toBe(405)
  })

  it('supabase failure on unlock is 503 without detail', async () => {
    fetchMock.mockImplementation(async () => failJson(500, 'secret detail'))
    const { res } = await call(makeReq('POST', { query: { op: 'unlock' }, body: { pin: '1234' } }))
    expect(res.statusCode).toBe(503)
    expect(res.body).not.toContain('secret detail')
  })
})

// ── Task 2: CRUD·목록 ───────────────────────────────────────────────────

function uuid(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

interface Row {
  id: string
  title: string
  body: string | null
  link: string | null
  due_date: string | null
  due_time: string | null
  status: string
  attachments: unknown[]
  created_date: string
  created_at: string
  updated_at: string
  done_at: string | null
}

function row(n: number, over: Partial<Row> = {}): Row {
  const at = `2026-10-23T01:${String(59 - n).padStart(2, '0')}:00.123456+00:00`
  return {
    id: uuid(n),
    title: `할 일 ${n}`,
    body: null,
    link: null,
    due_date: null,
    due_time: null,
    status: 'todo',
    attachments: [],
    created_date: '2026-10-23',
    created_at: at,
    updated_at: at,
    done_at: null,
    ...over,
  }
}

describe('helpers — Task 2', () => {
  it('normalizeLink', () => {
    expect(normalizeLink('naver.com')).toBe('https://naver.com/')
    expect(normalizeLink(' https://a.b/c ')).toBe('https://a.b/c')
    expect(normalizeLink('http://a.b')).toBe('http://a.b/')
    expect(normalizeLink('javascript:alert(1)')).toBeNull()
    expect(normalizeLink('ftp://x')).toBeNull()
    expect(normalizeLink('http://')).toBeNull()
  })

  it('cursor round-trip', () => {
    const c = encodeCursor('2026-10-23T01:00:00.123456+00:00', 'u1')
    expect(decodeCursor(c)).toEqual({ createdAt: '2026-10-23T01:00:00.123456+00:00', id: 'u1' })
    expect(decodeCursor('@@')).toBeNull()
    expect(decodeCursor(Buffer.from('{"a":1}').toString('base64url'))).toBeNull()
  })
})

describe('handler — Task 2 CRUD', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let calls: Call[]
  let itemRows: Row[]
  let pendingRows: Row[]
  let countRows: Array<{ created_date: string; status: string }>
  let returned: Row[]
  const cookie = () => validCookie()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.MS_TODO_PIN = '1234'
    process.env.MS_TODO_SECRET = SECRET
    calls = []
    itemRows = []
    pendingRows = []
    countRows = []
    returned = [row(1)]
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      if (method !== 'GET') return okJson(returned)
      if (url.includes('status=neq.done')) return okJson(pendingRows)
      if (url.includes('select=created_date,status')) return okJson(countRows)
      if (url.includes('limit=21')) return okJson(itemRows)
      if (url.includes('id=eq.')) return okJson(returned)
      return okJson([])
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('list first page returns pending, 20 items, cursor, dayCounts', async () => {
    itemRows = Array.from({ length: 21 }, (_, i) => row(i + 1))
    pendingRows = [row(30, { status: 'in_progress' })]
    countRows = [
      { created_date: '2026-10-23', status: 'done' },
      { created_date: '2026-10-23', status: 'todo' },
      { created_date: '2026-10-23', status: 'in_progress' },
    ]
    const { res, body } = await call(makeReq('GET', { query: { op: 'list' }, cookie: cookie() }))
    expect(res.statusCode).toBe(200)
    const list = body as unknown as ListResponse
    expect(list.items).toHaveLength(20)
    expect(list.items[0]).toMatchObject({
      id: uuid(1),
      title: '할 일 1',
      createdDate: '2026-10-23',
    })
    expect(list.items[0]?.createdAt).toBe('2026-10-23T01:58:00.123Z')
    const twentieth = itemRows[19]
    expect(list.nextCursor).toBe(encodeCursor(twentieth?.created_at ?? '', twentieth?.id ?? ''))
    expect(list.pending).toHaveLength(1)
    expect(list.pending?.[0]?.status).toBe('in_progress')
    expect(list.dayCounts).toEqual({ '2026-10-23': { done: 1, total: 3 } })
    const itemsCall = calls.find((c) => c.url.includes('limit=21'))
    expect(itemsCall?.url).toContain(
      `${REST}/ms_todos?select=*&order=created_at.desc,id.desc&limit=21`
    )
    expect(calls.find((c) => c.url.includes('select=created_date,status'))?.url).toContain(
      'created_date=in.(2026-10-23)'
    )
  })

  it('list next page uses keyset and omits pending', async () => {
    itemRows = [row(1), row(2)]
    const cur = encodeCursor('2026-10-23T01:00:00.123456+00:00', uuid(9))
    const { body } = await call(
      makeReq('GET', { query: { op: 'list', cursor: cur }, cookie: cookie() })
    )
    const list = body as unknown as ListResponse
    expect(list.pending).toBeUndefined()
    expect(list.nextCursor).toBeNull()
    expect(list.items).toHaveLength(2)
    const ts = '2026-10-23T01:00:00.123456+00:00'
    const or = encodeURIComponent(`(created_at.lt.${ts},and(created_at.eq.${ts},id.lt.${uuid(9)}))`)
    expect(calls.find((c) => c.url.includes('limit=21'))?.url).toContain(`&or=${or}`)
    expect(calls.some((c) => c.url.includes('status=neq.done'))).toBe(false)
  })

  it('list with empty page skips dayCounts query', async () => {
    const { body } = await call(makeReq('GET', { query: { op: 'list' }, cookie: cookie() }))
    expect((body as unknown as ListResponse).dayCounts).toEqual({})
    expect(calls.some((c) => c.url.includes('select=created_date,status'))).toBe(false)
  })

  it('list with bad cursor is 400', async () => {
    const { res, body } = await call(
      makeReq('GET', { query: { op: 'list', cursor: '@@' }, cookie: cookie() })
    )
    expect(res.statusCode).toBe(400)
    expect(body).toEqual({ error: 'INVALID_CURSOR' })
  })

  it('create stamps KST createdDate across UTC midnight', async () => {
    vi.setSystemTime(new Date('2026-10-22T15:30:00Z'))
    const { res, body } = await call(
      makeReq('POST', {
        query: { op: 'create' },
        body: { title: '  장보기  ' },
        cookie: `ms_todo=${signSession(Date.now() + 60_000, SECRET, '1234')}`,
      })
    )
    expect(res.statusCode).toBe(200)
    const sent = calls.find((c) => c.method === 'POST')
    expect(sent?.url).toBe(`${REST}/ms_todos`)
    expect(sent?.body).toMatchObject({
      title: '장보기',
      status: 'todo',
      created_date: '2026-10-23',
      body: null,
      link: null,
      due_date: null,
      due_time: null,
      attachments: [],
    })
    expect((body as { todo: Todo }).todo.id).toBe(uuid(1))
  })

  it('create validates', async () => {
    const bad = [
      { title: '   ' },
      { title: 'a'.repeat(201) },
      { title: 't', dueTime: '10:00' },
      { title: 't', dueDate: '2026-10-27', dueTime: '24:00' },
      { title: 't', dueDate: '2026-02-30' },
      { title: 't', body: 'b'.repeat(4001) },
    ]
    for (const b of bad) {
      const { res, body } = await call(
        makeReq('POST', { query: { op: 'create' }, body: b, cookie: cookie() })
      )
      expect(res.statusCode, JSON.stringify(b)).toBe(400)
      expect(body?.error).toBe('INVALID_PAYLOAD')
    }
    const link = await call(
      makeReq('POST', {
        query: { op: 'create' },
        body: { title: 't', link: 'javascript:x' },
        cookie: cookie(),
      })
    )
    expect(link.res.statusCode).toBe(400)
    expect(link.body).toEqual({ error: 'INVALID_LINK' })
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('create keeps fields and maps empty strings to null', async () => {
    await call(
      makeReq('POST', {
        query: { op: 'create' },
        body: {
          title: 't',
          body: '',
          link: 'culture.example.com',
          dueDate: '2026-10-27',
          dueTime: '10:00',
        },
        cookie: cookie(),
      })
    )
    expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      body: null,
      link: 'https://culture.example.com/',
      due_date: '2026-10-27',
      due_time: '10:00',
    })
  })

  it('update to done stamps done_at, leaving done clears it', async () => {
    await call(
      makeReq('PATCH', {
        query: { op: 'update', id: uuid(1) },
        body: { status: 'done' },
        cookie: cookie(),
      })
    )
    const a = calls.find((c) => c.method === 'PATCH')
    expect(a?.url).toBe(`${REST}/ms_todos?id=eq.${uuid(1)}`)
    expect(a?.body).toEqual({
      status: 'done',
      done_at: '2026-10-23T00:00:00.000Z',
      updated_at: '2026-10-23T00:00:00.000Z',
    })
    calls = []
    await call(
      makeReq('PATCH', {
        query: { op: 'update', id: uuid(1) },
        body: { status: 'todo' },
        cookie: cookie(),
      })
    )
    expect(calls.find((c) => c.method === 'PATCH')?.body).toMatchObject({
      status: 'todo',
      done_at: null,
    })
  })

  it('update with dueDate null also clears dueTime', async () => {
    await call(
      makeReq('PATCH', {
        query: { op: 'update', id: uuid(1) },
        body: { dueDate: null },
        cookie: cookie(),
      })
    )
    expect(calls.find((c) => c.method === 'PATCH')?.body).toMatchObject({
      due_date: null,
      due_time: null,
    })
  })

  it('update rejects dueTime without dueDate and bad ids', async () => {
    const a = await call(
      makeReq('PATCH', {
        query: { op: 'update', id: uuid(1) },
        body: { dueTime: '10:00' },
        cookie: cookie(),
      })
    )
    expect(a.res.statusCode).toBe(400)
    const b = await call(
      makeReq('PATCH', {
        query: { op: 'update', id: 'nope' },
        body: { status: 'done' },
        cookie: cookie(),
      })
    )
    expect(b.res.statusCode).toBe(400)
    expect(b.body).toEqual({ error: 'INVALID_ID' })
    const c = await call(
      makeReq('PATCH', {
        query: { op: 'update', id: uuid(1) },
        body: { status: 'later' },
        cookie: cookie(),
      })
    )
    expect(c.res.statusCode).toBe(400)
    expect(calls.some((x) => x.method === 'PATCH')).toBe(false)
  })

  it('update of missing row is 404', async () => {
    returned = []
    const { res, body } = await call(
      makeReq('PATCH', {
        query: { op: 'update', id: uuid(1) },
        body: { status: 'done' },
        cookie: cookie(),
      })
    )
    expect(res.statusCode).toBe(404)
    expect(body).toEqual({ error: 'NOT_FOUND' })
  })

  it('get returns one todo or 404', async () => {
    const a = await call(makeReq('GET', { query: { op: 'get', id: uuid(1) }, cookie: cookie() }))
    expect((a.body as { todo: Todo }).todo.title).toBe('할 일 1')
    returned = []
    const b = await call(makeReq('GET', { query: { op: 'get', id: uuid(1) }, cookie: cookie() }))
    expect(b.res.statusCode).toBe(404)
  })

  it('delete removes row', async () => {
    const { res, body } = await call(
      makeReq('DELETE', { query: { op: 'delete', id: uuid(1) }, cookie: cookie() })
    )
    expect(res.statusCode).toBe(200)
    expect(body).toEqual({ ok: true })
    const del = calls.find((c) => c.method === 'DELETE')
    expect(del?.url).toBe(`${REST}/ms_todos?id=eq.${uuid(1)}`)
  })

  it('maps due_time seconds away', async () => {
    returned = [
      row(1, {
        due_date: '2026-10-27',
        due_time: '10:00:00',
        status: 'done',
        done_at: '2026-10-23T00:00:00+00:00',
      }),
    ]
    const { body } = await call(
      makeReq('GET', { query: { op: 'get', id: uuid(1) }, cookie: cookie() })
    )
    expect((body as { todo: Todo }).todo).toMatchObject({
      dueDate: '2026-10-27',
      dueTime: '10:00',
      status: 'done',
      doneAt: '2026-10-23T00:00:00.000Z',
    })
  })

  it('supabase failure is 503 without detail', async () => {
    fetchMock.mockImplementation(async () => failJson(500, 'secret detail'))
    const { res } = await call(makeReq('GET', { query: { op: 'list' }, cookie: cookie() }))
    expect(res.statusCode).toBe(503)
    expect(res.body).not.toContain('secret detail')
  })
})
