import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler, { parseCookie, signSession, verifySession } from './morning-signal-todo'

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
