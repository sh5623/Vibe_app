import { expect, type Page, test } from '@playwright/test'
import { mockApi } from './fixtures/mock-api'

const dateBtn = (page: Page) => page.locator('.datenav .cur')

test('opens latest date with 최신 badge', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 19일 (월)')
  await expect(dateBtn(page).getByText('최신')).toBeVisible()
  await expect(page.getByRole('button', { name: '다음 날짜' })).toBeDisabled()
  await expect(page).toHaveURL(/#2026-10-19$/)
})

test('honours hash and prev button updates hash', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal#2026-10-15')
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 15일 (목)')
  await expect(dateBtn(page).getByText('최신')).toBeHidden()
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 14일 (수)')
  await expect(page).toHaveURL(/#2026-10-14$/)
})

test('falls back to latest for unknown hash', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await mockApi(page, 'normal')
  await page.goto('/morning-signal#2026-10-18')
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 19일 (월)')
  await expect(page).toHaveURL(/#2026-10-19$/)
  expect(errors).toEqual([])
})

test('calendar navigates and closes on Escape', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const dialog = page.getByRole('dialog', { name: '날짜 선택' })
  await dateBtn(page).click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('2026년 10월')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '10월 13일' })).toBeEnabled()
  await expect(dialog.getByRole('button', { name: '10월 20일' })).toBeDisabled()
  await dialog.getByRole('button', { name: '10월 16일' }).click()
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 16일 (금)')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/#2026-10-16$/)

  await dateBtn(page).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  // 바깥을 눌러도 닫힌다
  await dateBtn(page).click()
  await expect(dialog).toBeVisible()
  await page.locator('.top .brand').click()
  await expect(dialog).toBeHidden()
})

test('밝은 화면 고정 — 테마 버튼이 없고 저장된 dark를 무시한다', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.addInitScript(() => localStorage.setItem('ms-theme', 'dark'))
  await page.goto('/morning-signal')
  await expect(page.locator('html')).toHaveAttribute('data-ms-theme', 'light')
  await expect(page.locator('.theme')).toHaveCount(0)

  // 앱 안에서 다른 라우트로 옮기면(문서는 그대로) 라우트가 언마운트되며 속성을 지운다
  await page.evaluate(() => {
    window.history.pushState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.locator('.ms')).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-ms-theme')
})

test('전류 필터가 없다', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('#ms-zap')).toHaveCount(0)
  await expect(page.locator('.aurora')).toHaveCount(1)
  await expect(page.locator('.grid-bg')).toHaveCount(0)
})

test('empty state', async ({ page }) => {
  await mockApi(page, 'empty')
  await page.goto('/morning-signal')
  await expect(page.getByText('아직 저장된 뉴스가 없어요')).toBeVisible()
  await expect(page.getByText('매일 아침 8시에 첫 브리핑이 들어와요.')).toBeVisible()
  await expect(page.locator('.content')).toHaveCount(0)
})

test('error state after retries', async ({ page }) => {
  await mockApi(page, 'error')
  await page.goto('/morning-signal')
  await expect(page.locator('.ms-loading')).toBeVisible()
  await expect(page.getByText('데이터를 불러오지 못했어요')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('잠시 뒤 새로고침해 주세요.')).toBeVisible()
})

test('background refetch failure keeps the dashboard instead of the error card', async ({
  page,
}) => {
  // staleTime(60s)을 넘기려면 시계를 앞으로 돌려야 한다 — install 뒤에도 시간은 그대로 흐른다
  await page.clock.install()
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.content')).toBeVisible()
  await expect(page.locator('[data-kpi="total"] .odo')).toHaveAttribute('data-value', '24')

  // 이제부터 API가 500을 돌려준다. 목록·상세 둘 다 재시도(3번)까지 모두 실패해야 isError가 된다.
  let failures = 0
  page.on('response', (r) => {
    if (r.url().includes('/api/morning-signal') && r.status() === 500) failures += 1
  })
  await page.unrouteAll({ behavior: 'wait' })
  await mockApi(page, 'error')
  await page.clock.fastForward('02:00')
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))

  // 목록 1+3회 · 상세 1+3회
  await expect.poll(() => failures, { timeout: 20_000 }).toBeGreaterThanOrEqual(8)
  // 마지막 실패가 상태(isError)로 반영되어 다시 그려질 틈을 준다
  await page.waitForTimeout(500) // 고정 대기: 부재 확인 — 오류 문구가 뒤늦게 뜨지 않는다
  await expect(page.getByText('데이터를 불러오지 못했어요')).toHaveCount(0)
  await expect(page.locator('.content')).toBeVisible()
  await expect(page.locator('[data-kpi="total"] .odo')).toHaveAttribute('data-value', '24')
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 19일 (월)')
})

test('kpis show counts, deltas and failure chips', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('[data-kpi="total"] .odo')).toHaveAttribute('data-value', '24')
  await expect(page.locator('[data-kpi="gh"] .delta')).toHaveText('+1')
  await expect(page.locator('[data-kpi="gh"] .delta')).toHaveAttribute('title', '10.16 대비')
  await expect(page.locator('[data-kpi="ai"] .delta')).toHaveClass(/down/)
  await expect(page.locator('[data-kpi="ai"] .kchip')).toBeHidden()

  // missing: gh 행 없음 → 수집 실패, world 0건 → 0건
  await page.unrouteAll({ behavior: 'wait' })
  await mockApi(page, 'missing')
  await page.reload()
  await expect(page.locator('[data-kpi="gh"] .kchip')).toHaveText('수집 실패')
  await expect(page.locator('[data-kpi="gh"] .kchip')).not.toHaveClass(/zero/)
  await expect(page.locator('[data-kpi="world"] .kchip')).toHaveText('0건')
  await expect(page.locator('[data-kpi="world"] .kchip')).toHaveClass(/zero/)
  await expect(page.locator('[data-kpi="gh"] .odo')).toHaveAttribute('data-value', '0')
})

test('sparkline end dot stays round at phone width', async ({ page }) => {
  // 선은 가로로만 늘어나는 SVG 라 폭이 넓은 모바일 1열에서 끝점이 타원으로 납작해졌다
  await page.setViewportSize({ width: 375, height: 800 })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const dot = page.locator('[data-kpi="ai"] .spark-dot')
  await expect(dot).toBeVisible()
  const box = await dot.boundingBox()
  expect(box).not.toBeNull()
  // 맥박 애니메이션 중에도 가로·세로 비율은 같다
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? 1))).toBeLessThan(0.5)
})

test('headline renders mark and tops', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.eyebrow')).toHaveText('10.19 월 · 오늘의 한 줄')
  await expect(page.locator('h2.line mark')).toContainText('막는 기업이 늘고')
  await expect(page.locator('.tops li')).toHaveCount(3)
  await expect(page.locator('.tops li').first()).toContainText('AI')
  await expect(page.locator('.barlist .row')).toHaveCount(5)
  await expect(page.locator('.barlist .row.first')).toContainText('MadsLorentzen/ai-job-search')
  await expect(page.locator('.pick span')).toHaveText([
    'FE 주목 · anthropics/claude-plugins-official',
    'FE 주목 · cursor/plugins',
  ])

  // 단어가 날아가는 중(220ms)에 처음 날짜로 돌아와도 out 상태로 굳지 않고 다시 지어진다
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(page.locator('.eyebrow')).toHaveText('10.16 금 · 오늘의 한 줄')
  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(page.locator('.eyebrow')).toHaveText('10.19 월 · 오늘의 한 줄')
  await expect(page.locator('h2.line .w.out')).toHaveCount(0)
  await expect(page.locator('h2.line mark')).toContainText('막는 기업이 늘고')

  // 헤드라인·tops 가 없는 날(10-15)로 옮기면 폴백 문구로 바뀐다
  await page.goto('/morning-signal#2026-10-15')
  await page.reload()
  await expect(page.locator('h2.line.none')).toHaveText('오늘의 한 줄이 아직 없어요.')
  await expect(page.locator('.tops li')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('bento empty texts when feeds missing', async ({ page }) => {
  await mockApi(page, 'noai')
  await page.goto('/morning-signal')
  await expect(page.getByText('AI 뉴스를 가져오지 못했어요.', { exact: true })).toBeVisible()
  await expect(page.getByText('GitHub 트렌딩을 가져오지 못했어요.', { exact: true })).toBeVisible()
  await expect(
    page.getByText('검증된 시사·경제 뉴스가 없는 날이에요.', { exact: true })
  ).toBeVisible()
})

test('tabs switch lists and rows expand', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const tabs = page.getByRole('tab')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.list .item')).toHaveCount(6)

  await page.getByRole('tab', { name: /GitHub/ }).click()
  await expect(page.getByRole('tab', { name: /GitHub/ })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false')
  await expect(page.locator('.list')).toHaveClass(/sr/)
  await expect(page.locator('.list .item')).toHaveCount(13)

  const first = page.locator('.list .item').first()
  await first.locator('> button').click()
  await expect(first.locator('> button')).toHaveAttribute('aria-expanded', 'true')
  await expect(first).toHaveClass(/open/)
  await expect(first.locator('.more a')).toHaveAttribute('target', '_blank')

  // 날짜를 옮겨도 고른 탭이 남는다
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(page.getByRole('tab', { name: /GitHub/ })).toHaveAttribute('aria-selected', 'true')
})

test('tab counts flag failures', async ({ page }) => {
  await mockApi(page, 'missing')
  await page.goto('/morning-signal')
  await expect(page.getByRole('tab', { name: /GitHub/ }).locator('em')).toHaveText('수집 실패')
  await expect(page.getByRole('tab', { name: /GitHub/ }).locator('em')).toHaveClass(/bad/)
  const world = page.getByRole('tab', { name: /시사/ })
  await expect(world.locator('em')).toHaveText('0건')
  await world.click()
  await expect(page.locator('.list .none')).toHaveText(
    '검증된 시사·경제·상식 뉴스가 없는 날이에요.'
  )
})

test('reduced motion still renders everything', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('[data-kpi="total"] .odo')).toHaveAttribute('data-value', '24')
  await expect(page.locator('.list .item')).toHaveCount(6)
})

test('home links to morning signal', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/')
  const card = page.locator('div', { hasText: /^Morning Signal\s*뉴스 대시보드/ }).last()
  await card.getByRole('button', { name: '보러가기' }).click()
  await expect(page).toHaveURL(/\/morning-signal(#.*)?$/)
})

// ── 상단 막대 · 하단 탭 바(B안) ───────────────────────────────────────────────────────

test('가운데 탭 자리는 NEWS와 TO-DO에서 같다', async ({ page }) => {
  await mockApi(page, 'normal')
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/morning-signal')
    await expect(page.locator('.views')).toBeVisible()
    const a = await page.locator('.views').boundingBox()
    await page.getByRole('link', { name: 'TO-DO' }).click()
    await expect(page).toHaveURL(/\/todo$/)
    const b = await page.locator('.views').boundingBox()
    expect(Math.abs((a?.x ?? 0) - (b?.x ?? -1))).toBeLessThan(1)
  }
})

test('상단 막대는 전체 폭이고 .wrap 밖에 있다', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto('/morning-signal')
  const box = await page.locator('header.top').boundingBox()
  expect(Math.round(box?.width ?? 0)).toBe(1440)
  await expect(page.locator('.wrap header.top')).toHaveCount(0)
})

test('날짜 이동은 상단 막대 오른쪽 칸 안에 있다', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.top-slot .datenav')).toBeVisible()
  await expect(page.locator('.ptitle')).toHaveCount(0)
  await expect(page.locator('.rail')).toHaveCount(0)
})

test('상단 막대: 로고·이름·보기 전환에 현재 화면 표시', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('header.top .brand .bn')).toHaveText('Morning Signal')
  const nav = page.locator('header.top').getByRole('navigation', { name: '보기 전환' })
  await expect(nav.getByRole('link', { name: 'NEWS' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: 'TO-DO' }).click()
  await expect(nav.getByRole('link', { name: 'TO-DO' })).toHaveAttribute('aria-current', 'page')
})

test('휴대폰: 스크롤 뒤에도 하단 탭 바가 화면 아래에 있다', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/morning-signal')
  await expect(page.locator('.tabbar')).toBeVisible()
  await page.mouse.wheel(0, 900)
  await expect
    .poll(async () => {
      const box = await page.locator('.tabbar').boundingBox()
      return Math.round((box?.y ?? 0) + (box?.height ?? 0))
    })
    .toBe(812)
  expect(await page.locator('.top').evaluate((el) => getComputedStyle(el).backdropFilter)).toBe(
    'none'
  )
})

// ── 배경·날짜 — 파형·출발판을 빼고 원래대로(2026-11-05 후속 「정신 없다」) ───────────────

test('background is the static aurora, not animated waves', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.ms .aurora')).toHaveCount(1)
  await expect(page.locator('.ms .ms-waves')).toHaveCount(0)
  await expect(page.locator('.ms > canvas')).toHaveCount(0)
})

test('date label is plain text and changes at once', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const t = dateBtn(page).locator('.t')
  await expect(t).toHaveText('10월 19일 (월)')
  await expect(t.locator('*')).toHaveCount(0)
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(t).toHaveText('10월 16일 (금)')
  await expect(t.locator('*')).toHaveCount(0)
})

test('rapid date clicks settle on the last date', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '이전 날짜' }).click()
    await page.waitForTimeout(100) // 고정 대기: 연타 간격
  }
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 14일 (수)')
})

// ── FE 높음 경고 전류 테두리(react-bits ElectricBorder) — 도넛 카드, 설계 §4-2·§6.2 ──

test('electric border wraps the donut card when FE high exists', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const wrap = page.locator('.bento .ms-electric')
  await expect(wrap).toHaveCount(1)
  await expect(wrap.locator('canvas')).toHaveCount(1)
  await expect(wrap.getByRole('heading', { name: 'AI · FE 영향도' })).toBeVisible()
})

test('no electric border on a day without FE high', async ({ page }) => {
  await mockApi(page, 'noai')
  await page.goto('/morning-signal')
  await expect(page.getByRole('heading', { name: 'AI · FE 영향도' })).toBeVisible()
  await expect(page.locator('.bento .ms-electric')).toHaveCount(0)
})

test('electric border does not cause horizontal scroll at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.bento .ms-electric canvas')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})

// ── 신호 수신 중(react-bits LatticeLoader) — 첫 로딩, 설계 §6.2 ───────────────────

test('shows the lattice loader while news loads', async ({ page }) => {
  await mockApi(page, 'normal', { delayMs: 1500 })
  await page.goto('/morning-signal')
  // role=status 는 내용으로 이름이 붙지 않는다 — 로딩 영역 안의 상태 요소와 문구로 확인한다
  const loader = page.locator('.ms-loading [role="status"]')
  await expect(loader).toBeVisible()
  await expect(loader).toContainText('신호 수신 중')
  await expect(loader.locator('.lattice-loader__cell').first()).toBeVisible()
  await expect(loader).toBeHidden({ timeout: 5000 })
  await expect(page.locator('#k-total, .kpi').first()).toBeVisible()
})

// ── 리뷰 지적: 보기 전환이 레일·탭 바·배경을 다시 마운트하지 않는다(레이아웃 라우트) ─────────────

test('the shell stays mounted when switching views', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: number }
    w.__vt = 0
    const orig = document.startViewTransition?.bind(document)
    if (orig)
      document.startViewTransition = ((cb: () => void) => {
        w.__vt += 1
        return orig(cb)
      }) as typeof document.startViewTransition
  })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.ms .aurora')).toHaveCount(1)
  await page.evaluate(() => {
    ;(document.querySelector('.ms .aurora') as HTMLElement & { __keep?: number }).__keep = 1
  })
  await page.locator('.views').getByRole('link', { name: 'TO-DO' }).click()
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  expect(
    await page.evaluate(
      () => (document.querySelector('.ms .aurora') as HTMLElement & { __keep?: number })?.__keep
    )
  ).toBe(1)
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBeGreaterThan(0)
})

test('reduced motion switches views without a view transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: number }
    w.__vt = 0
    const orig = document.startViewTransition?.bind(document)
    if (orig)
      document.startViewTransition = ((cb: () => void) => {
        w.__vt += 1
        return orig(cb)
      }) as typeof document.startViewTransition
  })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await page.locator('.views').getByRole('link', { name: 'TO-DO' }).click()
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0)
})
