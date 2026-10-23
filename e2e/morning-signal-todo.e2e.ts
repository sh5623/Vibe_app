import { expect, type Page, test } from '@playwright/test'
import { mockApi } from './fixtures/mock-api'
import { mockTodoApi } from './fixtures/mock-todo-api'

// 휴대폰 폭에서 본다. 날짜는 2026-10-23(금) KST 정오로 고정한다(「오늘·어제」·마감 계산).
test.use({ viewport: { width: 375, height: 812 } })

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-23T03:00:00Z'))
  await mockApi(page, 'normal')
})

async function noHorizontalScroll(page: Page) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(w).toBeLessThanOrEqual(375)
}

test('news header has view switch to TO-DO', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal')
  const nav = page.getByRole('navigation', { name: '보기 전환' })
  await expect(nav.getByRole('link', { name: '뉴스' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: 'TO-DO' }).click()
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  await expect(page.getByText('본인 확인')).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: '보기 전환' }).getByRole('link', { name: 'TO-DO' })
  ).toHaveAttribute('aria-current', 'page')
})

test('todo page keeps news shell and theme', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('본인 확인')).toBeVisible()
  await expect(page.locator('.ms .aurora')).toHaveCount(1)
  await expect(page.locator('.ms .grid-bg')).toHaveCount(1)
  await expect(page.locator('html')).toHaveAttribute('data-ms-theme', /light|dark/)
  await expect(page.locator('.datenav')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '다시 잠그기' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Morning Signal' })).toBeVisible()
})

test('switch sits at the same second-row spot on both screens at 375px', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  const spots: Array<{ x: number; y: number }> = []
  for (const path of ['/morning-signal', '/morning-signal/todo']) {
    await page.goto(path)
    const sw = page.getByRole('navigation', { name: '보기 전환' })
    await expect(sw).toBeVisible()
    const s = await sw.boundingBox()
    const theme = await page.locator('.ms .theme').boundingBox()
    // 브랜드·테마는 첫 줄, 전환은 그 아래 줄
    expect(s && theme && s.y).toBeGreaterThan((theme?.y ?? 0) + (theme?.height ?? 0) - 1)
    if (s) spots.push({ x: Math.round(s.x), y: Math.round(s.y) })
    await expect(page.getByRole('heading', { name: 'Morning Signal' })).toBeVisible()
    await noHorizontalScroll(page)
  }
  expect(spots[0]).toEqual(spots[1])
  // 뉴스의 날짜 이동은 전환 옆 같은 줄
  await page.goto('/morning-signal')
  const nav = await page.locator('.datenav').boundingBox()
  const sw = await page.getByRole('navigation', { name: '보기 전환' }).boundingBox()
  expect(
    nav && sw && Math.abs(nav.y + nav.height / 2 - (sw.y + sw.height / 2))
  ).toBeLessThanOrEqual(6)
  expect(nav?.width).toBeGreaterThan(190)
})

test('unlocked session shows lock button that relocks', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('남은 일')).toBeVisible()
  await page.getByRole('button', { name: '다시 잠그기' }).click()
  await expect(page.getByText('본인 확인')).toBeVisible()
  expect(state.unlocked).toBe(false)
})

// ── PIN 화면(시안 D) ───────────────────────────────────────────────────

const pinInput = (page: Page) => page.getByLabel('PIN 4자리')

test('wrong PIN shows error then clears', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('0000')
  await expect(page.getByText('PIN이 맞지 않아요. 다시 입력해 주세요.')).toBeVisible()
  await expect(page.locator('.pin .slot.filled')).toHaveCount(0, { timeout: 2500 })
  await expect(page.locator('.pin .slot.active')).toHaveCount(1)
  await expect(page.locator('.pin .slot').first()).toHaveClass(/active/)
})

test('right PIN unlocks to list', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('본인 확인')).toBeVisible()
  await pinInput(page).pressSequentially('1234')
  await expect(page.getByText('확인됐어요')).toBeVisible()
  await expect(page.getByText('남은 일')).toBeVisible({ timeout: 4000 })
  await expect(page.getByRole('button', { name: '다시 잠그기' })).toBeVisible()
})

test('backspace removes the last digit', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('12')
  await expect(page.locator('.pin .slot.filled')).toHaveCount(2)
  await pinInput(page).press('Backspace')
  await expect(page.locator('.pin .slot.filled')).toHaveCount(1)
  await pinInput(page).pressSequentially('234')
  await expect(page.getByText('남은 일')).toBeVisible({ timeout: 4000 })
})

test('paste uses first four digits', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).fill('123456')
  await expect(page.getByText('남은 일')).toBeVisible({ timeout: 4000 })
})

test('locked shows countdown', async ({ page }) => {
  await mockTodoApi(page, { locked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('10분 뒤에 다시 시도해 주세요')).toBeVisible()
  await expect(page.getByText(/\d+:\d{2} 남음/)).toBeVisible()
  await expect(pinInput(page)).toBeDisabled()
})

test('fifth wrong PIN locks', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  for (let i = 0; i < 5; i++) {
    await expect(pinInput(page)).toBeEnabled()
    await expect(page.locator('.pin .slot.filled')).toHaveCount(0, { timeout: 2500 })
    await pinInput(page).pressSequentially('0000')
    if (i < 4) await expect(page.getByText('PIN이 맞지 않아요. 다시 입력해 주세요.')).toBeVisible()
  }
  await expect(page.getByText('10분 뒤에 다시 시도해 주세요')).toBeVisible({ timeout: 4000 })
  await expect(pinInput(page)).toBeDisabled()
})

test('not configured message', async ({ page }) => {
  await mockTodoApi(page, { notConfigured: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('PIN이 아직 설정되지 않았어요')).toBeVisible()
  await expect(pinInput(page)).toBeDisabled()
})

test('reduced motion still unlocks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('1234')
  await expect(page.getByText('남은 일')).toBeVisible({ timeout: 4000 })
})

test('digits are masked after a moment and eye reveals them', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('12')
  await expect(page.locator('.pin .slot .m')).toHaveCount(2, { timeout: 2000 })
  await page.getByRole('button', { name: '숫자 보기' }).click()
  await expect(page.locator('.pin .slot').nth(1)).toContainText('2')
})
