import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Morning Signal TO-DO API — 설계 docs/superpowers/specs/2026-10-23-morning-signal-todo-design.md §5.
// 자기완결 단일 파일이다(Vercel ESM 런타임 — 상대 import 금지). 헬퍼는 api/morning-signal.ts 에서 복사했다.

// ── 타입 ────────────────────────────────────────────────────────────────

export type TodoStatus = 'todo' | 'in_progress' | 'done'

export interface Attachment {
  path: string
  name: string
  type: string
  size: number
  /** 상세 응답에만 붙는 서명된 보기 주소(1시간) */
  url?: string
}

export interface Todo {
  id: string
  title: string
  body: string | null
  link: string | null
  dueDate: string | null
  /** HH:MM */
  dueTime: string | null
  status: TodoStatus
  attachments: Attachment[]
  /** KST 「추가한 날」 — 날짜 묶음 기준 */
  createdDate: string
  createdAt: string
  updatedAt: string
  doneAt: string | null
}

export interface SessionResponse {
  unlocked: boolean
  lockedUntil: string | null
}

// ── 잠금(세션 쿠키) ──────────────────────────────────────────────────────

export const SESSION_MS = 86_400_000
export const MAX_FAILS = 5
export const LOCK_MS = 600_000

const COOKIE = 'ms_todo'
const COOKIE_ATTRS = `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${SESSION_MS / 1000}`
const PIN_RE = /^\d{4}$/
const MIN_SECRET = 32

function sessionKey(secret: string, pin: string): Buffer {
  // 키에 PIN 이 섞여 있어서 PIN 을 바꾸면 기존 쿠키가 전부 무효가 된다
  return createHmac('sha256', secret).update(pin).digest()
}

export function signSession(exp: number, secret: string, pin: string): string {
  const sig = createHmac('sha256', sessionKey(secret, pin)).update(String(exp)).digest('base64url')
  return `${exp}.${sig}`
}

export function verifySession(
  token: string | undefined,
  now: number,
  secret: string,
  pin: string
): boolean {
  if (!token) return false
  const m = /^(\d{1,16})\.([A-Za-z0-9_-]+)$/.exec(token)
  if (!m?.[1] || !m[2]) return false
  const exp = Number(m[1])
  const expected = signSession(exp, secret, pin).split('.')[1] ?? ''
  if (!timingSafeEqual(sha256(m[2]), sha256(expected))) return false
  return exp > now
}

export function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim()
  }
  return undefined
}

// ── 공통 헬퍼(api/morning-signal.ts 에서 복사) ───────────────────────────

const MAX_BODY_BYTES = 262144

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>
}

class PayloadTooLargeError extends Error {}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let bytesRead = 0
    let failed = false
    req.on('data', (chunk: Buffer) => {
      if (failed) return
      bytesRead += chunk.length
      if (bytesRead > MAX_BODY_BYTES) {
        failed = true
        req.pause()
        reject(new PayloadTooLargeError('Request body too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** 본문을 JSON 으로 읽는다. 실패하면 이미 응답을 보낸 뒤 undefined 를 돌려준다. */
async function readJson(req: IncomingMessage, res: ServerResponse): Promise<unknown> {
  let raw: string
  try {
    raw = await readBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) json(res, 413, { error: 'PAYLOAD_TOO_LARGE' })
    else json(res, 400, { error: 'INVALID_JSON' })
    return undefined
  }
  try {
    return JSON.parse(raw || 'null')
  } catch {
    json(res, 400, { error: 'INVALID_JSON' })
    return undefined
  }
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.end(JSON.stringify(body))
}

function supabaseHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const val = req.query[key]
  return Array.isArray(val) ? val[0] : val
}

function sha256(v: string): Buffer {
  return createHash('sha256').update(v).digest()
}

/** PostgREST 오류 본문(앞 500자). 서버 로그에만 쓰고 HTTP 응답에는 넣지 않는다. */
async function errorDetail(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return ''
  }
}

/** Supabase REST 호출(경로는 `/rest/v1/…`·`/storage/v1/…`). 2xx 가 아니면 throw — 핸들러가 503 으로 바꾼다. */
async function sb(path: string, init: RequestInit = {}): Promise<Response> {
  const base = process.env.SUPABASE_URL ?? ''
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...supabaseHeaders(), ...(init.headers as Record<string, string> | undefined) },
  })
  if (!res.ok)
    throw new Error(
      `Supabase ${init.method ?? 'GET'} ${path} failed: ${res.status} ${await errorDetail(res)}`
    )
  return res
}

async function sbJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await (await sb(path, init)).json()) as T
}

// ── 잠금 처리 ────────────────────────────────────────────────────────────

interface AuthRow {
  fails: number
  locked_until: string | null
}

interface Config {
  pin: string
  secret: string
}

function config(): Config | null {
  const pin = process.env.MS_TODO_PIN ?? ''
  const secret = process.env.MS_TODO_SECRET ?? ''
  if (!PIN_RE.test(pin) || secret.length < MIN_SECRET) return null
  return { pin, secret }
}

function activeLock(row: AuthRow | undefined, now: number): string | null {
  if (!row?.locked_until) return null
  const t = new Date(row.locked_until).getTime()
  return t > now ? new Date(t).toISOString() : null
}

async function readAuth(): Promise<AuthRow | undefined> {
  const rows = await sbJson<AuthRow[]>('/rest/v1/ms_todo_auth?id=eq.1&select=fails,locked_until')
  return rows[0]
}

function requireSession(req: VercelRequest, cfg: Config): boolean {
  return verifySession(parseCookie(req.headers.cookie, COOKIE), Date.now(), cfg.secret, cfg.pin)
}

async function handleSession(req: VercelRequest, res: ServerResponse, cfg: Config) {
  const lockedUntil = activeLock(await readAuth(), Date.now())
  const body: SessionResponse = { unlocked: requireSession(req, cfg), lockedUntil }
  return json(res, 200, body)
}

async function handleUnlock(req: VercelRequest, res: ServerResponse, cfg: Config) {
  const body = await readJson(req, res)
  if (body === undefined) return
  const pin = (body as { pin?: unknown } | null)?.pin
  if (typeof pin !== 'string' || !PIN_RE.test(pin)) return json(res, 400, { error: 'INVALID_PIN' })

  const now = Date.now()
  const locked = activeLock(await readAuth(), now)
  // 잠금 중에는 맞는 PIN 도 거절한다 — 그래야 무차별 대입이 막힌다
  if (locked) return json(res, 429, { error: 'TOO_MANY', until: locked })

  if (timingSafeEqual(sha256(pin), sha256(cfg.pin))) {
    await sb('/rest/v1/ms_todo_auth?id=eq.1', {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ fails: 0, locked_until: null }),
    })
    res.setHeader(
      'Set-Cookie',
      `${COOKIE}=${signSession(now + SESSION_MS, cfg.secret, cfg.pin)}; ${COOKIE_ATTRS}`
    )
    return json(res, 200, { ok: true })
  }

  const row = await sbJson<AuthRow>('/rest/v1/rpc/ms_todo_fail', { method: 'POST', body: '{}' })
  const until = activeLock(row, now)
  if (until) return json(res, 429, { error: 'TOO_MANY', until })
  return json(res, 401, { error: 'WRONG_PIN', left: Math.max(0, MAX_FAILS - row.fails) })
}

function handleLock(res: ServerResponse) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0`)
  return json(res, 200, { ok: true })
}

// ── 핸들러 ──────────────────────────────────────────────────────────────

type Op = (req: VercelRequest, res: ServerResponse, cfg: Config) => Promise<void> | void

/** 잠금 없이 부를 수 있는 op */
const PUBLIC_OPS: Record<string, { method: string; run: Op }> = {
  session: { method: 'GET', run: handleSession },
  unlock: { method: 'POST', run: handleUnlock },
  lock: { method: 'POST', run: (_req, res) => handleLock(res) },
}

/** 세션이 있어야 하는 op — 다음 태스크들이 채운다 */
const PRIVATE_OPS: Record<string, { method: string; run: Op }> = {}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })
  }
  const cfg = config()
  if (!cfg) return json(res, 503, { error: 'TODO_NOT_CONFIGURED' })

  const op = getQueryParam(req, 'op') ?? ''
  const pub = PUBLIC_OPS[op]
  const priv = PRIVATE_OPS[op]
  try {
    if (pub) {
      if (req.method !== pub.method) return json(res, 405, { error: 'Method Not Allowed' })
      return await pub.run(req, res, cfg)
    }
    if (!requireSession(req, cfg)) return json(res, 401, { error: 'LOCKED_SESSION' })
    if (!priv || req.method !== priv.method) return json(res, 405, { error: 'Method Not Allowed' })
    return await priv.run(req, res, cfg)
  } catch (error) {
    console.error('[api/morning-signal-todo] failed', error)
    return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })
  }
}
