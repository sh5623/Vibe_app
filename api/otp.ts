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
  if (
    !allowedEmail ||
    !allowedPin ||
    typeof email !== 'string' ||
    typeof pin !== 'string' ||
    email !== allowedEmail ||
    pin !== allowedPin
  ) {
    return json(res, 401, { error: 'INVALID_CREDENTIALS' })
  }

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
