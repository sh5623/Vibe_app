import { expect, type Page, test } from '@playwright/test'
import { mockApi } from './fixtures/mock-api'

const dateBtn = (page: Page) => page.locator('.datenav .cur')

test('opens latest date with 최신 badge', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal')
  await expect(dateBtn(page).locator('.t')).toHaveText('Mon, Oct 19')
  await expect(dateBtn(page).getByText('최신')).toBeVisible()
  await expect(page.getByRole('button', { name: '다음 날짜' })).toBeDisabled()
  await expect(page).toHaveURL(/#2026-10-19$/)
  await expect(page.getByText('Mon, Oct 19 · 08:03 KST 갱신')).toBeVisible()
})

test('honours hash and prev button updates hash', async ({ page }) => {
  await mockApi(page, 'normal')
  await page.goto('/morning-signal#2026-10-15')
  await expect(dateBtn(page).locator('.t')).toHaveText('Thu, Oct 15')
  await expect(dateBtn(page).getByText('최신')).toBeHidden()
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(dateBtn(page).locator('.t')).toHaveText('Wed, Oct 14')
  await expect(dateBtn(page).locator('.t')).toHaveClass(/in-l/)
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
  await expect(dateBtn(page).locator('.t')).toHaveText('Mon, Oct 19')
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
  await expect(dateBtn(page).locator('.t')).toHaveText('Fri, Oct 16')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/#2026-10-16$/)

  await dateBtn(page).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  // 바깥을 눌러도 닫힌다
  await dateBtn(page).click()
  await expect(dialog).toBeVisible()
  await page.locator('.brand h1').click()
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
  await expect(page.getByText('평일 아침 8시에 첫 브리핑이 들어와요.')).toBeVisible()
  await expect(page.locator('.content')).toHaveCount(0)
})

test('error state after retries', async ({ page }) => {
  await mockApi(page, 'error')
  await page.goto('/morning-signal')
  await expect(page.getByText('불러오는 중')).toBeVisible()
  await expect(page.getByText('데이터를 불러오지 못했어요')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('잠시 뒤 새로고침해 주세요.')).toBeVisible()
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
  await expect(page.getByText('검증된 시사·경제 뉴스가 없는 날이에요.', { exact: true })).toBeVisible()
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
