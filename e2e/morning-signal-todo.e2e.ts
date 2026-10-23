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
