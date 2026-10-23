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
