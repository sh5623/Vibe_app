import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_BODY_BYTES = 65536
const TABLE = 'interview_page_content'
const ROW_ID = 'ahram-interview'

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const val = req.query[key]
  return Array.isArray(val) ? val[0] : val
}

interface InterviewQaItem {
  id: string
  question: string
  answer: string
  answerB?: string
}

interface InterviewCategory {
  id: string
  label: string
  items: InterviewQaItem[]
}

interface InterviewContent {
  selfIntro: string
  motivation: string
  categories: InterviewCategory[]
}

const DEFAULT_INTERVIEW_CONTENT: InterviewContent = {
  selfIntro: `안녕하십니까. 예약 접수부터 상담, 계약 행정, 예약 이력 관리까지 예약실 운영 전반을 맡아 온 곽아람입니다.

저의 가장 큰 강점은 오픈 경험입니다. 더채플앳 논현에 오픈 멤버로 참여해, 매뉴얼도 기준도 없던 초기부터 예약 접수와 상담 응대, 계약·일정 관리로 이어지는 예약실 운영 흐름을 직접 만들며 자리 잡게 했습니다. 조감도만 보고 상담하던 시기, 완공 후 쏟아진 다양한 요청, 오픈 직후 코로나까지 겪으며 정해진 것이 없는 현장에서도 빠르게 기준을 세우는 힘을 길렀습니다.

또 하나의 강점은 정확한 예약 관리입니다. 고객 정보와 예약 이력을 빠짐없이 정리해 부서끼리 말이 어긋나는 일이 없도록 관리했고, 자주 나오는 문의와 불만은 유형별로 정리해 문제가 커지기 전에 미리 막았습니다.

새롭게 문을 여는 서울아레나컨벤션에서, 예약실을 처음부터 자리 잡게 해 본 제 경험이 가장 잘 쓰일 수 있다고 생각해 지원했습니다. 감사합니다.`,
  motivation: `제 커리어에서 가장 값진 경험은 더채플앳 논현의 오픈 멤버로, 아무것도 정해지지 않은 상태에서 예약실 운영의 기준을 함께 세워 본 일이었습니다. 예약 접수와 상담, 계약 행정이 따로 노는 것이 아니라 하나로 이어져야 오류가 생기지 않는다는 것을, 그 과정에서 몸으로 배웠습니다.

서울아레나컨벤션은 창동에 새롭게 들어서는 대형 예식·컨벤션 공간으로 알고 있습니다. 규모와 상징성이 큰 현장이 처음 자리를 잡아가는 시기일수록, 예약실의 기준을 처음부터 세워 본 사람의 손이 필요하다고 생각했습니다. 예약 접수부터 계약, 이력 관리까지 끊김 없는 운영 흐름을 만들어 본 경험을 이번에는 이곳에서 처음부터 쌓아 올리고 싶어 지원했습니다.`,
  categories: [
    {
      id: 'apply-reason',
      label: '지원동기·회사',
      items: [
        {
          id: 'why-reservation-role',
          question: '예약실 운영 업무에 지원하신 이유는 무엇인가요?',
          answer:
            '예약실은 고객이 처음 만나는 접점이자, 이후 상담·계약·행사 당일까지 모든 응대의 기준이 되는 자리라고 생각합니다. 저는 더채플앳 논현에서 예약 접수부터 상담 응대, 계약 체결, 예약 이력 관리까지 예약실 운영의 전 과정을 직접 담당해왔습니다. 이 과정을 하나로 이어서 다뤄본 경험이 있었기에, 예약실이라는 자리가 가진 책임의 무게를 알고 있고 그만큼 잘 해낼 수 있다고 생각해 지원했습니다.',
        },
        {
          id: 'why-this-company',
          question: '왜 서울아레나컨벤션인가요?',
          answer:
            '서울아레나컨벤션은 창동에 새롭게 들어서는, 규모와 상징성이 큰 예식·컨벤션 공간으로 알고 있습니다. 이런 현장일수록 오픈 초기에 예약과 상담의 기준을 누가, 어떻게 세우느냐가 이후 운영의 전체 틀을 좌우한다고 생각합니다. 저는 더채플앳 논현 오픈 멤버로 참여해 아무것도 정해지지 않은 상태에서 그 기준을 직접 세워본 경험이 있고, 그 경험이 지금 서울아레나컨벤션에 가장 필요한 시점이라 생각해 지원했습니다.',
        },
        {
          id: 'about-company',
          question: '저희 회사(아이티앤코)에 대해 아는 대로 말해보세요.',
          answer:
            '아이티앤코는 강남 논현동에 본사를 두고 파라곤 등 여러 예식·컨벤션 브랜드를 운영하시는 것으로 알고 있습니다. 이번에 새롭게 여는 서울아레나컨벤션도 그 흐름 위에서, 창동이라는 새로운 입지에 대형 예식·컨벤션 공간을 만드는 프로젝트라고 이해하고 있습니다. 기존에 운영하시던 예식장들의 응대 방식과 시스템을 참고하면서도, 신규 오픈 현장에 맞는 기준을 새로 만들어가는 과정이 될 거라 생각합니다.',
        },
      ],
    },
    {
      id: 'reservation-skills',
      label: '예약실 실무 역량',
      items: [
        {
          id: 'job-description',
          question: '예약실에서 맡았던 업무를 구체적으로 설명해주세요.',
          answer:
            '예약실 업무는 크게 세 단계로 이어집니다. 먼저 예약 접수와 상담 응대로 고객의 요청과 일정을 확인하고, 이후 계약 체결·일정 변경·취소·결제수단 변경 같은 예약 행정을 처리하며, 마지막으로 고객 정보와 예약 이력을 정리해 관리합니다. 저는 이 세 단계를 각각 따로 처리하지 않고, 하나의 흐름으로 이어서 다뤄야 중간에 오류가 생기지 않는다는 걸 실무를 통해 배웠습니다.',
        },
        {
          id: 'data-accuracy',
          question: '예약·계약 데이터를 정확하게 관리하는 본인만의 방식이 있나요?',
          answer:
            '고객 정보와 예약 이력은 접수 즉시 빠짐없이 정리해두고, 부서 간에 말이 어긋나지 않도록 특이사항까지 함께 기록해왔습니다. 예약실 데이터는 하나만 틀려도 당일 준비나 계약 이행에서 바로 사고로 이어질 수 있다고 생각해서, 접수한 내용을 그대로 두지 않고 일정·결제·특이사항을 다시 한번 확인하는 습관을 들였습니다.',
        },
        {
          id: 'schedule-conflict',
          question: '예약이 겹치거나 일정 변경 요청이 몰릴 때 어떻게 처리하시나요?',
          answer:
            '먼저 예약 확정 시점과 고객의 상황을 기준으로 우선순위를 판단하고, 변경이 필요한 부분은 관련 부서에 바로 공유해 일정이 어긋나지 않게 조율합니다. 저는 문제가 생긴 뒤 수습하기보다, 평소 이력을 꼼꼼히 정리하고 겹칠 가능성이 있는 일정은 미리 확인해두는 방식으로 애초에 어긋날 일을 줄여왔습니다.',
        },
      ],
    },
    {
      id: 'consulting',
      label: '상담·컴플레인',
      items: [
        {
          id: 'consulting-strength',
          question: '상담 시 본인만의 강점은 무엇인가요?',
          answer:
            '저의 강점은 고객의 말을 끝까지 듣는 것입니다. 많은 고객분들이 원하시는 바를 정확한 말로 표현하지 못하는 경우가 많아서, 망설이는 부분이나 지나가듯 하신 한마디에서 진짜 필요로 하시는 걸 먼저 읽어내려고 합니다. 그렇게 미리 짚어드리면 고객분들도 본인이 뭘 원하는지 더 명확해지시고, 상담이 훨씬 수월하게 진행됩니다.',
        },
        {
          id: 'complaint-handling',
          question: '컴플레인 응대 경험을 말해주세요.',
          answer:
            '고객의 불만이 들어오면 그대로 회사에 전달하기보다, 먼저 어떤 부분이 진짜 불편했는지 원인을 파악하려고 합니다. 그 다음 단순히 문제를 보고하는 데 그치지 않고 해결 방안까지 함께 정리해서 전달했고, 그렇게 분쟁이나 고객 이탈로 번지기 전에 마무리해온 경험이 많습니다. 감정적으로 대응하기보다, 원인과 해결책을 구조적으로 정리해서 접근하는 편입니다.',
        },
      ],
    },
    {
      id: 'open-experience',
      label: '오픈 경험',
      items: [
        {
          id: 'open-member-challenge',
          question: '오픈 멤버로 일하면서 가장 어려웠던 점과 극복 방법은?',
          answer:
            '더채플앳 논현 오픈 멤버로 참여했을 때 가장 어려웠던 점은 매뉴얼도, 정해진 기준도 없다는 것이었습니다. 완공 전이라 조감도만 보고 상담을 해야 했고, 완공 후에는 예상하지 못했던 다양한 요청이 한꺼번에 쏟아졌습니다. 저는 그때마다 자주 나오는 질문과 요청을 유형별로 정리해서 응대 기준을 하나씩 만들어갔고, 그 기준들이 쌓이면서 예약 접수와 상담 응대의 흐름이 자리를 잡을 수 있었습니다. 오픈 직후에는 코로나까지 겹쳤지만, 정해진 것이 없는 상황에서도 빠르게 기준을 세우는 힘을 그 과정에서 길렀습니다.',
        },
      ],
    },
    {
      id: 'collaboration',
      label: '부서협업·근무조건',
      items: [
        {
          id: 'department-mismatch',
          question: '다른 부서와 정보가 어긋나면 어떻게 하시나요?',
          answer:
            '고객의 요청이나 특이사항은 확정되는 즉시 관련 부서에 미리 공유해서, 애초에 정보가 어긋날 일을 줄이려고 합니다. 그럼에도 부서 간에 의견이 부딪히는 경우에는, 결국 고객에게 가장 도움이 되는 방향이 무엇인지를 기준으로 조율해왔습니다.',
        },
        {
          id: 'work-schedule',
          question: '수요일~일요일 근무입니다. 괜찮으신가요?',
          answer:
            '네, 전혀 문제없습니다. 예식장 예약실에서 계속 해오던 근무 패턴이라 어색하지 않습니다.',
        },
        {
          id: 'closing-question',
          question: '마지막으로 하고 싶은 말씀이나 궁금한 점 있으신가요?',
          answer:
            '특별히 준비한 역질문이 두 가지 있습니다. 첫째, 오픈 초기 예약실에서 가장 중요하게 보시는 역량은 무엇인가요? 둘째, 입사 후 3개월간 예약실이 자리 잡기 위해 우선적으로 세팅되어야 할 부분이 궁금합니다.',
        },
      ],
    },
    {
      id: 'personality',
      label: '성격',
      items: [
        {
          id: 'personality-strength',
          question: '성격의 장점은 무엇인가요?',
          answer:
            '저의 장점은 꼼꼼함과 사전 점검하는 습관입니다. 예약실에서는 고객 정보나 예약 이력이 하나만 어긋나도 계약이나 당일 준비에서 문제가 생깁니다. 그래서 저는 접수한 내용을 그대로 두지 않고, 일정·결제·특이사항을 다시 한번 확인하고 부서에 공유하는 습관이 있습니다. 고객이 요청하기 전에 허점을 먼저 짚어두는 편이라, 문제가 터진 뒤 수습하기보다 미리 막는 쪽으로 일해 왔습니다.',
        },
        {
          id: 'personality-weakness',
          question: '성격의 단점은 무엇인가요?',
          answer:
            '저의 단점은 하나하나 확인하려다 보니 처음엔 시간이 오래 걸리는 점이었습니다. 실수를 줄이려는 마음이 앞서다 보니 초반에는 속도가 느렸습니다. 그래서 자주 나오는 문의나 확인 항목을 유형별로 정리해 체크리스트처럼 두는 방식으로 바꿨더니, 정확도는 유지하면서 속도도 함께 올릴 수 있었습니다. 지금은 꼼꼼함과 속도의 균형을 맞추려 계속 신경 쓰고 있습니다.',
          answerB:
            '저의 단점은 부탁을 잘 거절하지 못하는 점입니다. 고객이나 동료의 요청을 최대한 들어드리려다 보니 일을 혼자 떠안을 때가 있었습니다. 이걸 겪으면서, 무리하게 다 받기보다 우선순위를 먼저 정리하고 필요한 부분은 부서와 나누는 게 오히려 고객에게 더 나은 결과로 이어진다는 걸 배웠습니다. 지금은 혼자 안고 가기 전에 먼저 공유하려 노력하고 있습니다.',
        },
      ],
    },
  ],
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

function supabaseHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function fetchContent(baseUrl: string): Promise<InterviewContent | null> {
  const res = await fetch(`${baseUrl}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=content`, {
    headers: supabaseHeaders(),
  })
  if (!res.ok) throw new Error(`Supabase GET failed: ${res.status}`)
  const rows = (await res.json()) as { content: InterviewContent }[]
  return rows[0]?.content ?? null
}

async function upsertContent(
  baseUrl: string,
  content: InterviewContent
): Promise<InterviewContent> {
  const res = await fetch(`${baseUrl}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({ id: ROW_ID, content, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status}`)
  const rows = (await res.json()) as { content: InterviewContent }[]
  return rows[0]?.content ?? content
}

function isValidContent(value: unknown): value is InterviewContent {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.selfIntro === 'string' &&
    record.selfIntro.trim().length > 0 &&
    typeof record.motivation === 'string' &&
    record.motivation.trim().length > 0 &&
    Array.isArray(record.categories)
  )
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  const baseUrl = process.env.SUPABASE_URL
  if (!baseUrl) {
    return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })
  }

  if (req.method === 'GET') {
    const pin = getQueryParam(req, 'pin')
    const allowedPin = process.env.VITE_BIRTHDAY

    if (!allowedPin || pin !== allowedPin) {
      return json(res, 401, { error: 'UNAUTHORIZED' })
    }

    try {
      const existing = await fetchContent(baseUrl)
      if (existing) return json(res, 200, existing)
      const seeded = await upsertContent(baseUrl, DEFAULT_INTERVIEW_CONTENT)
      return json(res, 200, seeded)
    } catch (error) {
      console.error('[api/ahram] GET failed', error)
      return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })
    }
  }

  if (req.method === 'PUT') {
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

    const { pin, content } = body as Record<string, unknown>
    const allowedPin = process.env.VITE_BIRTHDAY

    if (!allowedPin || typeof pin !== 'string' || pin !== allowedPin) {
      return json(res, 401, { error: 'UNAUTHORIZED' })
    }
    if (!isValidContent(content)) {
      return json(res, 400, { error: 'INVALID_CONTENT' })
    }

    try {
      const saved = await upsertContent(baseUrl, content)
      return json(res, 200, saved)
    } catch (error) {
      console.error('[api/ahram] PUT failed', error)
      return json(res, 503, { error: 'SUPABASE_UNAVAILABLE' })
    }
  }

  return json(res, 405, { error: 'Method Not Allowed' })
}
