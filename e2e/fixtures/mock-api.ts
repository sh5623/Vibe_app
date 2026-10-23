import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

// `pnpm dev` 는 api/ 를 서빙하지 않는다 — /api/morning-signal 응답을 레퍼런스 fixture 로 흉내 낸다.
// fixture: second-brain .wiki-automation/dashboard/fixtures/*.json 사본(dev 키 제외).
// Google Fonts 도 빈 응답으로 막는다: 라우트의 <link precedence> 는 React 19 suspensey stylesheet 라
// 글꼴 CSS 가 올 때까지 첫 커밋(과 data-ms-theme)이 늦어지고, 호스트를 못 찾으면 콘솔 오류가 난다.

type FixtureName = 'normal' | 'missing' | 'noai' | 'single'

interface Fixture {
  days: Array<{ date: string } & Record<string, unknown>>
  feeds: Record<string, unknown>
}

const THEMES = ['ai', 'world', 'gh'] as const

function load(name: FixtureName): Fixture {
  return JSON.parse(readFileSync(new URL(`./${name}.json`, import.meta.url), 'utf8')) as Fixture
}

export async function mockApi(page: Page, fixture: FixtureName | 'empty' | 'error'): Promise<void> {
  const fx = fixture === 'empty' || fixture === 'error' ? null : load(fixture)
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' })
  )
  await page.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ body: '' }))
  await page.route('**/api/morning-signal**', async (route) => {
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
