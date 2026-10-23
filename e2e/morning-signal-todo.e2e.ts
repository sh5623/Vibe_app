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
  await expect(page.locator('.todo-pending-h')).toContainText('4')
  await expect(pendingRows(page).filter({ hasText: '자동차 보험 갱신 비교' })).toHaveCount(0, {
    timeout: 3000,
  })
  await expect(dayRows(page).filter({ hasText: '자동차 보험 갱신 비교' })).toHaveClass(/s-done/)
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
  await page.waitForTimeout(1500)
  expect(cursorCalls).toBe(1)
  await retry.click()
  await expect(page.locator('.todo-day .trow')).toHaveCount(25)
  expect(cursorCalls).toBe(2)
})
