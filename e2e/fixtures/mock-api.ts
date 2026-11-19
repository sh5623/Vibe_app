import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

// `pnpm dev` 는 api/ 를 서빙하지 않는다 — /api/morning-signal 응답을 레퍼런스 fixture 로 흉내 낸다.
// fixture: second-brain .wiki-automation/dashboard/fixtures/*.json 사본(dev 키 제외).
// Google Fonts 도 빈 응답으로 막는다: 라우트의 <link precedence> 는 React 19 suspensey stylesheet 라
// 글꼴 CSS 가 올 때까지 첫 커밋(과 data-ms-theme)이 늦어지고, 호스트를 못 찾으면 콘솔 오류가 난다.

// '1119' = 시안 11월 19일 실제 데이터(day-1119.json · 그날 하루만 있는 목록), '1119-nogh' = 같은 날 GitHub 집계 전(gh 행 없음).
type FixtureName = 'normal' | 'missing' | 'noai' | 'single' | '1119' | '1119-nogh'

type Day = { date: string } & Record<string, unknown>

interface Fixture {
  days: Day[]
  feeds: Record<string, unknown>
}

const THEMES = ['ai', 'world', 'gh'] as const

const read = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')) as T

/** day-1119.json 은 API 응답 모양({ day, feeds })이라 목록·상세 모양(days · `${date}--${theme}`)으로 펼친다 */
function load1119(noGh: boolean): Fixture {
  const fx = read<{ day: Day; feeds: Record<string, unknown> }>('day-1119.json')
  let day = fx.day
  const feeds: Record<string, unknown> = {}
  for (const t of THEMES) {
    if (fx.feeds[t] && !(noGh && t === 'gh')) feeds[`${day.date}--${t}`] = fx.feeds[t]
  }
  if (noGh) {
    const counts = day.counts as Record<string, number>
    const status = day.status as Record<string, string>
    day = {
      ...day,
      counts: { ...counts, gh: 0 },
      status: { ...status, gh: 'missing' },
      fe: { high: 0, picks: [] },
    }
  }
  return { days: [day], feeds }
}

function load(name: FixtureName): Fixture {
  if (name === '1119' || name === '1119-nogh') return load1119(name === '1119-nogh')
  return read<Fixture>(`${name}.json`)
}

export async function mockApi(
  page: Page,
  fixture: FixtureName | 'empty' | 'error',
  /** day: 모든 날짜 요약에 덮어쓸 값(예: highlight 가 제목에 없는 날) */
  opts: { delayMs?: number; day?: Record<string, unknown> } = {}
): Promise<void> {
  const base = fixture === 'empty' || fixture === 'error' ? null : load(fixture)
  const fx =
    base && opts.day ? { ...base, days: base.days.map((d) => ({ ...d, ...opts.day })) } : base
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' })
  )
  await page.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ body: '' }))
  await page.route('**/api/morning-signal**', async (route) => {
    // 첫 로딩 표시(LatticeLoader) 검증용 — 응답을 늦춘다
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs))
    if (fixture === 'error') {
      await route.fulfill({ status: 500, json: { error: 'SUPABASE_UNAVAILABLE' } })
      return
    }
    if (!fx) {
      await route.fulfill({ json: { days: [] } })
      return
    }
    const date = new URL(route.request().url()).searchParams.get('date')
    if (!date) {
      await route.fulfill({ json: { days: fx.days } })
      return
    }
    const day = fx.days.find((d) => d.date === date)
    if (!day) {
      await route.fulfill({ status: 404, json: { error: 'NOT_FOUND' } })
      return
    }
    const feeds: Record<string, unknown> = {}
    for (const t of THEMES) {
      const f = fx.feeds[`${date}--${t}`]
      if (f) feeds[t] = f
    }
    await route.fulfill({ json: { day, feeds } })
  })
}
