import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './otp'

const gmail = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }))

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials() {}
      },
    },
    gmail: () => ({ users: { messages: { list: gmail.list, get: gmail.get } } }),
  },
}))

function makeReq(body: unknown): IncomingMessage {
  const emitter = new EventEmitter() as unknown as IncomingMessage
  ;(emitter as unknown as { method: string }).method = 'POST'
  queueMicrotask(() => {
    emitter.emit('data', Buffer.from(JSON.stringify(body)))
    emitter.emit('end')
  })
  return emitter
}

function makeRes() {
  const res = {
    statusCode: 0,
    body: '',
    setHeader() {},
    end(chunk?: string) {
      res.body = chunk ?? ''
    },
  }
  return res as unknown as ServerResponse & { statusCode: number; body: string }
}

const attempt = (row: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status < 300, status, json: async () => [row] })

const RIGHT = { email: 'me@example.com', pin: '1234' }
const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  process.env.ALLOWED_EMAIL = RIGHT.email
  process.env.ALLOWED_PIN = RIGHT.pin
  gmail.list.mockResolvedValue({ data: { messages: [{ id: 'm1' }] } })
  gmail.get.mockResolvedValue({
    data: {
      internalDate: '1767225600000',
      payload: { body: { data: Buffer.from('인증번호 [123456]').toString('base64') } },
    },
  })
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('api/otp handler', () => {
  it('records a failed attempt and returns 401 for a wrong PIN', async () => {
    const fetchMock = attempt({ allowed: true, fail_count: 1, lock_until: null })
    vi.stubGlobal('fetch', fetchMock)
    const res = makeRes()
    await handler(makeReq({ ...RIGHT, pin: '0000' }), res)
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({ p_scope: 'otp', ok: false })
    expect(gmail.list).not.toHaveBeenCalled()
  })

  it('returns 429 on the failure that starts a lock', async () => {
    vi.stubGlobal(
      'fetch',
      attempt({ allowed: true, fail_count: 0, lock_until: '2026-10-30T10:00:00Z' })
    )
    const res = makeRes()
    await handler(makeReq({ ...RIGHT, pin: '0000' }), res)
    expect(res.statusCode).toBe(429)
    expect(JSON.parse(res.body)).toEqual({ error: 'TOO_MANY', until: '2026-10-30T10:00:00Z' })
  })

  it('rejects even the right PIN while locked', async () => {
    vi.stubGlobal(
      'fetch',
      attempt({ allowed: false, fail_count: 0, lock_until: '2026-10-30T10:00:00Z' })
    )
    const res = makeRes()
    await handler(makeReq(RIGHT), res)
    expect(res.statusCode).toBe(429)
    expect(gmail.list).not.toHaveBeenCalled()
  })

  it('returns the latest code for the right PIN', async () => {
    vi.stubGlobal('fetch', attempt({ allowed: true, fail_count: 0, lock_until: null }))
    const res = makeRes()
    await handler(makeReq(RIGHT), res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).code).toBe('123456')
  })

  it('keeps working without a limit when pin_attempt is not installed yet', async () => {
    vi.stubGlobal('fetch', attempt(null, 404))
    const res = makeRes()
    await handler(makeReq(RIGHT), res)
    expect(res.statusCode).toBe(200)
  })

  it('returns 503 JSON when the limiter or Gmail fails', async () => {
    vi.stubGlobal('fetch', attempt(null, 500))
    const res1 = makeRes()
    await handler(makeReq(RIGHT), res1)
    expect(res1.statusCode).toBe(503)
    expect(JSON.parse(res1.body)).toEqual({ error: 'UNAVAILABLE' })

    vi.stubGlobal('fetch', attempt({ allowed: true, fail_count: 0, lock_until: null }))
    gmail.list.mockRejectedValue(new Error('invalid_grant'))
    const res2 = makeRes()
    await handler(makeReq(RIGHT), res2)
    expect(res2.statusCode).toBe(503)
    expect(JSON.parse(res2.body)).toEqual({ error: 'UNAVAILABLE' })
  })
})
