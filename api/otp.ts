import { createHash, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_BODY_BYTES = 4096

interface GmailMessagePart {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailMessagePart[]
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractBody(part: GmailMessagePart): string {
  if (part.body?.data !== undefined) {
    return decodeBase64Url(part.body.data)
  }
  if (part.parts !== undefined) {
    for (const p of part.parts) {
      if (p.mimeType === 'text/plain') {
        const text = extractBody(p)
        if (text) return text
      }
    }
    for (const p of part.parts) {
      if (p.mimeType === 'text/html') {
        const text = extractBody(p)
        if (text) return text
      }
    }
    for (const p of part.parts) {
      const text = extractBody(p)
      if (text) return text
    }
  }
  return ''
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString()
      if (data.length > MAX_BODY_BYTES) {
        req.destroy()
        reject(new Error('Request body too large'))
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.end(JSON.stringify(body))
}

function sameSecret(a: string, b: string): boolean {
  const h = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(h(a), h(b))
}

/** pin_attempt 결과 — allowed=false 면 잠금 중이라 이번 시도는 기록되지 않았다 */
interface AttemptRow {
  allowed: boolean
  fail_count: number
  lock_until: string | null
}

/**
 * PIN 시도 한 번을 DB 에 기록한다(docs/security/pin-attempts.sql). 4자리 PIN 은 제한이 없으면
 * 몇 분 안에 전부 시도할 수 있다. 함수가 아직 없으면(SQL 미적용) null — 제한 없이 지나가고 로그만 남긴다.
 */
async function recordAttempt(ok: boolean): Promise<AttemptRow | null> {
  const base = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) {
    console.warn(
      '[api/otp] SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY 가 없어 PIN 시도 제한이 꺼져 있다'
    )
    return null
  }
  const res = await fetch(`${base}/rest/v1/rpc/pin_attempt`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_scope: 'otp', ok }),
  })
  if (res.status === 404) {
    console.warn(
      '[api/otp] pin_attempt 함수가 없다 — docs/security/pin-attempts.sql 을 실행해야 시도 제한이 켜진다'
    )
    return null
  }
  if (!res.ok) throw new Error(`pin_attempt failed: ${res.status}`)
  const out = (await res.json()) as AttemptRow | AttemptRow[]
  const row = Array.isArray(out) ? out[0] : out
  if (!row) throw new Error('pin_attempt returned no row')
  return row
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method Not Allowed' })
  }

  let rawBody: string
  try {
    rawBody = await readBody(req)
  } catch {
    return json(res, 400, { error: 'Bad Request' })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  if (typeof body !== 'object' || body === null) {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  const { email, pin } = body as Record<string, unknown>

  const allowedEmail = process.env.ALLOWED_EMAIL
  const allowedPin = process.env.ALLOWED_PIN

  // Guard: env vars must be set and non-empty, and must match as strings
  if (!allowedEmail || !allowedPin || typeof email !== 'string' || typeof pin !== 'string') {
    return json(res, 401, { error: 'INVALID_CREDENTIALS' })
  }
  const ok = sameSecret(email, allowedEmail) && sameSecret(pin, allowedPin)

  let attempt: AttemptRow | null
  try {
    attempt = await recordAttempt(ok)
  } catch (error) {
    console.error('[api/otp] attempt limiter failed', error)
    return json(res, 503, { error: 'UNAVAILABLE' })
  }
  if (attempt && !attempt.allowed)
    return json(res, 429, { error: 'TOO_MANY', until: attempt.lock_until })
  if (!ok) {
    if (attempt?.lock_until) return json(res, 429, { error: 'TOO_MANY', until: attempt.lock_until })
    return json(res, 401, { error: 'INVALID_CREDENTIALS' })
  }

  try {
    return await sendLatestCode(res)
  } catch (error) {
    console.error('[api/otp] Gmail request failed', error)
    return json(res, 503, { error: 'UNAVAILABLE' })
  }
}

async function sendLatestCode(res: ServerResponse) {
  const { google } = await import('googleapis')

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const senderEmail = process.env.OTP_SENDER_EMAIL ?? ''
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `from:${senderEmail}`,
    maxResults: 1,
  })

  const messages = listRes.data.messages
  if (!messages || messages.length === 0) {
    return json(res, 404, { error: 'NO_MAIL_FOUND' })
  }

  const firstMessage = messages[0]
  if (firstMessage === undefined) {
    return json(res, 404, { error: 'NO_MAIL_FOUND' })
  }

  const msgRes = await gmail.users.messages.get({
    userId: 'me',
    id: firstMessage.id ?? '',
    format: 'full',
  })

  const msg = msgRes.data
  const receivedAt =
    msg.internalDate !== undefined && msg.internalDate !== null
      ? new Date(parseInt(msg.internalDate, 10)).toISOString()
      : new Date().toISOString()

  const payload = msg.payload as GmailMessagePart | undefined
  const text = payload !== undefined ? extractBody(payload) : ''

  const digits = parseInt(process.env.OTP_DIGITS ?? '6', 10)
  const match = text.match(new RegExp(`\\b\\d{${digits}}\\b`))

  if (match === null || match[0] === undefined) {
    return json(res, 422, { error: 'PARSE_FAILED' })
  }

  return json(res, 200, { code: match[0], receivedAt })
}
