import { expect, type Page, test } from '@playwright/test'
import { mockApi } from './fixtures/mock-api'
import { makeTodo, mockTodoApi } from './fixtures/mock-todo-api'

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
  await expect(page.locator('.ms-grid')).toHaveCount(0)
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
  await expect(page.locator('.ms-grid')).toBeVisible()
  await expect(page.locator('.cnt.big')).toHaveText('24건')

  // 이제부터 API가 500을 돌려준다. 목록·상세 둘 다 재시도(3번)까지 모두 실패해야 isError가 된다.
  let failures = 0
  page.on('response', (r) => {
    if (r.url().includes('/api/morning-signal') && r.status() === 500) failures += 1
  })
  await page.unrouteAll({ behavior: 'wait' })
  await mockApi(page, 'error')
  await page.clock.fastForward('02:00')
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange', { bubbles: true })))

  // 목록 1+3회 · 상세 1+3회
  await expect.poll(() => failures, { timeout: 20_000 }).toBeGreaterThanOrEqual(8)
  // 마지막 실패가 상태(isError)로 반영되어 다시 그려질 틈을 준다
  await page.waitForTimeout(500) // 고정 대기: 부재 확인 — 오류 문구가 뒤늦게 뜨지 않는다
  await expect(page.getByText('데이터를 불러오지 못했어요')).toHaveCount(0)
  await expect(page.locator('.ms-grid')).toBeVisible()
  await expect(page.locator('.cnt.big')).toHaveText('24건')
  await expect(dateBtn(page).locator('.t')).toHaveText('10월 19일 (월)')
})

test('오늘의 한 줄: 강조 구절 · 테마별 첫 소식 3칸', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.headline mark')).toContainText('막는 기업이 늘고')
  await expect(page.locator('.tops .top-cell')).toHaveCount(3)
  await expect(page.locator('.tops .top-cell').first()).toContainText('AI')

  // 날짜를 옮기면 그날 제목으로 바뀐다
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(page.locator('.headline mark')).toContainText('코스피는 7.57% 급락')

  // 헤드라인·피드가 없는 날(10-15)은 폴백 문구, 첫 소식 칸은 「아직 없음」
  await page.goto('/morning-signal#2026-10-15')
  await page.reload()
  await expect(page.locator('.headline.none')).toHaveText('오늘의 한 줄이 아직 없어요.')
  await expect(page.locator('.tops .top-cell')).toHaveCount(3)
  await expect(page.locator('.tops .top-cell .tt')).toHaveText([
    '아직 없음',
    '아직 없음',
    '아직 없음',
  ])
  expect(errors).toEqual([])
})

test('피드가 빈 날 — 챙길 것 빈 상태', async ({ page }) => {
  await mockApi(page, 'noai')
  await page.goto('/morning-signal')
  await expect(page.getByText('오늘 챙길 것이 없어요', { exact: true })).toBeVisible()
  await expect(page.locator('.tops [data-theme="ai"] .tt')).toHaveText('아직 없음')
})

test('tabs switch lists and rows expand', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const tabs = page.getByRole('tab')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.lines > li')).toHaveCount(6)

  await page.getByRole('tab', { name: /^GitHub/ }).click()
  await expect(page.getByRole('tab', { name: /^GitHub/ })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false')
  await expect(page.locator('.lines')).toHaveClass(/sr/)
  await expect(page.locator('.lines > li')).toHaveCount(13)

  const first = page.locator('.lines > li').first()
  await first.locator('summary').click()
  await expect(first.locator('details')).toHaveAttribute('open', '')
  await expect(first.locator('.more a')).toHaveAttribute('target', '_blank')

  // 날짜를 옮겨도 고른 탭이 남는다
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(page.getByRole('tab', { name: /^GitHub/ })).toHaveAttribute('aria-selected', 'true')
})

test('tab counts flag failures', async ({ page }) => {
  await mockApi(page, 'missing')
  await page.goto('/morning-signal')
  await expect(page.getByRole('tab', { name: /^GitHub/ }).locator('em')).toHaveText('수집 실패')
  await expect(page.getByRole('tab', { name: /^GitHub/ }).locator('em')).toHaveClass(/bad/)
  const world = page.getByRole('tab', { name: /^World/ })
  await expect(world.locator('em')).toHaveText('0건')
  await world.click()
  await expect(page.locator('[data-area="feed"] .empty')).toHaveText(
    '검증된 시사·경제·상식 뉴스가 없는 날이에요.'
  )
})

test('reduced motion still renders everything', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.cnt.big')).toHaveText('24건')
  await expect(page.locator('.lines > li')).toHaveCount(6)
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

test('스크롤해도 상단 막대가 화면 맨 위에 붙어 있다', async ({ page }) => {
  await mockApi(page, 'normal')
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/morning-signal')
    await expect(page.locator('header.top')).toBeVisible()
    await page.mouse.wheel(0, 900)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
    await expect
      .poll(async () => Math.abs((await page.locator('header.top').boundingBox())?.y ?? 99))
      .toBeLessThanOrEqual(1)
  }
})

test('날짜 이동은 상단 막대 오른쪽 칸 안에 있다', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.top-slot .datenav')).toBeVisible()
  await expect(page.locator('.ptitle')).toHaveCount(0)
  await expect(page.locator('.rail')).toHaveCount(0)
})

test('375px: 날짜 칸 글자와 「최신」이 잘리지 않고 화면 안에 있다', async ({ page }) => {
  await mockApi(page, '1119')
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/morning-signal')
  const label = page.locator('.datenav .cur')
  await expect(label.locator('.t')).toHaveText('11월 19일 (목)')
  await expect(label.getByText('최신')).toBeVisible()
  const fit = await label.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }))
  expect(fit.sw).toBeLessThanOrEqual(fit.cw)
  const nav = await page.locator('.datenav').boundingBox()
  expect((nav?.x ?? 0) + (nav?.width ?? 999)).toBeLessThanOrEqual(375 - 16)
})

test('1440px: 상단 막대 가장자리가 카드 가장자리와 같고 본문 폭은 시안 1320', async ({ page }) => {
  await mockApi(page, '1119')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/morning-signal')
  await expect(page.locator('.ms-grid > .p')).toHaveCount(5)
  const grid = await page.locator('.ms-grid').boundingBox()
  const brand = await page.locator('.top .brand').boundingBox()
  const nav = await page.locator('.top .datenav').boundingBox()
  // 시안 .wrap max-width 1320 − 좌우 여백 16 × 2
  expect(Math.round(grid?.width ?? 0)).toBe(1288)
  expect(Math.round(brand?.x ?? -1)).toBe(Math.round(grid?.x ?? 0))
  expect(Math.round((nav?.x ?? 0) + (nav?.width ?? 0))).toBe(
    Math.round((grid?.x ?? 0) + (grid?.width ?? 0))
  )
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

// ── NEWS 격자와 카드(B안 §4 · 시안 11월 19일 데이터) ─────────────────────────────────

test.describe('NEWS 격자 (11/19)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, '1119')
  })

  test('1행 카드는 위·아래 끝이 같고 제목 시작점이 같다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/morning-signal')
    await expect(page.locator('.ms-grid > .p')).toHaveCount(5)
    const boxes = await page.locator('.ms-grid > .p').evaluateAll((els) =>
      els.slice(0, 3).map((el) => {
        const r = el.getBoundingClientRect()
        const h = (el.querySelector('h2') as HTMLElement).getBoundingClientRect()
        return {
          t: Math.round(r.top),
          b: Math.round(r.bottom),
          ht: Math.round(h.top - r.top),
          hl: Math.round(h.left - r.left),
        }
      })
    )
    expect(boxes).toHaveLength(3)
    expect(new Set(boxes.map((x) => `${x.t}/${x.b}/${x.ht}/${x.hl}`)).size).toBe(1)
  })

  test('소식 탭은 AI · World · GitHub, 처음엔 AI', async ({ page }) => {
    await page.goto('/morning-signal')
    await expect(page.getByRole('tab')).toHaveText(['AI 3', 'World 5', 'GitHub 15'])
    await expect(page.getByRole('tab', { name: /^AI/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('오늘의 한 줄 World 칸을 누르면 소식이 World로 바뀐다', async ({ page }) => {
    await page.goto('/morning-signal')
    await page.locator('.tops [data-theme="world"]').click()
    await expect(page.getByRole('tab', { name: /^World/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.lines > li')).toHaveCount(5)
  })

  test('줄 오른쪽 정보 — AI는 FE 영향, World는 분야, GitHub는 ★ 또는 FE 높음 칩', async ({
    page,
  }) => {
    await page.goto('/morning-signal')
    await expect(page.locator('.lines > li').first().locator('.m')).toHaveText('FE 중간')
    await page.getByRole('tab', { name: /^World/ }).click()
    await expect(page.locator('.lines > li').first().locator('.m')).toHaveText('시사·국제')
    await page.getByRole('tab', { name: /^GitHub/ }).click()
    await expect(page.locator('.lines > li').first().locator('.m')).toHaveText('★ 9,163')
    await expect(page.locator('.lines > li').nth(4).locator('.chip.h')).toHaveText('FE 높음')
  })

  test('챙길 것은 수능(오늘)과 Anthropic 상장(예정)', async ({ page }) => {
    await page.goto('/morning-signal')
    const rows = page.locator('[data-area="alert"] .rows > li')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('수능')
    await expect(rows.first().locator('.chip')).toHaveText('오늘')
    await expect(rows.nth(1).locator('.chip')).toHaveText('예정')
  })

  test('오늘의 구성은 23건, FE에 쓸 레포는 오늘 별 많은 순 3개', async ({ page }) => {
    await page.goto('/morning-signal')
    await expect(page.locator('[data-area="mix"] .cnt.big')).toHaveText('23건')
    await expect(page.locator('[data-area="mix"] .meter b')).toHaveText(['3', '8', '7'])
    await expect(page.locator('.picks .pk-h a')).toHaveText([
      'dream-num/univer',
      'ag-ui-protocol/ag-ui',
      'sveltejs/svelte',
    ])
  })

  test('375px에서 가로 스크롤이 없다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/morning-signal')
    await expect(page.locator('.ms-grid > .p')).toHaveCount(5)
    await page.getByRole('tab', { name: /^GitHub/ }).click()
    await expect(page.locator('.lines > li')).toHaveCount(15)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  })

  test('FE 높음 칩 고리는 화면에 들어온 카드(.live)에서만 돈다', async ({ page }) => {
    // 휴대폰 1열에서 FE에 쓸 레포 카드는 맨 아래라 처음엔 화면 밖이다
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/morning-signal')
    const card = page.locator('[data-area="trend"]')
    const chip = card.locator('.chip.h').first()
    await expect(chip).toBeAttached()
    await expect(card).not.toHaveClass(/\blive\b/)
    await chip.scrollIntoViewIfNeeded()
    await expect(card).toHaveClass(/\blive\b/)
    await expect
      .poll(() => chip.evaluate((el) => getComputedStyle(el, '::after').animationPlayState))
      .toBe('running')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(card).not.toHaveClass(/\blive\b/)
  })
})

test('highlight가 제목에 없으면 강조 없이 그린다', async ({ page }) => {
  await mockApi(page, '1119', { day: { highlight: '없는 구절' } })
  await page.goto('/morning-signal')
  await expect(page.locator('.headline')).toHaveText(
    'APEC 정상들은 선전에, 코스피는 다시 5,000선 위로'
  )
  await expect(page.locator('.headline mark')).toHaveCount(0)
})

test('GitHub 집계 전 — 첫 소식 칸은 「아직 없음」, FE에 쓸 레포는 빈 상태', async ({ page }) => {
  await mockApi(page, '1119-nogh')
  await page.goto('/morning-signal')
  await expect(page.locator('.tops [data-theme="gh"] .tt')).toHaveText('아직 없음')
  await expect(page.getByText('오늘은 FE 영향이 높은 레포가 없어요', { exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: /^GitHub/ }).locator('em')).toHaveText('수집 실패')
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
  await expect(page.locator('.ms-grid')).toBeVisible()
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

// ── 레포를 TO-DO에 담기(Task 6) ─────────────────────────────────────────
test.describe('FE에 쓸 레포 → TO-DO', () => {
  const add = (page: Page) => page.locator('.picks [aria-label="TO-DO에 담기"]').first()
  const UNIVER = 'https://github.com/dream-num/univer'

  test.beforeEach(async ({ page }) => {
    await mockApi(page, '1119')
  })

  test('잠긴 상태에서 담기 → PIN → 담김', async ({ page }) => {
    const state = await mockTodoApi(page)
    await page.goto('/morning-signal')
    await expect(add(page)).toHaveAttribute('aria-pressed', 'false')
    await add(page).click()
    await expect(page.locator('#pinDlg')).toBeVisible()
    await expect(page.locator('#pinDlg')).toContainText('PIN을 입력하세요')
    await page.keyboard.type('1234')
    await expect(page.locator('#pinDlg')).toBeHidden()
    await expect(add(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status')).toContainText('TO-DO에 담았어요')
    expect(state.todos[0]).toMatchObject({
      title: 'dream-num/univer',
      link: UNIVER,
      status: 'todo',
    })
    expect(state.creates).toBe(1)
  })

  test('풀려 있으면 PIN 없이 바로 담고, 다시 눌러도 더 담지 않는다', async ({ page }) => {
    const state = await mockTodoApi(page, { unlocked: true })
    await page.goto('/morning-signal')
    await add(page).click()
    await expect(add(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('#pinDlg')).toHaveCount(0)
    await add(page).click()
    expect(state.creates).toBe(1)
  })

  test('PIN이 틀리면 창 안에 오류', async ({ page }) => {
    await mockTodoApi(page)
    await page.goto('/morning-signal')
    await add(page).click()
    await page.keyboard.type('0000')
    await expect(page.locator('#pinDlg [role="alert"]')).toContainText('PIN이 맞지 않아요')
    await expect(page.locator('#pinDlg')).toBeVisible()
  })

  test('잠금 상태(429)면 창 안에 남은 시간', async ({ page }) => {
    await mockTodoApi(page, { locked: true })
    await page.goto('/morning-signal')
    await add(page).click()
    await expect(page.locator('#pinDlg')).toContainText('남음')
    await expect(page.locator('#pinDlg input')).toBeDisabled()
  })

  test('PIN 창을 닫으면 담기가 취소된다', async ({ page }) => {
    await page.clock.install()
    const state = await mockTodoApi(page)
    await page.goto('/morning-signal')
    await add(page).click()
    await expect(page.locator('#pinDlg')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#pinDlg')).toHaveCount(0)
    // 다른 곳에서 풀린 것처럼 — 세션을 다시 읽게 한다
    state.unlocked = true
    const found = page.waitForResponse((r) => r.url().includes('op=find'))
    // 세션은 60초 동안 신선하다 — 시계를 넘기고 숨김 → 보임으로 다시 읽게 한다
    await page.clock.fastForward(61_000)
    await page.evaluate(() => {
      for (const v of ['hidden', 'visible']) {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v })
        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
      }
    })
    await found
    expect(state.creates).toBe(0)
    await expect(add(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('이미 담은 레포(완료 포함)는 처음부터 ✓', async ({ page }) => {
    const state = await mockTodoApi(page, {
      unlocked: true,
      seed: [makeTodo({ title: 'dream-num/univer', link: UNIVER, status: 'done' })],
    })
    await page.goto('/morning-signal')
    await expect(add(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(add(page)).toContainText('TO-DO')
    await add(page).click()
    expect(state.creates).toBe(0)
    await expect(page.locator('.picks [aria-label="TO-DO에 담기"]').nth(1)).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  test('저장 실패면 토스트', async ({ page }) => {
    const state = await mockTodoApi(page, { unlocked: true })
    state.failNext = { op: 'create', status: 503, error: 'DB_DOWN' }
    await page.goto('/morning-signal')
    await add(page).click()
    await expect(page.getByRole('status')).toContainText('저장하지 못했어요. 다시 시도해 주세요.')
    await expect(add(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('풀려 있으면 마감 임박 할 일이 챙길 것에 붙는다', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-19T03:00:00Z'))
    await mockTodoApi(page, {
      unlocked: true,
      seed: [
        makeTodo({ title: '분기 보고서 제출', dueDate: '2026-11-20' }),
        makeTodo({ title: '먼 일', dueDate: '2026-11-30' }),
      ],
    })
    await page.goto('/morning-signal')
    const rows = page.locator('[data-area="alert"] .rows > li')
    await expect(rows.filter({ hasText: '분기 보고서 제출' })).toHaveCount(1)
    await expect(rows.filter({ hasText: '먼 일' })).toHaveCount(0)
  })

  test('잠겨 있으면 PIN을 묻지 않고 마감 항목도 없다', async ({ page }) => {
    await mockTodoApi(page, {
      seed: [makeTodo({ title: '분기 보고서 제출', dueDate: '2026-11-19' })],
    })
    await page.goto('/morning-signal')
    await expect(page.locator('[data-area="alert"] .rows > li').first()).toBeVisible()
    await expect(page.locator('[data-area="alert"]')).not.toContainText('분기 보고서 제출')
    await expect(page.locator('#pinDlg')).toHaveCount(0)
  })
})
