import { expect, type Page, test } from '@playwright/test'
import { mockApi } from './fixtures/mock-api'
import { makeTodo, mockTodoApi } from './fixtures/mock-todo-api'

// 휴대폰 폭에서 본다. 날짜는 2026-10-23(금) KST 정오로 고정한다(「오늘·어제」·마감 계산).
test.use({ viewport: { width: 375, height: 812 } })

const NOW = '2026-10-23T03:00:00Z'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(NOW))
  await mockApi(page, 'normal')
})

/** 목업 TO-DO API — 시계를 페이지와 같은 시각에서 흐르게 한다(완료 시각 · 최근 7일 · 만든 날짜) */
const api = (page: Page, opts: Parameters<typeof mockTodoApi>[1] = {}) =>
  mockTodoApi(page, { now: NOW, ...opts })

async function noHorizontalScroll(page: Page) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(w).toBeLessThanOrEqual(375)
}

test('tab bar switches routes and the top views nav is hidden', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal')
  await expect(page.locator('.views')).toBeHidden()
  const bar = page.locator('.tabbar').getByRole('navigation', { name: '보기 전환' })
  await expect(bar.getByRole('link', { name: 'NEWS' })).toHaveAttribute('aria-current', 'page')
  const tab = await bar.getByRole('link', { name: 'NEWS' }).boundingBox()
  expect(tab?.height ?? 0).toBeGreaterThanOrEqual(48)
  await bar.getByRole('link', { name: 'TO-DO' }).click()
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
  await expect(page.getByText('본인 확인')).toBeVisible()
  await expect(bar.getByRole('link', { name: 'TO-DO' })).toHaveAttribute('aria-current', 'page')
})

test('todo page keeps news shell and theme', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('본인 확인')).toBeVisible()
  await expect(page.locator('.ms .aurora')).toHaveCount(1)
  await expect(page.locator('.ms .grid-bg')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-ms-theme', 'light')
  await expect(page.locator('.datenav')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '다시 잠그기' })).toHaveCount(0)
})

test('375 top row, date nav and tab bar fit without horizontal scroll', async ({ page }) => {
  await api(page, { unlocked: true })
  for (const path of ['/morning-signal', '/morning-signal/todo']) {
    await page.goto(path)
    await expect(page.locator('.tabbar')).toBeVisible()
    await noHorizontalScroll(page)
  }
  await page.goto('/morning-signal')
  // 날짜 데이터가 도착한 뒤에 잰다(도착 전 폭으로 거짓 실패하지 않게)
  await expect(page.locator('.datenav .cur .t')).toHaveText(/월/)
  const nav = await page.locator('.datenav').boundingBox()
  const top = await page.locator('header.top').boundingBox()
  expect((nav?.y ?? 0) + (nav?.height ?? 0)).toBeLessThanOrEqual(
    (top?.y ?? 0) + (top?.height ?? 0) + 1
  )
  expect(nav?.width).toBeGreaterThan(150)
})

test('content is not hidden behind the tab bar', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal')
  await expect(page.locator('.lines > li').first()).toBeVisible()
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

test('자물쇠를 누르면 PIN 화면', async ({ page }) => {
  const state = await api(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible()
  // 자물쇠는 「남은 일」 제목 줄 Add 옆(상단 막대 오른쪽 칸이 아니다)
  await expect(page.locator('.top-slot').getByRole('button')).toHaveCount(0)
  const lock = page.locator('[data-area="list"] .ph').getByRole('button', { name: '다시 잠그기' })
  await lock.click()
  await expect(page.getByText('본인 확인')).toBeVisible()
  expect(state.unlocked).toBe(false)
})

// ── PIN 화면(시안 D) ───────────────────────────────────────────────────

const pinInput = (page: Page) => page.getByLabel('PIN 4자리')

test('wrong PIN shows error then clears', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('0000')
  await expect(page.getByText('PIN이 맞지 않아요. 다시 입력해 주세요.')).toBeVisible()
  await expect(page.locator('.pin .slot.filled')).toHaveCount(0, { timeout: 2500 })
  await expect(page.locator('.pin .slot.active')).toHaveCount(1)
  await expect(page.locator('.pin .slot').first()).toHaveClass(/active/)
})

test('right PIN unlocks to list', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('본인 확인')).toBeVisible()
  await pinInput(page).pressSequentially('1234')
  await expect(page.getByText('확인됐어요')).toBeVisible()
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
  await expect(page.getByRole('button', { name: '다시 잠그기' })).toBeVisible()
})

test('backspace removes the last digit', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('12')
  await expect(page.locator('.pin .slot.filled')).toHaveCount(2)
  await pinInput(page).press('Backspace')
  await expect(page.locator('.pin .slot.filled')).toHaveCount(1)
  await pinInput(page).pressSequentially('234')
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
})

test('paste uses first four digits', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).fill('123456')
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
})

test('locked shows countdown', async ({ page }) => {
  await api(page, { locked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('잠시 뒤에 다시 시도해 주세요')).toBeVisible()
  await expect(page.getByText(/\d+:\d{2} 남음/)).toBeVisible()
  await expect(pinInput(page)).toBeDisabled()
})

test('fifth wrong PIN locks', async ({ page }) => {
  await api(page)
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
  await api(page, { notConfigured: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('PIN이 아직 설정되지 않았어요')).toBeVisible()
  await expect(pinInput(page)).toBeDisabled()
})

test('reduced motion still unlocks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await api(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('1234')
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 4000 })
})

test('digits are masked after a moment and eye reveals them', async ({ page }) => {
  await api(page)
  await page.goto('/morning-signal/todo')
  await pinInput(page).pressSequentially('12')
  await expect(page.locator('.pin .slot .m')).toHaveCount(2, { timeout: 2000 })
  await page.getByRole('button', { name: '숫자 보기' }).click()
  await expect(page.locator('.pin .slot').nth(1)).toContainText('2')
})

// ── 보드(B안) — 상태 · 중요 · 마감 임박 / 남은 일 · 완료 기록 ──────────────

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
      doneAt: '2026-10-23T02:00:00.000Z',
    }),
    makeTodo({
      title: '어린이집 서류 제출',
      status: 'done',
      createdDate: '2026-10-22',
      createdAt: '2026-10-22T02:00:00.000Z',
      doneAt: '2026-10-22T05:00:00.000Z',
    }),
  ]
}

const pendingRows = (page: Page) => page.locator('.todo-pending .trow')
const card = (page: Page, area: string) => page.locator(`.todo-board > [data-area="${area}"]`)

test('보드는 카드 다섯 개 — 상태 · 중요 · 마감 임박 · 남은 일 · 완료 기록', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.todo-board > .p h2')).toHaveText([
    '상태',
    '중요',
    '마감 임박',
    '남은 일',
    '완료 기록',
  ])
  // 상태: 진행 중 2 · 할 일 3 · 오늘 완료 1(어제 완료 「어린이집 서류 제출」은 세지 않는다), 눈금 칸 = 6
  const stat = card(page, 'stat')
  await expect(stat.locator('.ph .cnt')).toHaveText('5개 남음')
  await expect(stat.locator('.legend li')).toHaveText(['진행 중2', '할 일3', '오늘 완료1'])
  await expect(stat.locator('.ticks i')).toHaveCount(6)
})

test('중요 · 마감 임박 카드와 빈 상태', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  const imp = card(page, 'imp')
  await expect(imp.locator('.rows > li')).toHaveCount(2)
  await expect(imp.locator('.rows > li').first()).toContainText('주말 장보기')
  await expect(imp.locator('.rows > li').first().locator('.chip')).toHaveText('진행 중')
  await expect(imp.locator('.rows > li').nth(1)).toContainText('마감 11/7 (토) · 15일 남음')
  // 마감 임박 = 3일 안(지난 것 포함) — 10/25 「자동차」만. 10/27 은 4일 뒤
  const due = card(page, 'due')
  await expect(due.locator('.ph')).toContainText('3일 안')
  await expect(due.locator('.rows > li')).toHaveCount(1)
  await expect(due.locator('.rows > li')).toContainText('자동차 보험 갱신 비교')
  await expect(due.locator('.rows > li .chip')).toHaveText('2일 남음')
  await expect(due.locator('.rows .s')).toHaveText('마감 10/25 (일)')
  // 줄을 누르면 상세가 열린다
  await due.getByRole('button', { name: '자동차 보험 갱신 비교' }).click()
  await expect(page.getByRole('dialog', { name: '할 일 상세' })).toBeVisible()
})

test('중요·마감 임박·완료 기록이 비면 안내 문구', async ({ page }) => {
  await api(page, { unlocked: true, seed: [makeTodo({ title: '그냥 할 일' })] })
  await page.goto('/morning-signal/todo')
  await expect(card(page, 'imp')).toContainText('중요 표시한 일이 없어요')
  await expect(card(page, 'due')).toContainText('3일 안에 마감인 일이 없어요')
  await expect(card(page, 'done')).toContainText('최근 7일 완료한 일이 없어요')
})

test('남은 일은 접지 않고 진행 중 → 할 일, 줄마다 상태 칩', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await expect(pendingRows(page)).toHaveCount(5)
  await expect(page.getByRole('button', { name: /더 보기/ })).toHaveCount(0)
  await expect(pendingRows(page).first()).toContainText('자동차 보험 갱신 비교')
  await expect(pendingRows(page).locator('.chip')).toHaveText([
    '진행 중',
    '진행 중',
    '할 일',
    '할 일',
    '할 일',
  ])
  // 만든 날짜별 기록은 없어졌다
  await expect(page.locator('.todo-day')).toHaveCount(0)
})

test('Add를 누르면 만들기 시트가 열린다', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const add = card(page, 'list').locator('.ph #tAdd')
  await expect(add).toHaveText('Add')
  await expect(add).toHaveAttribute('aria-label', '새 할 일 추가')
  await add.click()
  await expect(page.getByRole('dialog', { name: '할 일 만들기' })).toBeVisible()
  await expect(page.locator('.todo-fab')).toHaveCount(0)
})

test('거르기 진행 중이면 진행 중만', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  const seg = card(page, 'list').getByRole('group', { name: '상태로 거르기' })
  await expect(seg.getByRole('button')).toHaveText(['전체', '할 일', '진행 중'])
  await expect(seg.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true')
  await seg.getByRole('button', { name: '진행 중' }).click()
  await expect(seg.getByRole('button', { name: '진행 중' })).toHaveAttribute('aria-pressed', 'true')
  // 중요(진행 중) 「주말 장보기」 + 「자동차」 — 할 일은 빠진다
  await expect(pendingRows(page)).toHaveCount(2)
  await expect(pendingRows(page).locator('.chip')).toHaveText(['진행 중', '진행 중'])
  await seg.getByRole('button', { name: '할 일' }).click()
  await expect(pendingRows(page)).toHaveCount(3)
  await expect(pendingRows(page).locator('.chip')).toHaveText(['할 일', '할 일', '할 일'])
  // 거르기는 배지·상태 수에 영향이 없다
  await expect(page.locator('.tabbar .tab-badge')).toHaveText('5')
})

test('거르기에 맞는 일이 없으면 안내', async ({ page }) => {
  await api(page, { unlocked: true, seed: [makeTodo({ title: '할 일 하나' })] })
  await page.goto('/morning-signal/todo')
  await card(page, 'list').getByRole('button', { name: '진행 중' }).click()
  await expect(card(page, 'list')).toContainText('이 상태의 할 일이 없어요')
})

test('완료 기록은 최근 7일만, 날짜 라벨', async ({ page }) => {
  await api(page, {
    unlocked: true,
    seed: [
      ...seedDay(),
      makeTodo({ title: '일주일 전', status: 'done', doneAt: '2026-10-16T05:00:00.000Z' }),
      makeTodo({ title: '너무 오래 전', status: 'done', doneAt: '2026-10-15T05:00:00.000Z' }),
    ],
  })
  await page.goto('/morning-signal/todo')
  const done = card(page, 'done')
  await expect(done.locator('h3')).toHaveText(['오늘', '어제', '10월 16일'])
  await expect(done.locator('ul.done').first()).toHaveText('민수 축의금 보내기')
  await expect(done).not.toContainText('너무 오래 전')
})

test('완료 기록에서 열어 할 일로 되돌리면 남은 일로 돌아온다', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await card(page, 'done').getByRole('button', { name: '민수 축의금 보내기' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('radio', { name: 'TODO' }).click()
  await page.keyboard.press('Escape')
  await expect(detail).toBeHidden()
  await expect(pendingRows(page).filter({ hasText: '민수 축의금 보내기' })).toHaveCount(1)
  await expect(card(page, 'done')).not.toContainText('민수 축의금 보내기')
  await expect(page.locator('.trow[data-spring]')).toHaveCount(0)
})

test('하단 탭 TO-DO 배지 = 남은 일 수', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.tabbar .tab-badge')).toHaveText('5')
})

test('휴대폰: Add가 남은 일 제목 오른쪽, seg는 그 아래', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const list = card(page, 'list')
  const h = await list.locator('.ph h2').boundingBox()
  const add = await list.locator('#tAdd').boundingBox()
  const seg = await list.locator('.seg').boundingBox()
  const box = await list.boundingBox()
  if (!h || !add || !seg || !box) throw new Error('상자를 못 찾음')
  // 같은 줄: Add 가 제목 오른쪽, 세로 가운데가 맞는다
  expect(add.x).toBeGreaterThan(h.x + h.width)
  expect(Math.abs(add.y + add.height / 2 - (h.y + h.height / 2))).toBeLessThanOrEqual(4)
  expect(add.height).toBeGreaterThanOrEqual(44)
  // 카드 오른쪽 안쪽 여백(16 + 테두리 1)에 붙는다 — 자물쇠는 Add 왼쪽
  expect(Math.round(box.x + box.width - (add.x + add.width))).toBeLessThanOrEqual(18)
  const lock = await list.getByRole('button', { name: '다시 잠그기' }).boundingBox()
  expect((lock?.x ?? 0) + (lock?.width ?? 0)).toBeLessThanOrEqual(add.x)
  // 자물쇠와 Add 는 세로 가운데가 맞는다
  expect(
    Math.abs((lock?.y ?? 0) + (lock?.height ?? 0) / 2 - (add.y + add.height / 2))
  ).toBeLessThanOrEqual(2)
  // seg 는 그 아래 한 줄
  expect(seg.y).toBeGreaterThanOrEqual(add.y + add.height)
  await noHorizontalScroll(page)
})

test('휴대폰 카드 순서 — 중요 → 남은 일 → 마감 임박 → 상태 → 완료 기록', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.todo-board > .p')).toHaveCount(5)
  const tops = await page.locator('.todo-board > .p').evaluateAll((els) =>
    els
      .map((el) => ({ a: el.getAttribute('data-area'), y: el.getBoundingClientRect().top }))
      .sort((x, y) => x.y - y.y)
      .map((x) => x.a)
  )
  expect(tops).toEqual(['imp', 'list', 'due', 'stat', 'done'])
})

test('1행 카드는 위·아래 끝이 같고 제목 시작점이 같다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  await expect(pendingRows(page).first()).toBeVisible()
  const boxes = await page.locator('.todo-board > .p').evaluateAll((els) =>
    els.slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect()
      const h = (el.querySelector('h2') as HTMLElement).getBoundingClientRect()
      return `${Math.round(r.top)}/${Math.round(r.bottom)}/${Math.round(h.top - r.top)}/${Math.round(h.left - r.left)}`
    })
  )
  expect(new Set(boxes).size).toBe(1)
  // 2행(남은 일 · 완료 기록)은 위끝·제목 위치가 같다
  const row2 = await page.locator('.todo-board > .p').evaluateAll((els) =>
    els.slice(3).map((el) => {
      const r = el.getBoundingClientRect()
      const h = (el.querySelector('h2') as HTMLElement).getBoundingClientRect()
      return `${Math.round(r.top)}/${Math.round(h.top - r.top)}`
    })
  )
  expect(new Set(row2).size).toBe(1)
})

test('1024: 중요 | 마감 임박 / 남은 일 / 상태 | 완료 기록, 같은 행 카드는 위·아래 끝이 같다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.todo-board > .p')).toHaveCount(5)
  await expect(pendingRows(page).first()).toBeVisible()
  const boxes = await page.locator('.todo-board > .p').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect()
      return {
        a: el.getAttribute('data-area') ?? '',
        t: Math.round(r.top),
        b: Math.round(r.bottom),
        l: Math.round(r.left),
      }
    })
  )
  const order = [...boxes].sort((x, y) => x.t - y.t || x.l - y.l).map((x) => x.a)
  expect(order).toEqual(['imp', 'due', 'list', 'stat', 'done'])
  const at = (a: string) => boxes.find((x) => x.a === a)
  for (const [x, y] of [
    ['imp', 'due'],
    ['stat', 'done'],
  ] as const) {
    expect(at(x)?.t).toBe(at(y)?.t)
    expect(at(x)?.b).toBe(at(y)?.b)
  }
})

test('시트가 열리면 상단 막대와 하단 탭 바를 덮는다', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await openCreate(page)
  // 휴대폰: 하단 탭 바의 NEWS 자리를 누르면 시트 배경이 받는다(이동하지 않는다)
  const tab = await page.locator('.tabbar').getByRole('link', { name: 'NEWS' }).boundingBox()
  if (!tab) throw new Error('탭 바 없음')
  const hit = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x, y)?.closest('.todo-sheet'),
    [tab.x + tab.width / 2, tab.y + tab.height / 2] as const
  )
  expect(hit).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '할 일 만들기' })).toBeHidden()
  // 데스크톱: 상단 막대 NEWS 링크 자리
  await page.setViewportSize({ width: 1440, height: 900 })
  await openCreate(page)
  const link = await page.locator('.views').getByRole('link', { name: 'NEWS' }).boundingBox()
  if (!link) throw new Error('상단 탭 없음')
  const x = link.x + link.width / 2
  const y = link.y + link.height / 2
  expect(
    await page.evaluate(([px, py]) => !!document.elementFromPoint(px, py)?.closest('.todo-sheet'), [
      x,
      y,
    ] as const)
  ).toBe(true)
  await page.mouse.click(x, y)
  await expect(page.getByRole('dialog', { name: '할 일 만들기' })).toBeHidden()
  await expect(page).toHaveURL(/\/morning-signal\/todo$/)
})

// ── 중요 표시(IMPORTANT) ──────────────────────────────────────────────

/** seedDay 에서 「주말 장보기」(진행 중)·「민수 결혼식 참석」(할 일)을 중요로 */
function seedImportant() {
  return seedDay().map((t) =>
    t.title === '주말 장보기' || t.title === '민수 결혼식 참석' ? { ...t, important: true } : t
  )
}

test('important group sits on top inside a star border', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  const imp = page.locator('.todo-pending .todo-imp')
  await expect(page.locator('.todo-pending .todo-sub').first()).toHaveText('IMPORTANT')
  await expect(imp.locator('canvas.star-border__light')).toHaveCount(1)
  // 별빛 캔버스는 상자 밖 48px까지 번진다 — 375 폭에서 가로 스크롤을 만들지 않는다
  await noHorizontalScroll(page)
  await expect(imp.locator('.trow')).toHaveCount(2)
  // 그 안은 진행 중 → 할 일, 상태는 줄 끝 칩으로 · 제목 옆 별
  await expect(imp.locator('.trow').first()).toContainText('주말 장보기')
  await expect(imp.locator('.trow').first().locator('.chip')).toHaveText('진행 중')
  await expect(imp.locator('.trow').nth(1).locator('.chip')).toHaveText('할 일')
  await expect(imp.locator('.trow .star')).toHaveCount(2)
  await expect(pendingRows(page)).toHaveCount(5)
  await expect(imp.locator('.trow-tt').first()).not.toHaveCSS('animation-name', 'none')
})

test('create with ★ 중요 sends important and lands in IMPORTANT', async ({ page }) => {
  const state = await api(page, { unlocked: true, seed: seedDay() })
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
  await expect(card(page, 'imp').locator('.rows > li')).toHaveCount(1)
})

test('edit turns important off and the group goes away', async ({ page }) => {
  const state = await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '민수 결혼식 참석' }).click()
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
  const state = await api(page, { unlocked: true, seed: seedImportant() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '겨울 이불 세탁 맡기기' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '수정' }).click()
  await detail.getByLabel('제목').fill('겨울 이불 세탁')
  await detail.getByRole('button', { name: '저장' }).click()
  await expect(detail.getByRole('heading', { name: '겨울 이불 세탁' })).toBeVisible()
  expect(state.lastUpdate).not.toHaveProperty('important')
})

test('status to DONE leaves pending and lands in today done history', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
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
  await expect(page.locator('.tabbar .tab-badge')).toHaveText('4')
  await expect(pendingRows(page).filter({ hasText: '자동차 보험 갱신 비교' })).toHaveCount(0, {
    timeout: 3000,
  })
  const done = card(page, 'done')
  await expect(done.locator('h3').first()).toHaveText('오늘')
  await expect(done.locator('ul.done').first()).toContainText('자동차 보험 갱신 비교')
})

test('status to IN PROGRESS moves the row into that group', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const row = pendingRows(page).filter({ hasText: '겨울 이불 세탁 맡기기' })
  await row.getByRole('button', { name: '상태 바꾸기' }).click()
  await page
    .getByRole('dialog', { name: '상태 바꾸기' })
    .getByRole('button', { name: /IN PROGRESS/ })
    .click()
  // 진행 중 안 정렬: 마감 있는 「자동차」 → 먼저 추가한(10-20) 「겨울 이불」 → 「주말 장보기」(10-23)
  await expect(pendingRows(page).nth(1)).toContainText('겨울 이불 세탁 맡기기')
  await expect(pendingRows(page).nth(1)).toHaveClass(/s-progress/)
  await expect(pendingRows(page).nth(1).locator('.chip')).toHaveText('진행 중')
})

test('due soon is red text only', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await expect(pendingRows(page).first().locator('.trow-due.soon')).toHaveText('마감 10/25 (일)')
  const later = pendingRows(page).filter({ hasText: '문화센터 겨울학기 예약' })
  await expect(later.locator('.trow-due')).toHaveText('마감 10/27 (화) 10:00')
  await expect(later.locator('.trow-due.soon')).toHaveCount(0)
})

test('expired session returns to PIN', async ({ page }) => {
  const state = await api(page, { unlocked: true, seed: seedDay() })
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
  await api(page, {
    unlocked: true,
    seed: [
      makeTodo({ title: '가'.repeat(120), important: true, dueDate: '2026-10-24' }),
      makeTodo({ title: 'x'.repeat(120), status: 'done', doneAt: '2026-10-23T01:00:00.000Z' }),
    ],
  })
  await page.goto('/morning-signal/todo')
  await expect(pendingRows(page)).toHaveCount(1)
  await expect(card(page, 'done').locator('ul.done li')).toHaveCount(1)
  await noHorizontalScroll(page)
})

test('empty state', async ({ page }) => {
  await api(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  await expect(page.getByText('아직 할 일이 없어요. Add로 첫 할 일을 만들어 보세요.')).toBeVisible()
  await expect(page.locator('.tabbar .tab-badge')).toHaveCount(0)
})

// ── 만들기·상세·수정·삭제·첨부 ─────────────────────────────────────────

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

async function openCreate(page: Page) {
  await page.getByRole('button', { name: '새 할 일 추가' }).click()
  const sheet = page.getByRole('dialog', { name: '할 일 만들기' })
  await expect(sheet).toBeVisible()
  return sheet
}

test('create with title only appears in pending', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await expect(sheet.getByRole('button', { name: '추가' })).toBeDisabled()
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('우유 사기')
  await sheet.getByRole('button', { name: '추가' }).click()
  await expect(sheet).toBeHidden()
  await expect(page.locator('.tabbar .tab-badge')).toHaveText('6')
  await expect(pendingRows(page).filter({ hasText: '우유 사기' })).toHaveCount(1)
})

test('create with date time link', async ({ page }) => {
  await api(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('문화센터 예약')
  await sheet.getByRole('button', { name: '📅 날짜' }).click()
  await sheet.getByLabel('날짜', { exact: true }).fill('2026-10-27')
  await sheet.getByLabel('시간', { exact: true }).fill('10:00')
  await sheet.getByRole('button', { name: '🔗 링크' }).click()
  await sheet.getByLabel('링크', { exact: true }).fill('culture.example.com')
  await sheet.getByRole('button', { name: '추가' }).click()
  const row = page.locator('.todo-pending .trow').filter({ hasText: '문화센터 예약' })
  await expect(row.locator('.trow-due')).toHaveText('마감 10/27 (화) 10:00')
  await row.locator('.trow-tx').click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await expect(detail.getByRole('link', { name: 'https://culture.example.com/' })).toBeVisible()
})

test('memo continues list on Enter, previews and renders markdown', async ({ page }) => {
  await api(page, { unlocked: true })
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
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '마크다운 메모' }).click()
  const note = page.getByRole('dialog', { name: '할 일 상세' }).locator('.todo-md')
  await expect(note.locator('li strong')).toHaveText('우유')
  await expect(note.locator('p').first()).toHaveText('메모 a 끝')
  await expect(note.locator('blockquote')).toHaveText('인용 b 뒤')
})

test('memo field is tall, wraps long URLs and grows with content', async ({ page }) => {
  await api(page, { unlocked: true })
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
  await api(page, { unlocked: true })
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
  const state = await api(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('영수증 정리')
  await sheet
    .locator('input[type=file]')
    .setInputFiles({ name: '영수증.png', mimeType: 'image/png', buffer: PNG })
  await expect(sheet.locator('.todo-file.done')).toHaveCount(1)
  expect(state.uploads).toBe(1)
  await sheet.getByRole('button', { name: '추가' }).click()
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '영수증 정리' }).click()
  await expect(
    page.getByRole('dialog', { name: '할 일 상세' }).locator('.todo-thumbs img')
  ).toHaveCount(1)
})

test('upload failure keeps sheet open', async ({ page }) => {
  const state = await api(page, { unlocked: true })
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
  const state = await api(page, { unlocked: true })
  await page.goto('/morning-signal/todo')
  const sheet = await openCreate(page)
  await sheet.getByPlaceholder('할 일을 입력하세요').fill('한 번만')
  await sheet.getByRole('button', { name: '추가' }).click({ clickCount: 2 })
  await expect(sheet).toBeHidden()
  await expect(pendingRows(page)).toHaveCount(1)
  expect(state.creates).toBe(1)
})

test('detail shows fields and changes status', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '문화센터 겨울학기 예약' }).click()
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
    page.locator('.todo-pending .trow').filter({ hasText: '문화센터 겨울학기 예약' })
  ).toHaveClass(/s-progress/)
})

test('edit title', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '민수 결혼식 참석' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '수정' }).click()
  await detail.getByLabel('제목').fill('민수 결혼식 참석 (축의금 챙기기)')
  await detail.getByRole('button', { name: '저장' }).click()
  await expect(
    detail.getByRole('heading', { name: '민수 결혼식 참석 (축의금 챙기기)' })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(
    page.locator('.todo-pending .trow').filter({ hasText: '축의금 챙기기' })
  ).toHaveCount(1)
})

test('delete asks inside sheet', async ({ page }) => {
  let dialogs = 0
  page.on('dialog', () => {
    dialogs += 1
  })
  await api(page, { unlocked: true, seed: seedDay() })
  await page.goto('/morning-signal/todo')
  await page.locator('.todo-pending .trow-tx').filter({ hasText: '겨울 이불 세탁 맡기기' }).click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '삭제' }).click()
  await expect(detail.getByText('이 할 일을 지울까요?')).toBeVisible()
  await detail.getByRole('button', { name: '지우기' }).click()
  await expect(detail).toBeHidden()
  await expect(page.locator('.trow').filter({ hasText: '겨울 이불 세탁 맡기기' })).toHaveCount(0)
  expect(dialogs).toBe(0)
})

// ── 최종 리뷰 수정 ─────────────────────────────────────────────────────

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
  await api(page)
  await page.goto('/morning-signal/todo')
  await page.getByLabel('PIN 4자리').pressSequentially('0000')
  await expect(page.getByText('PIN이 맞지 않아요. 다시 입력해 주세요.')).toBeVisible()
  await expect(page.locator('.pin .slot.filled')).toHaveCount(0, { timeout: 2500 })
  expect(await page.evaluate(() => (window as unknown as { __animate: number }).__animate)).toBe(0)
})

test('sheet inputs are at least 16px so iOS Safari does not zoom', async ({ page }) => {
  await api(page, { unlocked: true, seed: seedDay() })
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
  await page.locator('.todo-pending .trow-tx').first().click()
  const detail = page.getByRole('dialog', { name: '할 일 상세' })
  await detail.getByRole('button', { name: '수정' }).click()
  const editSizes = await detail
    .locator('input:not([type=file]), textarea')
    .evaluateAll((els) => els.map((e) => Number.parseFloat(getComputedStyle(e).fontSize)))
  for (const s of editSizes) expect(s).toBeGreaterThanOrEqual(16)
})

test('todo list loader uses the lattice', async ({ page }) => {
  await api(page, { unlocked: true })
  // 목록 응답만 늦춘다(뒤에 건 라우트가 먼저 돈다 — 기다렸다가 원래 목업으로 넘긴다)
  await page.route('**/api/morning-signal-todo?**', async (route) => {
    if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, 1500))
    await route.fallback()
  })
  await page.goto('/morning-signal/todo')
  await expect(page.locator('.todo-loader .lattice-loader__cell').first()).toBeVisible()
  await expect(page.getByText('남은 일', { exact: true })).toBeVisible({ timeout: 6000 })
})
