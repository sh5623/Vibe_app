import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './ahram'

type MockRequest = IncomingMessage & { query: Record<string, string | string[]> }

function makeReq(
  method: string,
  body?: unknown,
  query: Record<string, string | string[]> = {}
): MockRequest {
  const emitter = new EventEmitter() as unknown as MockRequest
  ;(emitter as unknown as { method: string }).method = method
  emitter.query = query
  queueMicrotask(() => {
    if (body !== undefined) {
      emitter.emit('data', Buffer.from(JSON.stringify(body)))
    }
    emitter.emit('end')
  })
  return emitter
}

function makeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(key: string, value: string) {
      res.headers[key] = value
    },
    end(chunk?: string) {
      res.body = chunk ?? ''
    },
  }
  return res as unknown as ServerResponse & { statusCode: number; body: string }
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  process.env.VITE_BIRTHDAY = '010101'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('api/ahram handler', () => {
  it('returns 503 when SUPABASE_URL is not configured', async () => {
    process.env.SUPABASE_URL = ''
    const res = makeRes()

    await handler(makeReq('GET', undefined, { pin: '010101' }), res)

    expect(res.statusCode).toBe(503)
    expect(JSON.parse(res.body)).toEqual({ error: 'SUPABASE_UNAVAILABLE' })
  })

  it('GET rejects with 401 when pin query param is missing or wrong', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = makeRes()

    await handler(makeReq('GET', undefined, { pin: 'wrong' }), res)

    expect(res.statusCode).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('GET returns the existing row content when found', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ content: { selfIntro: 'hi', motivation: 'why', categories: [] } }],
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = makeRes()

    await handler(makeReq('GET', undefined, { pin: '010101' }), res)

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ selfIntro: 'hi', motivation: 'why', categories: [] })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('GET seeds default content via upsert when no row exists yet', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { content: { selfIntro: 'seeded', motivation: 'seeded', categories: [] } },
        ],
      })
    vi.stubGlobal('fetch', fetchMock)
    const res = makeRes()

    await handler(makeReq('GET', undefined, { pin: '010101' }), res)

    expect(res.statusCode).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, upsertCall] = fetchMock.mock.calls
    expect(upsertCall?.[1]?.method).toBe('POST')
  })

  it('GET returns 503 when Supabase request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    )
    const res = makeRes()

    await handler(makeReq('GET', undefined, { pin: '010101' }), res)

    expect(res.statusCode).toBe(503)
  })

  it('PUT rejects with 401 when pin does not match', async () => {
    const res = makeRes()

    await handler(
      makeReq('PUT', {
        pin: 'wrong',
        content: { selfIntro: 'a', motivation: 'b', categories: [] },
      }),
      res
    )

    expect(res.statusCode).toBe(401)
  })

  it('PUT rejects with 400 when content shape is invalid', async () => {
    const res = makeRes()

    await handler(makeReq('PUT', { pin: '010101', content: { selfIntro: '' } }), res)

    expect(res.statusCode).toBe(400)
  })

  it('PUT accepts answerB: null as a valid (missing) dual-answer variant', async () => {
    const content = {
      selfIntro: 'a',
      motivation: 'b',
      categories: [
        {
          id: 'personality',
          label: '성격',
          items: [{ id: 'weakness', question: '단점은?', answer: '느림', answerB: null }],
        },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ content }] }))
    const res = makeRes()

    await handler(makeReq('PUT', { pin: '010101', content }), res)

    expect(res.statusCode).toBe(200)
  })

  it('PUT saves and returns the updated content when pin and content are valid', async () => {
    const savedContent = { selfIntro: 'a', motivation: 'b', categories: [] }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ content: savedContent }] })
    )
    const res = makeRes()

    await handler(makeReq('PUT', { pin: '010101', content: savedContent }), res)

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual(savedContent)
  })

  it('rejects unsupported HTTP methods with 405', async () => {
    const res = makeRes()

    await handler(makeReq('DELETE'), res)

    expect(res.statusCode).toBe(405)
  })
})
