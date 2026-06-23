import type { Route } from './+types/api.otp'

export interface OtpSuccessResponse {
  code: string
  receivedAt: string
}

export type OtpErrorCode = 'INVALID_CREDENTIALS' | 'NO_MAIL_FOUND' | 'PARSE_FAILED'

export interface OtpErrorResponse {
  error: OtpErrorCode
}

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

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const body = (await request.json()) as { email?: string; pin?: string }

  if (body.email !== process.env.ALLOWED_EMAIL || body.pin !== process.env.ALLOWED_PIN) {
    return Response.json({ error: 'INVALID_CREDENTIALS' as const }, { status: 401 })
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
    return Response.json({ error: 'NO_MAIL_FOUND' as const }, { status: 404 })
  }

  const firstMessage = messages[0]
  if (firstMessage === undefined) {
    return Response.json({ error: 'NO_MAIL_FOUND' as const }, { status: 404 })
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
    return Response.json({ error: 'PARSE_FAILED' as const }, { status: 422 })
  }

  return Response.json({ code: match[0], receivedAt })
}
