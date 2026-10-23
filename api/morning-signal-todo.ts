import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { z } from 'zod'

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

export interface ListResponse {
  /** 첫 페이지에만 — 끝나지 않은 일 전부 */
  pending?: Todo[]
  items: Todo[]
  nextCursor: string | null
  /** 이 페이지에 나온 날짜들의 하루 전체 집계 */
  dayCounts: Record<string, { done: number; total: number }>
}

/** DB 행(snake_case) */
interface TodoRow {
  id: string
  title: string
  body: string | null
  link: string | null
  due_date: string | null
  due_time: string | null
  status: TodoStatus
  attachments: Attachment[] | null
  created_date: string
  created_at: string
  updated_at: string
  done_at: string | null
}

export const PAGE_SIZE = 20

// ── 값 다듬기 ────────────────────────────────────────────────────────────

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** YYYY-MM-DD 형식이면서 실제 달력 날짜인가(2026-02-30·2026-13-01은 거부). */
function isDateString(s: unknown): s is string {
  if (typeof s !== 'string') return false
  const m = DATE_RE.exec(s)
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
}

function kstToday(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** Supabase는 `+00:00`, 서버는 `Z`로 쓴다. 응답은 ISO Z로 맞춘다. */
function normalizeStamp(v: string): string {
  const t = new Date(v)
  return Number.isNaN(t.getTime()) ? v : t.toISOString()
}

/** 링크는 http(s)만. 스킴이 없으면 https:// 를 붙인다. 받을 수 없으면 null. */
export function normalizeLink(v: string): string | null {
  const s = v.trim()
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`
  try {
    const u = new URL(withScheme)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!u.hostname) return null
    return u.href
  } catch {
    return null
  }
}

/** 커서는 DB 원문 created_at(마이크로초 정밀도)을 그대로 담는다 — ISO 로 줄이면 같은 ms 안에서 겹치거나 빠진다. */
export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ c: createdAt, i: id })).toString('base64url')
}

export function decodeCursor(c: string): { createdAt: string; id: string } | null {
  try {
    const v = JSON.parse(Buffer.from(c, 'base64url').toString('utf8')) as {
      c?: unknown
      i?: unknown
    }
    if (typeof v.c !== 'string' || typeof v.i !== 'string') return null
    if (Number.isNaN(new Date(v.c).getTime())) return null
    return { createdAt: v.c, id: v.i }
  } catch {
    return null
  }
}

function toTodo(r: TodoRow): Todo {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    link: r.link,
    dueDate: r.due_date,
    dueTime: r.due_time ? r.due_time.slice(0, 5) : null,
    status: r.status,
    attachments: r.attachments ?? [],
    createdDate: r.created_date,
    createdAt: normalizeStamp(r.created_at),
    updatedAt: normalizeStamp(r.updated_at),
    doneAt: r.done_at ? normalizeStamp(r.done_at) : null,
  }
}

// ── 첨부 ────────────────────────────────────────────────────────────────

export const MAX_FILE_BYTES = 10_485_760
export const MAX_FILES = 5
export const BUCKET = 'ms-todo'
export const SIGNED_VIEW_SECONDS = 3600

const ATTACHMENT_PATH_RE =
  /^todos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9_-]+(\.[a-z0-9]{1,8})?$/

/**
 * Storage 키용 파일명. Supabase Storage 는 ASCII 밖 문자가 든 키를 거부한다("Invalid key") —
 * 그래서 영문·숫자·`_`·`-`만 남기고, 원래 이름(한글 등)은 DB 의 attachments[].name 에 둔다.
 */
export function safeFileName(name: string): string {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(name)
  const ext = m?.[1] ? `.${m[1].toLowerCase()}` : ''
  const stem = (m ? name.slice(0, -m[0].length) : name)
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return `${stem || 'file'}${ext}`
}

export function isAttachmentPath(p: string): boolean {
  return ATTACHMENT_PATH_RE.test(p)
}

/** 사진·PDF 만. SVG 는 스크립트를 품을 수 있어 뺀다. */
function isAllowedType(t: string): boolean {
  return (t.startsWith('image/') && t !== 'image/svg+xml') || t === 'application/pdf'
}

/** Storage 객체 삭제. 실패해도 요청은 성공으로 둔다(서버 로그만) — 할 일 자체는 이미 바뀌었다. */
async function removeObjects(paths: string[]): Promise<void> {
  if (!paths.length) return
  try {
    await sb(`/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      body: JSON.stringify({ prefixes: paths }),
    })
  } catch (error) {
    console.error('[api/morning-signal-todo] storage delete failed', error)
  }
}

async function signAttachments(list: Attachment[]): Promise<Attachment[]> {
  if (!list.length) return list
  const signed = await sbJson<Array<{ path: string; signedURL?: string | null }>>(
    `/storage/v1/object/sign/${BUCKET}`,
    {
      method: 'POST',
      body: JSON.stringify({ expiresIn: SIGNED_VIEW_SECONDS, paths: list.map((a) => a.path) }),
    }
  )
  const base = `${process.env.SUPABASE_URL ?? ''}/storage/v1`
  const byPath = new Map(
    signed.map((s) => [s.path, s.signedURL ? `${base}${s.signedURL}` : undefined])
  )
  return list.map((a) => ({ ...a, url: byPath.get(a.path) }))
}

// ── 검증 ────────────────────────────────────────────────────────────────

const dateStr = z.string().refine(isDateString, 'must be a real YYYY-MM-DD date')
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const attachmentSchema = z.object({
  path: z.string().refine(isAttachmentPath),
  name: z.string().min(1).max(200),
  type: z.string().refine(isAllowedType),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
})
const uploadSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1),
  size: z.number().int().positive(),
})
const fields = {
  title: z.string().trim().min(1).max(200),
  body: z.string().max(4000).nullish(),
  link: z.string().max(2000).nullish(),
  dueDate: dateStr.nullish(),
  dueTime: timeStr.nullish(),
  attachments: z.array(attachmentSchema).max(MAX_FILES).optional(),
}
const createSchema = z
  .object(fields)
  .refine((v) => !v.dueTime || !!v.dueDate, { message: 'dueTime needs dueDate', path: ['dueTime'] })
const updateSchema = z
  .object({ ...fields, status: z.enum(['todo', 'in_progress', 'done']) })
  .partial()
  // 시간만 바꿀 수는 없다 — 클라이언트는 날짜와 시간을 함께 보낸다
  .refine((v) => !v.dueTime || !!v.dueDate, { message: 'dueTime needs dueDate', path: ['dueTime'] })

type Fields = z.infer<typeof updateSchema>

class InvalidLinkError extends Error {}

/** 화면 필드(camelCase) → DB 행 일부(snake_case). undefined 인 키는 건드리지 않는다. */
function toRowPatch(v: Fields): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (v.title !== undefined) out.title = v.title
  if (v.body !== undefined) out.body = v.body ? v.body : null
  if (v.link !== undefined) {
    if (!v.link) out.link = null
    else {
      const link = normalizeLink(v.link)
      if (!link) throw new InvalidLinkError()
      out.link = link
    }
  }
  if (v.dueDate !== undefined) {
    out.due_date = v.dueDate ?? null
    if (!v.dueDate) out.due_time = null
  }
  if (v.dueTime !== undefined && v.dueDate) out.due_time = v.dueTime ?? null
  if (v.attachments !== undefined) out.attachments = v.attachments
  return out
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

  // 판정(잠겨 있나)과 기록(성공 초기화·실패 증가)을 DB 함수 한 번에 맡긴다 — 행 잠금으로 동시 시도가 한 줄로 서서,
  // 다섯 번째 실패가 기록되기 전에 다른 요청들이 판정을 통과하는 우회가 없다. 잠금 중에는 맞는 PIN 도 거절된다.
  const ok = timingSafeEqual(sha256(pin), sha256(cfg.pin))
  const out = await sbJson<AttemptRow | AttemptRow[]>('/rest/v1/rpc/ms_todo_attempt', {
    method: 'POST',
    body: JSON.stringify({ ok }),
  })
  const r = Array.isArray(out) ? out[0] : out
  if (!r) throw new Error('ms_todo_attempt returned no row')

  const now = Date.now()
  const until = activeLock({ fails: r.fail_count, locked_until: r.lock_until }, now)
  if (!r.allowed) return json(res, 429, { error: 'TOO_MANY', until: until ?? r.lock_until })
  if (ok) {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE}=${signSession(now + SESSION_MS, cfg.secret, cfg.pin)}; ${COOKIE_ATTRS}`
    )
    return json(res, 200, { ok: true })
  }
  if (until) return json(res, 429, { error: 'TOO_MANY', until })
  return json(res, 401, { error: 'WRONG_PIN', left: Math.max(0, MAX_FAILS - r.fail_count) })
}

/** ms_todo_attempt 결과 — allowed=false 면 잠금 중이라 이번 시도는 기록되지 않았다 */
interface AttemptRow {
  allowed: boolean
  fail_count: number
  lock_until: string | null
}

function handleLock(res: ServerResponse) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0`)
  return json(res, 200, { ok: true })
}

// ── 할 일 ──────────────────────────────────────────────────────────────

const TODOS = '/rest/v1/ms_todos'

function idParam(req: VercelRequest, res: ServerResponse): string | undefined {
  const id = getQueryParam(req, 'id')
  if (!id || !UUID_RE.test(id)) {
    json(res, 400, { error: 'INVALID_ID' })
    return undefined
  }
  return id
}

async function handleList(req: VercelRequest, res: ServerResponse) {
  const cursorParam = getQueryParam(req, 'cursor')
  const cursor = cursorParam ? decodeCursor(cursorParam) : null
  if (cursorParam && !cursor) return json(res, 400, { error: 'INVALID_CURSOR' })

  let url = `${TODOS}?select=*&order=created_at.desc,id.desc&limit=${PAGE_SIZE + 1}`
  if (cursor) {
    const { createdAt: ts, id } = cursor
    url += `&or=${encodeURIComponent(`(created_at.lt.${ts},and(created_at.eq.${ts},id.lt.${id}))`)}`
  }
  const [rows, pendingRows] = await Promise.all([
    sbJson<TodoRow[]>(url),
    cursor
      ? Promise.resolve(null)
      : sbJson<TodoRow[]>(`${TODOS}?select=*&status=neq.done&order=created_at.asc`),
  ])
  const page = rows.slice(0, PAGE_SIZE)
  const last = page[page.length - 1]
  const nextCursor = rows.length > PAGE_SIZE && last ? encodeCursor(last.created_at, last.id) : null

  const dates = [...new Set(page.map((r) => r.created_date))]
  const dayCounts: ListResponse['dayCounts'] = {}
  if (dates.length) {
    const counts = await sbJson<Array<{ created_date: string; status: TodoStatus }>>(
      `${TODOS}?select=created_date,status&created_date=in.(${dates.join(',')})`
    )
    for (const c of counts) {
      const d = dayCounts[c.created_date] ?? { done: 0, total: 0 }
      d.total += 1
      if (c.status === 'done') d.done += 1
      dayCounts[c.created_date] = d
    }
  }
  const body: ListResponse = { items: page.map(toTodo), nextCursor, dayCounts }
  if (pendingRows) body.pending = pendingRows.map(toTodo)
  return json(res, 200, body)
}

async function handleGet(req: VercelRequest, res: ServerResponse) {
  const id = idParam(req, res)
  if (!id) return
  const rows = await sbJson<TodoRow[]>(`${TODOS}?id=eq.${id}&select=*`)
  const r = rows[0]
  if (!r) return json(res, 404, { error: 'NOT_FOUND' })
  const todo = toTodo(r)
  return json(res, 200, { todo: { ...todo, attachments: await signAttachments(todo.attachments) } })
}

async function handleUploadUrl(req: VercelRequest, res: ServerResponse) {
  const body = await readJson(req, res)
  if (body === undefined) return
  const parsed = uploadSchema.safeParse(body)
  if (!parsed.success) return json(res, 400, { error: 'INVALID_PAYLOAD' })
  if (!isAllowedType(parsed.data.type)) return json(res, 400, { error: 'UNSUPPORTED_FILE' })
  if (parsed.data.size > MAX_FILE_BYTES) return json(res, 400, { error: 'FILE_TOO_LARGE' })
  // 업로드마다 새 uuid — 할 일 id 와 무관해서 만들기 전에 올려도 옮길 필요가 없다
  const path = `todos/${randomUUID()}/${safeFileName(parsed.data.name)}`
  // 본문이 비면 Storage(Fastify)가 JSON 파서에서 400으로 거절한다 — supabase-js 처럼 {} 를 보낸다
  const { url } = await sbJson<{ url: string }>(
    `/storage/v1/object/upload/sign/${BUCKET}/${path}`,
    { method: 'POST', body: '{}' }
  )
  return json(res, 200, { path, uploadUrl: `${process.env.SUPABASE_URL ?? ''}/storage/v1${url}` })
}

async function handleCreate(req: VercelRequest, res: ServerResponse) {
  const body = await readJson(req, res)
  if (body === undefined) return
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return json(res, 400, { error: 'INVALID_PAYLOAD' })
  let patch: Record<string, unknown>
  try {
    patch = toRowPatch(parsed.data)
  } catch (error) {
    if (error instanceof InvalidLinkError) return json(res, 400, { error: 'INVALID_LINK' })
    throw error
  }
  const row = {
    title: parsed.data.title,
    body: null,
    link: null,
    due_date: null,
    due_time: null,
    attachments: [],
    ...patch,
    status: 'todo',
    created_date: kstToday(new Date()),
  }
  const rows = await sbJson<TodoRow[]>(TODOS, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  const r = rows[0]
  if (!r) throw new Error('insert returned no row')
  return json(res, 200, { todo: toTodo(r) })
}

async function handleUpdate(req: VercelRequest, res: ServerResponse) {
  const id = idParam(req, res)
  if (!id) return
  const body = await readJson(req, res)
  if (body === undefined) return
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return json(res, 400, { error: 'INVALID_PAYLOAD' })
  let patch: Record<string, unknown>
  try {
    patch = toRowPatch(parsed.data)
  } catch (error) {
    if (error instanceof InvalidLinkError) return json(res, 400, { error: 'INVALID_LINK' })
    throw error
  }
  const now = new Date().toISOString()
  if (parsed.data.status) {
    patch.status = parsed.data.status
    patch.done_at = parsed.data.status === 'done' ? now : null
  }
  patch.updated_at = now
  // 첨부 목록이 바뀌면 빠진 파일을 지워야 하므로 이전 목록을 먼저 읽는다
  const before = parsed.data.attachments
    ? ((
        await sbJson<Array<Pick<TodoRow, 'attachments'>>>(`${TODOS}?id=eq.${id}&select=attachments`)
      )[0]?.attachments ?? [])
    : []
  const rows = await sbJson<TodoRow[]>(`${TODOS}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  })
  const r = rows[0]
  if (!r) return json(res, 404, { error: 'NOT_FOUND' })
  const kept = new Set((parsed.data.attachments ?? []).map((a) => a.path))
  await removeObjects(before.filter((a) => !kept.has(a.path)).map((a) => a.path))
  return json(res, 200, { todo: toTodo(r) })
}

async function handleDelete(req: VercelRequest, res: ServerResponse) {
  const id = idParam(req, res)
  if (!id) return
  const rows = await sbJson<TodoRow[]>(`${TODOS}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  })
  const r = rows[0]
  if (!r) return json(res, 404, { error: 'NOT_FOUND' })
  await removeObjects((r.attachments ?? []).map((a) => a.path))
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

/** 세션이 있어야 하는 op */
const PRIVATE_OPS: Record<string, { method: string; run: Op }> = {
  list: { method: 'GET', run: handleList },
  get: { method: 'GET', run: handleGet },
  create: { method: 'POST', run: handleCreate },
  update: { method: 'PATCH', run: handleUpdate },
  delete: { method: 'DELETE', run: handleDelete },
  'upload-url': { method: 'POST', run: handleUploadUrl },
}

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
