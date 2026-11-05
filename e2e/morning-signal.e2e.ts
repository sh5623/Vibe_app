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
  await expect(page.getByText('10월 19일 (월) · 08:03 KST 갱신')).toBeVisible()
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
  await page.locator('.ptitle h1').click()
  await expect(dialog).toBeHidden()
})

test('theme persists and does not leak to other routes', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-ms-theme', 'light')
  await page.getByRole('button', { name: '다크 모드로 전환' }).click()
  await expect(html).toHaveAttribute('data-ms-theme', 'dark')
  await expect(page.getByRole('button', { name: '라이트 모드로 전환' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('ms-theme'))).toBe('dark')

  await page.reload()
  await expect(html).toHaveAttribute('data-ms-theme', 'dark')

  // 앱 안에서 다른 라우트로 옮기면(문서는 그대로) 라우트가 언마운트되며 속성을 지운다
  await page.evaluate(() => {
    window.history.pushState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.locator('.ms')).toHaveCount(0)
  await expect(html).not.toHaveAttribute('data-ms-theme')

  await page.goto('/')
  await expect(html).not.toHaveAttribute('data-ms-theme')
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
  await expect(page.getByText('불러오는 중')).toBeVisible()
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

// ── 왼쪽 레일(768px 이상) — 2026-11-05 사이드 레일 설계 §5.2 ───────────────────────

/** (x, y) 지점에서 실제로 눌리는 요소가 레일 안인가 — 접힌 레일은 clip-path 로 56px 밖이 눌리지 않는다 */
const hitRail = (page: Page, x: number, y: number) =>
  page.evaluate(
    ([px, py]) => !!document.elementFromPoint(px ?? 0, py ?? 0)?.closest('.rail'),
    [x, y]
  )
const railRowY = async (page: Page, name: RegExp) => {
  const b = await page.locator('.rail').getByRole('link', { name }).boundingBox()
  return (b?.y ?? 0) + (b?.height ?? 0) / 2
}

test('header row is gone and title shows the view', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('header.top')).toHaveCount(0)
  await expect(page.locator('.ptitle h1')).toHaveText('News')
  await expect(page.getByText('10월 19일 (월) · 08:03 KST 갱신')).toBeVisible()
})

test('rail collapsed then opens on hover', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const y = await railRowY(page, /News/)
  expect(await hitRail(page, 150, y)).toBe(false)
  await page.mouse.move(28, y)
  await expect.poll(() => hitRail(page, 150, y), { timeout: 3000 }).toBe(true)
  await expect(page.locator('.rail').getByRole('link', { name: /News/ })).toContainText('24')
})

test('brushing past the rail does not open it', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const y = await railRowY(page, /News/)
  // 레일 위(28)를 지나 바로 본문(700)으로 — 두 이동을 같은 작업에서 보내 부하와 무관하게 0.12초 안에 빠져나가게 한다
  await page.evaluate(
    ([yy]) => {
      for (const x of [28, 700])
        document.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: x,
            clientY: yy,
            pointerType: 'mouse',
            bubbles: true,
          })
        )
    },
    [y]
  )
  await page.waitForTimeout(450) // 고정 대기: 부재 확인 — 그 사이 레일이 열리지 않는다
  await expect(page.locator('.rail')).not.toHaveClass(/open/)
  expect(await hitRail(page, 150, y)).toBe(false)
})

test('keyboard focus opens the rail and Escape closes it', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const y = await railRowY(page, /News/)
  await page.keyboard.press('Tab')
  await expect(page.locator('.rail').locator(':focus')).toHaveCount(1)
  // 펼침·접힘은 clip-path 전환(0.3s·0.2s)이라 병렬 실행 부하에선 고정 대기가 모자란다 — 그 상태가 될 때까지 기다린다
  await expect.poll(() => hitRail(page, 150, y), { timeout: 3000 }).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.locator('.rail')).not.toHaveClass(/open/)
  await expect.poll(() => hitRail(page, 150, y), { timeout: 3000 }).toBe(false)
})

test('rail link navigates with aria-current and stays open while hovered', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const nav = page.locator('.rail').getByRole('navigation', { name: '보기 전환' })
  await expect(nav.getByRole('link', { name: /News/ })).toHaveAttribute('aria-current', 'page')
  const y = await railRowY(page, /TO-DO/)
  await page.mouse.move(28, y)
  // 다 펼쳐진 뒤에 이름표 자리(x 150)를 누른다 — 병렬 부하에선 고정 대기가 모자란다
  await expect.poll(() => hitRail(page, 150, y), { timeout: 3000 }).toBe(true)
  await page.mouse.click(150, y)
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  await expect(nav.getByRole('link', { name: /TO-DO/ })).toHaveAttribute('aria-current', 'page')
  // 라우트 이동은 View Transition 이라 전환이 끝나기 전엔 elementFromPoint 가 전환 레이어를 집는다 — 끝날 때까지 기다린다
  await expect(page.locator('.rail')).toHaveClass(/open/)
  await expect.poll(() => hitRail(page, 150, y), { timeout: 3000 }).toBe(true)
  await page.mouse.move(900, 500)
  await expect.poll(() => hitRail(page, 150, y), { timeout: 3000 }).toBe(false)
})

test('reduced motion opens the rail at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  const y = await railRowY(page, /News/)
  await page.mouse.move(28, y)
  // 「바로」는 시계 시간 대신 전환 길이로 본다(부하에 따라 렌더 시각이 흔들린다): 머묾 지연·clip-path 전환이 없어야 한다
  await expect(page.locator('.rail')).toHaveClass(/open/, { timeout: 1000 })
  const dur = await page.evaluate(
    () => getComputedStyle(document.querySelector('.rail-in') as Element).transitionDuration
  )
  expect(Number.parseFloat(dur)).toBeLessThan(0.01)
  await expect.poll(() => hitRail(page, 150, y), { timeout: 1000 }).toBe(true)
})

// ── 배경·날짜 — 파형·출발판을 빼고 원래대로(2026-11-05 후속 「정신 없다」) ───────────────

test('background is the static grid, not animated waves', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.ms .grid-bg')).toHaveCount(1)
  await expect(page.locator('.ms .ms-waves')).toHaveCount(0)
  await expect(page.locator('.ms .grid-bg canvas, .ms > canvas')).toHaveCount(0)
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

// ── 목록 빨간 칩 전류(FE 높음·FE 주목) — 도넛 카드 전류의 작은 판, SVG 필터 하나를 함께 쓴다 ──

/** 목록 칩 상태 — 빨간 칩 수, 전류 필터(#ms-zap)가 걸린 칩 수, 테두리 고리가 있는 빨간 칩 수 */
const zapState = (page: Page) =>
  page.evaluate(() => {
    const chips = [...document.querySelectorAll('.ms .list .item .chip')]
    const high = chips.filter((c) => c.classList.contains('h'))
    const zapped = chips.filter((c) => getComputedStyle(c, '::after').filter.includes('ms-zap'))
    return {
      filters: document.querySelectorAll('#ms-zap').length,
      anim: document.querySelectorAll('#ms-zap animate').length,
      high: high.length,
      zapped: zapped.length,
      onlyHigh: zapped.every((c) => c.classList.contains('h')),
      // Tailwind preflight 가 모든 ::after 에 `border: 0 solid` 를 주므로 굵기와 content 로 본다
      ring: high.filter((c) => {
        const a = getComputedStyle(c, '::after')
        return a.content !== 'none' && Number.parseFloat(a.borderTopWidth) > 0
      }).length,
      canvases: document.querySelectorAll('.ms .list canvas').length,
    }
  })

test('FE high chips in AI and GitHub lists get the electric ring', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.ms .list .item').first()).toBeVisible()
  const ai = await zapState(page)
  expect(ai).toMatchObject({ filters: 1, high: 2, zapped: 2, onlyHigh: true, canvases: 0 })
  expect(ai.anim).toBeGreaterThan(0)
  // 시사·경제·상식은 FE 영향도가 없다(분류 칩뿐)
  await page.getByRole('tab', { name: /시사·경제·상식/ }).click()
  await expect.poll(async () => (await zapState(page)).high).toBe(0)
  expect((await zapState(page)).zapped).toBe(0)
  // GitHub 는 FE 주목 2건
  await page.getByRole('tab', { name: /GitHub/ }).click()
  await expect.poll(async () => (await zapState(page)).zapped).toBe(2)
  expect((await zapState(page)).onlyHigh).toBe(true)
})

test('reduced motion keeps a still red ring on FE high chips', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(page.locator('.ms .list .item').first()).toBeVisible()
  expect(await zapState(page)).toMatchObject({ high: 2, zapped: 0, ring: 2 })
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

/** 라우트가 바뀌는 순간(aria-current 가 TO-DO 로 넘어간 첫 프레임)의 선택 표시 애니메이션 수 */
const indicatorAnimsOnSwitch = (page: Page) =>
  page.waitForFunction(
    () => {
      const a = document.querySelector('.rail a[aria-current="page"]')
      if (!a?.textContent?.includes('TO-DO')) return false
      return { anims: document.querySelector('.rind')?.getAnimations().length ?? 0 }
    },
    null,
    { polling: 'raf', timeout: 5000 }
  )

test('rail indicator slides to the new view and the shell stays mounted', async ({ page }) => {
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
  await expect(page.locator('.ms .grid-bg')).toHaveCount(1)
  await page.evaluate(() => {
    ;(document.querySelector('.ms .grid-bg') as HTMLElement & { __keep?: number }).__keep = 1
  })
  const y = await railRowY(page, /TO-DO/)
  await page.mouse.click(28, y)
  const r = await (await indicatorAnimsOnSwitch(page)).jsonValue()
  expect((r as { anims: number }).anims).toBeGreaterThan(0)
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  expect(
    await page.evaluate(
      () => (document.querySelector('.ms .grid-bg') as HTMLElement & { __keep?: number })?.__keep
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
  const y = await railRowY(page, /TO-DO/)
  await page.mouse.click(28, y)
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0)
})
