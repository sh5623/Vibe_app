import { expect, type Page, test } from '@playwright/test'
import { mockApi } from './fixtures/mock-api'
import { makeTodo, makeTodos, mockTodoApi } from './fixtures/mock-todo-api'

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

test('tab bar switches routes and the rail is hidden', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal')
  await expect(page.locator('.rail')).toBeHidden()
  const bar = page.locator('.tabbar').getByRole('navigation', { name: '보기 전환' })
  await expect(bar.getByRole('link', { name: 'News' })).toHaveAttribute('aria-current', 'page')
  const tab = await bar.getByRole('link', { name: 'News' }).boundingBox()
  expect(tab?.height ?? 0).toBeGreaterThanOrEqual(48)
  await bar.getByRole('link', { name: 'TO-DO' }).click()
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  await expect(page.getByText('본인 확인')).toBeVisible()
  await expect(bar.getByRole('link', { name: 'TO-DO' })).toHaveAttribute('aria-current', 'page')
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
  await expect(page.getByRole('heading', { name: 'TO-DO' })).toBeVisible()
})

test('375 top row, date nav and tab bar fit without horizontal scroll', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  for (const path of ['/morning-signal', '/morning-signal/todo']) {
    await page.goto(path)
    await expect(page.locator('.tabbar')).toBeVisible()
    await expect(page.locator('.ptitle .theme')).toBeVisible()
    await noHorizontalScroll(page)
  }
  await page.goto('/morning-signal')
  const nav = await page.locator('.datenav').boundingBox()
  const h1 = await page.locator('.ptitle h1').boundingBox()
  expect((nav?.y ?? 0) > (h1?.y ?? 0) + (h1?.height ?? 0) - 1).toBe(true)
  expect(nav?.width).toBeGreaterThan(300)
})

test('content is not hidden behind the tab bar', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal')
  await expect(page.locator('.list .item').first()).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  // 스크롤이 끝날 때까지 상태로 기다린다 — 마지막 칸 아래 끝이 탭 바 위에 와야 한다
  await expect
    .poll(async () => {
      const last = await page.locator('.ms .wrap > :last-child').boundingBox()
      const bar = await page.locator('.tabbar').boundingBox()
      return (last?.y ?? 0) + (last?.height ?? 0) - ((bar?.y ?? 0) + 1)
    })
    .toBeLessThanOrEqual(0)
})

test('unlocked session shows lock button that relocks', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible()
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
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
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
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
})

test('paste uses first four digits', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).fill('123456')
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
})

test('locked shows countdown', async ({ page }) => {
  await mockTodoApi(page, { locked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('잠시 뒤에 다시 시도해 주세요')).toBeVisible()
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
  await expect(page.getByText('잠시 뒤에 다시 시도해 주세요')).toBeVisible({ timeout: 4000 })
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
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
})

test('digits are masked after a moment and eye reveals them', async ({ page }) => {
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('12')
  await expect(page.locator('.pin .slot .m')).toHaveCount(2, { timeout: 2000 })
  await page.getByRole('button', { name: '숫자 보기' }).click()
  await expect(page.locator('.pin .slot').nth(1)).toContainText('2')
})

// ── 목록 ─────────────────────────────────────────────────────────────

function seedDay() {
  return [
    makeTodo({
      title: '자동차 보험 갱신 비교',
      status: 'in_progress',
      createdDate: '2026-10-20',
      createdAt: '2026-10-20T01:00:00.000Z',
      dueDate: '2026-10-25',
      body: '두 군데 견적',
    }),
    makeTodo({
      title: '주말 장보기',
      status: 'in_progress',
      createdDate: '2026-10-23',
      createdAt: '2026-10-23T01:10:00.000Z',
    }),
    makeTodo({
      title: '문화센터 겨울학기 예약',
      createdDate: '2026-10-23',
      createdAt: '2026-10-23T01:20:00.000Z',
      dueDate: '2026-10-27',
      dueTime: '10:00',
      link: 'https://culture.example.com/',
    }),
    makeTodo({
      title: '민수 결혼식 참석',
      createdDate: '2026-10-22',
      createdAt: '2026-10-22T01:00:00.000Z',
      dueDate: '2026-11-07',
    }),
    makeTodo({
      title: '겨울 이불 세탁 맡기기',
      createdDate: '2026-10-20',
      createdAt: '2026-10-20T02:00:00.000Z',
    }),
    makeTodo({
      title: '민수 축의금 보내기',
      status: 'done',
      createdDate: '2026-10-23',
      createdAt: '2026-10-23T01:30:00.000Z',
    }),
    makeTodo({
      title: '어린이집 서류 제출',
      status: 'done',
      createdDate: '2026-10-22',
      createdAt: '2026-10-22T02:00:00.000Z',
    }),
  ]
}

const pendingRows = (page: Page) => page.locator('.todo-pending .trow')
const dayRows = (page: Page) => page.locator('.todo-day .trow')

test('pending shows progress first and collapses after 3', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const pending = page.locator('.todo-pending')
  await expect(page.locator('.todo-pending-h')).toContainText('남은 일')
  await expect(page.locator('.todo-pending-h')).toContainText('5')
  await expect(pending.getByText('IN PROGRESS', { exact: true })).toBeVisible()
  await expect(pending.getByText('TODO', { exact: true })).toBeVisible()
  await expect(pendingRows(page)).toHaveCount(3)
  await expect(pendingRows(page).first()).toContainText('자동차 보험 갱신 비교')
  await page.getByRole('button', { name: '2개 더 보기' }).click()
  await expect(pendingRows(page)).toHaveCount(5)
  await page.getByRole('button', { name: '접기' }).click()
  await expect(pendingRows(page)).toHaveCount(3)
})

// ── 중요 표시(IMPORTANT) ──────────────────────────────────────────────

/** seedDay 에서 「주말 장보기」(진행 중)·「민수 결혼식 참석」(할 일)을 중요로 */
function seedImportant() {
  return seedDay().map((t) =>
    t.title === '주말 장보기' || t.title === '민수 결혼식 참석' ? { ...t, important: true } : t
  )
}

test('important group sits on top inside a star border and is never collapsed', async ({
  page,
}) => {
  await mockTodoApi(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  const imp = page.locator('.todo-pending .todo-imp')
  await expect(page.locator('.todo-pending .todo-sub').first()).toHaveText('IMPORTANT')
  await expect(imp.locator('canvas.star-border__light')).toHaveCount(1)
  // 별빛 캔버스는 상자 밖 48px까지 번진다 — 375 폭에서 가로 스크롤을 만들지 않는다
  await noHorizontalScroll(page)
  await expect(imp.locator('.trow')).toHaveCount(2)
  // 그 안은 진행 중 → 할 일, 상태는 줄 끝 영문 표기로
  await expect(imp.locator('.trow').first()).toContainText('주말 장보기')
  await expect(imp.locator('.trow').first().locator('.trow-st')).toHaveText('IN PROGRESS')
  await expect(imp.locator('.trow').nth(1).locator('.trow-st')).toHaveText('TODO')
  // 3줄 제한은 나머지 묶음에만 — 나머지 3줄이라 「더 보기」가 없다
  await expect(pendingRows(page)).toHaveCount(5)
  await expect(page.getByRole('button', { name: /더 보기/ })).toHaveCount(0)
  // 날짜별 기록에서는 움직이지 않는 강조만
  const dayRow = page.locator('.todo-day .trow').filter({ hasText: '민수 결혼식 참석' })
  await expect(dayRow).toHaveClass(/\bimp\b/)
  await expect(dayRow.locator('.trow-tt')).toHaveCSS('animation-name', 'none')
  await expect(imp.locator('.trow-tt').first()).not.toHaveCSS('animation-name', 'none')
})

test('create with ★ 중요 sends important and lands in IMPORTANT', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  let sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('우유 사기')
  await sheet.getByRole('button', { name: '추가' }).click()
  await expect(sheet).toBeHidden()
  expect(state.lastCreate).not.toHaveProperty('important')
  sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('보고서 제출')
  const toggle = sheet.getByRole('button', { name: '★ 중요' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await sheet.getByRole('button', { name: '추가' }).click()
  await expect(sheet).toBeHidden()
  expect(state.lastCreate).toMatchObject({ important: true })
  await expect(page.locator('.todo-imp .trow')).toHaveCount(1)
  await expect(page.locator('.todo-imp .trow')).toContainText('보고서 제출')
})

test('edit turns important off and the group goes away', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-day .trow-tx').filter({ hasText: '민수 결혼식 참석' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await expect(detail.getByText('IMPORTANT', { exact: true })).toBeVisible()
  await detail.getByRole('button', { name: '수정' }).click()
  await detail.getByLabel('제목').fill('민수 결혼식 참석!')
  const toggle = detail.getByRole('button', { name: '★ 중요' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await toggle.click()
  await detail.getByRole('button', { name: '저장' }).click()
  await expect(detail.getByRole('heading', { name: '민수 결혼식 참석!' })).toBeVisible()
  expect(state.lastUpdate).toMatchObject({ important: false })
  await page.keyboard.press('Escape')
  await expect(page.locator('.todo-imp .trow')).toHaveCount(1)
  await expect(page.locator('.todo-imp')).not.toContainText('민수 결혼식 참석')
})

test('edit without touching ★ 중요 does not send it', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-day .trow-tx').filter({ hasText: '겨울 이불 세탁 맡기기' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '수정' }).click()
  await detail.getByLabel('제목').fill('겨울 이불 세탁')
  await detail.getByRole('button', { name: '저장' }).click()
  await expect(detail.getByRole('heading', { name: '겨울 이불 세탁' })).toBeVisible()
  expect(state.lastUpdate).not.toHaveProperty('important')
})

test('day groups by created date with counts', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const days = page.locator('.todo-day')
  await expect(days).toHaveCount(3)
  await expect(days.nth(0).locator('.dh')).toContainText('오늘')
  await expect(days.nth(0).locator('.dh')).toContainText('10월 23일 금요일')
  await expect(days.nth(0).locator('.dh')).toContainText('1/3')
  await expect(days.nth(1).locator('.dh')).toContainText('어제')
  await expect(days.nth(2).locator('.dh')).toContainText('10월 20일')
  await expect(days.nth(2).locator('.dh')).toContainText('화요일')
  await expect(days.nth(0).locator('.trow').first()).toContainText('민수 축의금 보내기')
  await expect(days.nth(0).locator('.trow.s-done .trow-st')).toHaveText('DONE')
})

test('status to DONE leaves pending and strikes in day list', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await pendingRows(page).first().getByRole('button', { name: '상태 바꾸기' }).click()
  const sheet = page.getByRole('dialog', { name: '상태 바꾸기' })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('button', { name: /IN PROGRESS/ })).toContainText('현재')
  await sheet.getByRole('button', { name: /^DONE/ }).click()
  // DONE이 되는 순간 스프링 모션(react-bits SpringCheck) — 줄에 data-spring 이 붙고 원이 스프링 값으로 채워진다
  await expect(
    pendingRows(page)
      .filter({ hasText: '자동차 보험 갱신 비교' })
      .and(page.locator('[data-spring]'))
  ).toHaveCount(1, { timeout: 300 })
  await expect(page.locator('.todo-pending-h')).toContainText('4')
  await expect(pendingRows(page).filter({ hasText: '자동차 보험 갱신 비교' })).toHaveCount(0, {
    timeout: 3000,
  })
  await expect(dayRows(page).filter({ hasText: '자동차 보험 갱신 비교' })).toHaveClass(/s-done/)
})

test('undo from DONE does not spring', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const row = dayRows(page).filter({ hasText: '민수 축의금 보내기' })
  await expect(row).toHaveClass(/s-done/)
  await row.getByRole('button', { name: '상태 바꾸기' }).click()
  await page
    .getByRole('dialog', { name: '상태 바꾸기' })
    .getByRole('button', { name: /^TODO/ })
    .click()
  await page.waitForTimeout(150) // 고정 대기: 부재 확인 — 스프링이 붙지 않는다
  await expect(page.locator('.trow[data-spring]')).toHaveCount(0)
})

test('status to IN PROGRESS moves the row into that group', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.getByRole('button', { name: '2개 더 보기' }).click()
  const row = pendingRows(page).filter({ hasText: '겨울 이불 세탁 맡기기' })
  await row.getByRole('button', { name: '상태 바꾸기' }).click()
  await page
    .getByRole('dialog', { name: '상태 바꾸기' })
    .getByRole('button', { name: /IN PROGRESS/ })
    .click()
  // IN PROGRESS 묶음 안 정렬: 마감 있는 「자동차」 → 먼저 추가한(10-20) 「겨울 이불」 → 「주말 장보기」(10-23)
  await expect(pendingRows(page).nth(1)).toContainText('겨울 이불 세탁 맡기기')
  await expect(pendingRows(page).nth(1)).toHaveClass(/s-progress/)
  await expect(
    dayRows(page).filter({ hasText: '겨울 이불 세탁 맡기기' }).locator('.trow-st')
  ).toHaveText('IN PROGRESS')
})

test('infinite scroll loads next 20', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: makeTodos(25) })
  await page.goto('/morning-signal/todo')
  await expect(dayRows(page)).toHaveCount(20)
  await page.locator('.todo-tail').scrollIntoViewIfNeeded()
  await expect(dayRows(page)).toHaveCount(25)
  await expect(page.getByText('처음 기록까지 다 봤어요')).toBeVisible()
  await expect(page.locator('.todo-day .dh').first()).toContainText('25/25')
})

test('due soon is red text only', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await expect(pendingRows(page).first().locator('.trow-due.soon')).toHaveText('10/25 (일)')
  const later = dayRows(page).filter({ hasText: '문화센터 겨울학기 예약' })
  await expect(later.locator('.trow-due')).toHaveText('10/27 (화) 10:00')
  await expect(later.locator('.trow-due.soon')).toHaveCount(0)
})

test('expired session returns to PIN', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  state.failNext = { op: 'update', status: 401, error: 'LOCKED_SESSION' }
  await pendingRows(page).first().getByRole('button', { name: '상태 바꾸기' }).click()
  await page
    .getByRole('dialog', { name: '상태 바꾸기' })
    .getByRole('button', { name: /^DONE/ })
    .click()
  await expect(page.getByText('본인 확인')).toBeVisible()
})

test('long title wraps without horizontal scroll', async ({ page }) => {
  await mockTodoApi(page, {
    unlocked: true,
    seed: [
      makeTodo({ title: '가'.repeat(120) }),
      makeTodo({ title: 'x'.repeat(120), status: 'done' }),
    ],
  })
  await page.goto('/morning-signal/todo')
  await expect(dayRows(page)).toHaveCount(2)
  await noHorizontalScroll(page)
})

test('empty state', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('아직 할 일이 없어요. ＋로 첫 할 일을 만들어 보세요.')).toBeVisible()
  await expect(page.locator('.todo-day')).toHaveCount(0)
})

// ── 만들기·상세·수정·삭제·첨부 ─────────────────────────────────────────

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

async function openCreate(page: Page) {
  await page.getByRole('button', { name: '할 일 만들기' }).click()
  const sheet = page.getByRole('dialog', { name: '할 일 만들기' })
  await expect(sheet).toBeVisible()
  return sheet
}

test('create with title only appears in pending and today', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await expect(sheet.getByRole('button', { name: '추가' })).toBeDisabled()
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('우유 사기')
  await sheet.getByRole('button', { name: '추가' }).click()
  await expect(sheet).toBeHidden()
  await expect(page.locator('.todo-pending-h')).toContainText('6')
  await expect(page.locator('.todo-day').first().locator('.trow').first()).toContainText(
    '우유 사기'
  )
})

test('create with date time link', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('문화센터 예약')
  await sheet.getByRole('button', { name: '📅 날짜' }).click()
  await sheet.getByLabel('날짜', { exact: true }).fill('2026-10-27')
  await sheet.getByLabel('시간', { exact: true }).fill('10:00')
  await sheet.getByRole('button', { name: '🔗 링크' }).click()
  await sheet.getByLabel('링크', { exact: true }).fill('culture.example.com')
  await sheet.getByRole('button', { name: '추가' }).click()
  const row = page.locator('.todo-day .trow').filter({ hasText: '문화센터 예약' })
  await expect(row.locator('.trow-due')).toHaveText('10/27 (화) 10:00')
  await row.locator('.trow-tx').click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await expect(detail.getByRole('link', { name: 'https://culture.example.com/' })).toBeVisible()
})

test('memo continues list on Enter, previews and renders markdown', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('마크다운 메모')
  const memo = sheet.getByLabel('메모')
  await expect(memo).toHaveAttribute('placeholder', '메모 (선택 · 마크다운 지원)')
  await expect(sheet.locator('.todo-md-preview')).toHaveCount(0)
  await memo.click()
  await page.keyboard.type('- **우유**')
  await page.keyboard.press('Enter')
  await page.keyboard.type('빵')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter') // 빈 글머리 줄에서 Enter — 목록을 끝낸다
  await page.keyboard.type('메모 `a` 끝\n> 인용 **b** 뒤')
  await expect(memo).toHaveValue('- **우유**\n- 빵\n메모 `a` 끝\n> 인용 **b** 뒤')
  await expect(sheet.locator('.todo-md-preview li')).toHaveCount(2)
  await sheet.getByRole('button', { name: '추가' }).click()
  await page.locator('.todo-day .trow-tx').filter({ hasText: '마크다운 메모' }).click()
  const note = page.getByRole('dialog', { name: '할 일 상세' }).locator('.todo-md')
  await expect(note.locator('li strong')).toHaveText('우유')
  await expect(note.locator('p').first()).toHaveText('메모 a 끝')
  await expect(note.locator('blockquote')).toHaveText('인용 b 뒤')
})

test('memo field is tall, wraps long URLs and grows with content', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  const memo = sheet.getByLabel('메모')
  const box = () =>
    memo.evaluate((el) => ({
      h: el.getBoundingClientRect().height,
      sw: el.scrollWidth,
      cw: el.clientWidth,
      wrap: getComputedStyle(el).overflowWrap,
    }))
  const empty = await box()
  expect(empty.h).toBeGreaterThanOrEqual(140) // 빈 칸도 6줄
  expect(empty.wrap).toBe('anywhere')
  await memo.fill(
    '[BFM-2137](https://serveone-wan8818.slack.com/archives/C0BS72UPPKK/p1793597787432000?thread_ts=1793597787.432000&cid=C0BS72UPPKK)'
  )
  const url = await box()
  expect(url.sw).toBeLessThanOrEqual(url.cw + 1) // 긴 URL 도 줄을 바꿔 가로 스크롤이 없다
  await memo.fill(Array.from({ length: 12 }, (_, i) => `- 줄 ${i}`).join('\n'))
  expect((await box()).h).toBeGreaterThan(250) // 내용만큼 늘어난다
})

test('memo list Enter waits for the line-break input (iOS Korean IME)', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  const memo = sheet.getByLabel('메모')
  await memo.fill('- 리스트')
  // iOS 한글 키보드는 조합 중인 글자를 안은 채 Enter keydown(keyCode 13 · isComposing false)을 보낸다.
  // keydown 에서 막고 값을 바꾸면 그 조합 글자가 새 줄로 따라온다 — keydown 은 건드리지 않아야 한다
  const r = await memo.evaluate((el: HTMLTextAreaElement) => {
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    const ev = new KeyboardEvent('keydown', {
      key: 'Enter',
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    })
    el.dispatchEvent(ev)
    return { prevented: ev.defaultPrevented, value: el.value }
  })
  expect(r).toEqual({ prevented: false, value: '- 리스트' })
  // 실제 Enter(줄바꿈 입력)는 글머리를 잇고 Shift+Enter 는 그냥 줄을 바꾼다
  await page.keyboard.press('Enter')
  await page.keyboard.type('둘')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('셋')
  await expect(memo).toHaveValue('- 리스트\n- 둘\n셋')
  // 글머리는 브라우저 편집 기록을 거쳐 들어간다 — 되돌리기 한 번에 글머리만 사라진다
  await memo.fill('- 가')
  await memo.press('End')
  await page.keyboard.press('Enter')
  await expect(memo).toHaveValue('- 가\n- ')
  await page.keyboard.press('ControlOrMeta+z')
  await expect(memo).toHaveValue('- 가')
})

test('create with attachment uploads via signed URL', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('영수증 정리')
  await sheet
    .locator('input[type=file]')
    .setInputFiles({ name: '영수증.png', mimeType: 'image/png', buffer: PNG })
  await expect(sheet.locator('.todo-file.done')).toHaveCount(1)
  expect(state.uploads).toBe(1)
  await sheet.getByRole('button', { name: '추가' }).click()
  await page.locator('.todo-day .trow-tx').filter({ hasText: '영수증 정리' }).click()
  await expect(
    page.getByRole('dialog', { name: '할 일 상세' }).locator('.todo-thumbs img')
  ).toHaveCount(1)
})

test('upload failure keeps sheet open', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true })
  state.uploadFail = true
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('영수증 정리')
  await sheet
    .locator('input[type=file]')
    .setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('저장하지 못했어요. 다시 시도해 주세요.')).toBeVisible()
  await expect(sheet).toBeVisible()
  await expect(sheet.getByPlaceholder('할 일을 입력하세요')).toHaveValue('영수증 정리')
  await expect(sheet.locator('.todo-file')).toHaveCount(0)
  expect(state.creates).toBe(0)
})

test('double tap creates one todo', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('한 번만')
  await sheet.getByRole('button', { name: '추가' }).click({ clickCount: 2 })
  await expect(sheet).toBeHidden()
  await expect(page.locator('.todo-day .trow')).toHaveCount(1)
  expect(state.creates).toBe(1)
})

test('detail shows fields and changes status', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-day .trow-tx').filter({ hasText: '문화센터 겨울학기 예약' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await expect(detail.getByRole('heading', { name: '문화센터 겨울학기 예약' })).toBeVisible()
  for (const k of ['날짜', '링크', '추가'])
    await expect(detail.getByText(k, { exact: true })).toBeVisible()
  await expect(detail.getByText('10/27 (화) 10:00')).toBeVisible()
  await detail.getByRole('radio', { name: 'IN PROGRESS' }).click()
  await expect(detail.getByRole('radio', { name: 'IN PROGRESS' })).toBeChecked()
  await page.keyboard.press('Escape')
  await expect(detail).toBeHidden()
  await expect(
    page.locator('.todo-day .trow').filter({ hasText: '문화센터 겨울학기 예약' })
  ).toHaveClass(/s-progress/)
})

test('edit title', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-day .trow-tx').filter({ hasText: '민수 결혼식 참석' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '수정' }).click()
  await detail.getByLabel('제목').fill('민수 결혼식 참석 (축의금 챙기기)')
  await detail.getByRole('button', { name: '저장' }).click()
  await expect(
    detail.getByRole('heading', { name: '민수 결혼식 참석 (축의금 챙기기)' })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.todo-day .trow').filter({ hasText: '축의금 챙기기' })).toHaveCount(1)
})

test('delete asks inside sheet', async ({ page }) => {
  let dialogs = 0
  page.on('dialog', () => {
    dialogs += 1
  })
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-day .trow-tx').filter({ hasText: '겨울 이불 세탁 맡기기' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '삭제' }).click()
  await expect(detail.getByText('이 할 일을 지울까요?')).toBeVisible()
  await detail.getByRole('button', { name: '지우기' }).click()
  await expect(detail).toBeHidden()
  await expect(page.locator('.trow').filter({ hasText: '겨울 이불 세탁 맡기기' })).toHaveCount(0)
  expect(dialogs).toBe(0)
})

// ── 최종 리뷰 수정 ─────────────────────────────────────────────────────

test('next page failure stops and offers retry', async ({ page }) => {
  const state = await mockTodoApi(page, { unlocked: true, seed: makeTodos(25) })
  let cursorCalls = 0
  page.on('request', (r) => {
    if (r.url().includes('op=list') && r.url().includes('cursor=')) cursorCalls += 1
  })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.todo-day .trow')).toHaveCount(20)
  state.failNext = { op: 'list', status: 503, error: 'SUPABASE_UNAVAILABLE' }
  await page.locator('.todo-tail').scrollIntoViewIfNeeded()
  const retry = page.getByRole('button', { name: '다시 불러오기' })
  await expect(retry).toBeVisible()
  await page.waitForTimeout(1500) // 고정 대기: 부재 확인 — 다음 쪽 요청이 더 나가지 않는다
  expect(cursorCalls).toBe(1)
  await retry.click()
  await expect(page.locator('.todo-day .trow')).toHaveCount(25)
  expect(cursorCalls).toBe(2)
})

test('reduced motion skips scripted motion on wrong PIN', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const w = window as unknown as { __animate: number }
    w.__animate = 0
    const orig = Element.prototype.animate
    Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
      w.__animate += 1
      return orig.apply(this, args)
    }
  })
  await mockTodoApi(page)
  await page.goto('/morning-signal/todo')
  await page.getByLabel('PIN 4자리').pressSequentially('0000')
  await expect(page.getByText('PIN이 맞지 않아요. 다시 입력해 주세요.')).toBeVisible()
  await expect(page.locator('.pin .slot.filled')).toHaveCount(0, { timeout: 2500 })
  expect(await page.evaluate(() => (window as unknown as { __animate: number }).__animate)).toBe(0)
})

test('sheet inputs are at least 16px so iOS Safari does not zoom', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByRole('button', { name: '📅 날짜' }).click()
  await sheet.getByRole('button', { name: '🔗 링크' }).click()
  const sizes = await sheet
    .locator('input:not([type=file]), textarea')
    .evaluateAll((els) => els.map((e) => Number.parseFloat(getComputedStyle(e).fontSize)))
  expect(sizes.length).toBeGreaterThanOrEqual(5)
  for (const s of sizes) expect(s).toBeGreaterThanOrEqual(16)
  await page.keyboard.press('Escape')
  await page.locator('.todo-day .trow-tx').first().click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '수정' }).click()
  const editSizes = await detail
    .locator('input:not([type=file]), textarea')
    .evaluateAll((els) => els.map((e) => Number.parseFloat(getComputedStyle(e).fontSize)))
  for (const s of editSizes) expect(s).toBeGreaterThanOrEqual(16)
})

test('todo list loader uses the lattice', async ({ page }) => {
  await mockTodoApi(page, { unlocked: true })
  // 목록 응답만 늦춘다(뒤에 건 라우트가 먼저 돈다 — 기다렸다가 원래 목업으로 넘긴다)
  await page.route('**/api/morning-signal-todo?**', async (route) => {
    if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, 1500))
    await route.fallback()
  })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.todo-loader .lattice-loader__cell').first()).toBeVisible()
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 6000 })
})
