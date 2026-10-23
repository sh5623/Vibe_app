# Morning Signal 웹 버전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vibe_app에 공개 보기 전용 `/morning-signal` 페이지를 만든다. 데이터는 Supabase에 두고 `api/morning-signal.ts`로 읽고 쓴다. 다른 Claude 계정에서 등록할 루틴 문서 4개를 함께 둔다.

**Architecture**
- 루틴이 Vercel 함수 `api/morning-signal.ts`로 POST한다.
- 서버는 Zod로 검증·변환한 뒤 집계를 계산해 Supabase REST에 upsert한다.
- 페이지는 TanStack Query로 목록·날짜 상세를 GET한다.
- 화면은 레퍼런스 HTML의 CSS를 라우트 전용 CSS로 옮기고, React 컴포넌트와 순수 view-model 함수로 다시 짠다.

**Tech Stack:** React Router 7.18 SPA, React 19, TypeScript 6 strict, Zod 4, TanStack Query 5, Vitest 4, Playwright 1.61, Supabase REST(fetch), Vercel Functions.

**Spec:** `docs/superpowers/specs/2026-10-23-morning-signal-design.md` (먼저 읽는다)

**레퍼런스 (읽기 전용, 수정 금지)**
- `/Users/seungho/Documents/second-brain/.wiki-automation/dashboard/morning-signal.html`
  - CSS: 6–276행
  - 마크업: 278–361행
  - JS: 363–774행
- `…/dashboard/fixtures/{normal,missing,noai,single}.json`
- `…/routines/{news-ai,news-world,news-gh,notify}.md`

## Global Constraints

- pnpm만 쓴다. **신규 의존성 0개**(supabase-js 금지, REST `fetch`). 스펙이 「신규 파일 ≤ 3개」 예산을 오버라이드했다.
- **RR7 SPA**: 서버 `loader`·`action` 금지. 라우트 모듈은 `meta`와 default component만 export한다. `react-router-dom` import 금지. 해시 변경은 `useNavigate`로 한다.
- **TS strict**: `noUncheckedIndexedAccess`, `any` 금지, `!` 금지, `React.FC`·`forwardRef` 금지.
- **Zod 4** 최상위 함수를 쓴다. **TanStack v5**: `isPending`을 쓴다. `useQuery`에 `onSuccess` 금지. 이전 데이터 유지는 `placeholderData: keepPreviousData`로 한다.
- **Tailwind 금지 문자열**(`pnpm check:tw`가 `app/`의 `.css`까지 검사): `bg-gradient-to-`, `flex-shrink-0`, `flex-grow-0`, `@tailwind`.
- **API 파일은 자기완결적으로 만든다.** 코어 로직과 핸들러를 `api/morning-signal.ts` 한 파일에 둔다. 상대 import와 `@/` 별칭은 쓰지 않는다.
  - 이유 1: 기존 `ahram`·`otp`·`stock`이 모두 단일 파일이다.
  - 이유 2: 패키지가 `"type": "module"`이라 Vercel ESM 런타임에서 확장자 없는 상대 import가 깨질 위험이 있다.
  - 클라이언트는 이 파일의 **타입만** `import type`으로 가져온다(빌드 때 지워진다).
  - 테스트는 `api/morning-signal.test.ts` 한 파일에 둔다(`ahram.test.ts` 관례).
- **환경변수 이름**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MS_INGEST_TOKEN`.
- **고정 값**: 프로덕션 주소 `https://vibe-app-omega.vercel.app` · 본문 상한 `262144` bytes(256 KiB) · 테마 순서 `ai`, `world`, `gh`.
- **날짜 규칙**: POST의 `date`는 서버 시계 기준 KST 오늘이면서 평일이어야 한다. 아니면 400 `{ error: "DATE_NOT_ACCEPTED", expectedDate }`를 돌려준다.
- **빈 상태 문구**(정확히 이대로)
  - 데이터 없음: 「아직 저장된 뉴스가 없어요」 / 「평일 아침 8시에 첫 브리핑이 들어와요.」
  - API 오류: 「데이터를 불러오지 못했어요」 / 「잠시 뒤 새로고침해 주세요.」
- **커밋 금지**: 사용자 전역 규칙에 따라, 사용자가 명시적으로 지시하기 전에는 `git commit`·`push`를 하지 않는다. 각 태스크는 「변경을 워킹 트리에 둔다」로 끝난다. 작업 브랜치는 `feat/morning-signal`이다.
- 테스트 이름과 문구 외 모든 사용자 노출 텍스트는 한국어로 쓴다(레퍼런스 영어 라벨 `Mon, Oct 19`·`Morning Signal`은 그대로 둔다).

## Review Focus

다음 다섯 경우는 스펙이 직접 다루지 않지만 실제로 부딪힐 가능성이 높다. 가능성 높은 순서다. 각 항목의 테스트는 해당 태스크에 넣었다.

1. **해시에 목록에 없는 날짜(주말·오래된 링크)가 붙은 경우**: 최신 날짜로 연다. 에러가 나면 안 된다. → Task 3 e2e `falls back to latest for unknown hash`
2. **출처 URL이 `http(s)`가 아니거나 비어 있는 경우**(`javascript:` 등): 행은 그리되 링크는 없앤다. → Task 5 `feedRows drops non-http urls`
3. **GitHub 항목에 `starsTodayNum`이 `null`인 경우**: BarList 정렬에서 뒤로 보낸다. 막대 비율은 `0.05`, 값 표기는 `starsToday`가 있으면 그것을 쓰고 없으면 `—`를 쓴다. → Task 4 `barTop sorts nulls last`
4. **요약 루틴의 `highlight`가 `headline` 안에 없는 경우**: 강조 없이 문장만 그린다. → Task 4 `headlineParts ignores highlight not in headline`
5. **루틴이 같은 날짜·테마를 재시도로 두 번 보내거나, `status:"ok"`에 빈 `items`를 보낸 경우**: upsert로 한 행만 남긴다. 상태는 `items` 길이로 판정한다. → Task 2 `derives status from items, ignores client status`

---

### Task 1: 코어 로직 — 스키마·날짜·집계

**Files:**
- Create: `api/morning-signal.ts` — 이 태스크에서는 아래의 named export만 만든다. default handler는 Task 2에서 만든다.
- Test: `api/morning-signal.test.ts` — `describe('core')` 블록

**Interfaces:**
- Produces (later tasks import these exact names):

```ts
export const THEMES = ['ai', 'world', 'gh'] as const
export type Theme = (typeof THEMES)[number]
export type Impact = 'high' | 'mid' | 'low'
export type Grade = 'A' | 'B'
export type WorldCategory = '시사·국제' | '경제' | '상식·교양'
export type ThemeStatus = 'ok' | 'empty' | 'missing'
export interface AiItem { title: string; summary: string; publishedAt: string | null; impact: Impact; impactNote: string; url: string; grade: Grade; tags?: string[] }
export interface WorldItem { title: string; summary: string; publishedAt: string | null; category: WorldCategory; url: string; grade: Grade }
export interface GhItem { rank: number; repo: string; url: string; description: string; language: string | null; stars: string | null; starsToday: string | null; starsTodayNum: number | null; impact: Impact; impactNote: string; fePick: boolean; grade: Grade }
export interface ItemsByTheme { ai: AiItem[]; world: WorldItem[]; gh: GhItem[] }
export interface Feed<T extends Theme = Theme> { date: string; theme: T; generatedAt: string; model: string; status: 'ok' | 'empty'; note?: string; items: ItemsByTheme[T] }
export interface Feeds { ai?: Feed<'ai'>; world?: Feed<'world'>; gh?: Feed<'gh'> }
export interface Top { theme: Theme; text: string }
export interface DaySummary { date: string; weekday: string; counts: Record<Theme, number>; status: Record<Theme, ThemeStatus>; fe: { high: number; picks: string[] }; tops: Top[]; headline: string | null; highlight: string | null; updatedAt: string }
export interface FeedRow { date: string; theme: Theme; item_count: number; fe_high: number; fe_picks: string[]; top_text: string | null; updated_at: string }
export interface SummaryRow { date: string; headline: string; highlight: string | null; updated_at: string }
export type FeedPayload = { [T in Theme]: { kind: 'feed'; date: string; theme: T; generatedAt: string; model: string; note?: string; items: ItemsByTheme[T] } }[Theme]
export interface SummaryPayload { kind: 'summary'; date: string; headline: string; highlight?: string }
export type IngestPayload = FeedPayload | SummaryPayload
export interface Issue { path: string; message: string }
export function parseIngest(body: unknown): { ok: true; value: IngestPayload } | { ok: false; issues: Issue[] }
export function isDateString(s: unknown): s is string        // /^\d{4}-\d{2}-\d{2}$/
export function kstToday(now: Date): string                    // 'YYYY-MM-DD'
export function isWeekday(date: string): boolean
export function weekdayKo(date: string): string                // '월'…'금' (토·일도 계산은 한다)
export function feedAggregates<T extends Theme>(theme: T, items: ItemsByTheme[T]): { itemCount: number; feHigh: number; fePicks: string[]; topText: string | null }
export function buildDaySummary(date: string, feeds: FeedRow[], summary: SummaryRow | null): DaySummary
```

- [ ] **Step 1: 실패하는 테스트를 쓴다** (`describe('core')`)

```ts
it('coerces harmless type drift', () => {
  const r = parseIngest({ kind: 'feed', date: '2026-10-23', theme: 'gh', generatedAt: 'x', model: 'm', status: 'ok', items: [
    { rank: '3', repo: 'a/b', url: 'https://github.com/a/b', description: 'd', language: '', stars: 52971, starsToday: '+2,213', starsTodayNum: '+2,213', impact: 'low', impactNote: 'n', fePick: false, grade: 'A', foo: 1 } ] })
  expect(r.ok).toBe(true)
  // value.items[0]: rank 3, language null, stars '52971', starsTodayNum 2213, foo 키 없음, payload에 status 키 없음
})
it('rejects bad enum with path', () => { /* impact:'높음' → issues[0].path === 'items.0.impact' */ })
it('rejects missing required title', () => { /* ai item without title → path 'items.0.title' */ })
it('rejects malformed date', () => { /* date:'2026-10-2' → path 'date' */ })
it('parses summary and drops empty highlight', () => { /* {kind:'summary',date,headline:'h',highlight:''} → highlight undefined; headline '' → ok:false path 'headline' */ })
it('kstToday rolls over at 15:00Z', () => {
  expect(kstToday(new Date('2026-10-22T14:59:59Z'))).toBe('2026-10-22')
  expect(kstToday(new Date('2026-10-22T15:00:00Z'))).toBe('2026-10-23')
})
it('weekday helpers', () => {
  expect(isWeekday('2026-10-23')).toBe(true)   // 금
  expect(isWeekday('2026-10-24')).toBe(false)  // 토
  expect(isWeekday('2026-10-25')).toBe(false)  // 일
  expect(weekdayKo('2026-10-19')).toBe('월')
})
it('feedAggregates ai', () => { /* impacts [high,high,mid,low] → {itemCount:4, feHigh:2, fePicks:[], topText: items[0].title} */ })
it('feedAggregates gh prefers first fePick', () => { /* 2nd item fePick, starsToday '+1,187' → topText 'x/y · 오늘 +1,187', fePicks ['x/y'], feHigh 1 */ })
it('feedAggregates gh falls back to max starsTodayNum, null starsToday → repo only', () => { /* … */ })
it('feedAggregates empty → zeros and null top', () => { expect(feedAggregates('world', [])).toEqual({ itemCount: 0, feHigh: 0, fePicks: [], topText: null }) })
it('buildDaySummary', () => {
  // rows: ai(item_count 6, fe_high 2, top 'A'), world(item_count 0, top null), gh 없음; summary {headline:'h', highlight:'k'}
  // → status {ai:'ok', world:'empty', gh:'missing'}, counts {ai:6, world:0, gh:0}, fe {high:2, picks:[]}
  // → tops [{theme:'ai', text:'A'}], headline 'h', highlight 'k', weekday '월'(date '2026-10-19'), updatedAt = 세 updated_at 중 최댓값
})
it('buildDaySummary without summary → headline/highlight null', () => { /* … */ })
```

- [ ] **Step 2: 실행해서 실패를 확인한다** — `pnpm vitest run api/morning-signal.test.ts` → FAIL(모듈 없음)

- [ ] **Step 3: `api/morning-signal.ts`에 코어 export를 구현한다**
  - **Zod 4 스키마**
    - `z.object(...)`의 기본 동작(모르는 키 제거)을 쓴다.
    - 피드는 `kind`로 discriminatedUnion을 걸고, 그 안에서 `theme`별로 다시 나눈다.
    - 필수 문자열(`title`·`url`·`repo`·`headline` 등)은 `z.string().min(1)`로 검사한다.
    - 클라이언트가 보낸 `status`는 받기는 하되 반환값에서 뺀다.
  - **변환** (`z.preprocess`)
    - 숫자 자리: `'+2,213'` → `2213`. `+`·`,`·공백을 지우고 `Number`로 바꾼다. 결과가 정수가 아니면 실패다.
    - 문자열 자리: 숫자가 오면 `String`으로 바꾼다.
    - `null` 허용 자리: `''`면 `null`로 바꾼다.
  - **오류 경로**: Zod issue의 `path`를 `.`으로 이어 붙인다(`items.0.impact`).
  - **`kstToday`**: `now + 9h`의 UTC 날짜 부분을 쓴다.
  - **`feedAggregates`**: 스펙 §5.2 규칙을 따른다.
    - FE 높음 = AI `impact==='high'` 수 + GH `fePick` 수.
    - GH top = 첫 `fePick`. 없으면 `starsTodayNum` 최대(null은 -1로 본다)를 고른다.
    - `starsToday`가 있으면 `"<repo> · 오늘 <starsToday>"`, 없으면 repo만 쓴다.
  - **`buildDaySummary`**
    - 행이 없으면 `missing`, `item_count` 0이면 `empty`, 그 밖에는 `ok`다.
    - `fe.high`는 모든 행 `fe_high`의 합이다. `fe.picks`는 gh 행의 `fe_picks`다.
    - `tops`는 THEMES 순서로 `top_text`가 있는 것만 담는다.
    - `updatedAt`은 행과 summary의 `updated_at` 중 최댓값이다(문자열 ISO 비교).

- [ ] **Step 4: 통과를 확인한다** — 같은 명령 → PASS. 이어서 `pnpm typecheck` → 오류 0
- [ ] **Step 5: 변경을 워킹 트리에 둔다**(커밋하지 않는다)

---

### Task 2: API 핸들러 + Supabase 스키마

**Files:**
- Modify: `api/morning-signal.ts` — default handler를 추가한다
- Create: `docs/morning-signal/schema.sql`
- Test: `api/morning-signal.test.ts`의 `describe('handler')` 블록. `api/ahram.test.ts`의 `makeReq`·`makeRes`·env 패턴을 따른다.

**Interfaces:**
- Consumes: Task 1의 `parseIngest`, `kstToday`, `isWeekday`, `isDateString`, `feedAggregates`, `buildDaySummary`, 그리고 타입들.
- Produces (HTTP):
  - `GET /api/morning-signal` → `200 { days: DaySummary[] }`(date 오름차순)
  - `GET ?date=D`
    - `200 { day: DaySummary, feeds: Feeds }`
    - 형식이 틀린 날짜는 `400 { error: 'INVALID_DATE' }`
    - 행이 0개면 `404 { error: 'NOT_FOUND' }`
  - `POST`
    - feed 성공: `200 { ok: true, date, theme, itemCount }`
    - summary 성공: `200 { ok: true, date }`
  - 오류 응답(공통): `503 { error: 'SUPABASE_UNAVAILABLE' }`
  - 오류 응답(POST): `401 { error: 'UNAUTHORIZED' }` · `400 { error: 'INVALID_JSON' }` · `400 { error: 'INVALID_PAYLOAD', issues }` · `400 { error: 'DATE_NOT_ACCEPTED', expectedDate }` · `413 { error: 'PAYLOAD_TOO_LARGE' }`
  - 그 밖의 메서드: `405`
  - 모든 응답에 `Content-Type: application/json`, GET에는 `Cache-Control: no-store`를 붙인다.

**`docs/morning-signal/schema.sql`** (이 내용 그대로):

```sql
create table if not exists public.ms_feeds (
  date date not null,
  theme text not null check (theme in ('ai', 'world', 'gh')),
  items jsonb not null default '[]'::jsonb,
  note text,
  generated_at timestamptz,
  model text,
  item_count integer not null default 0,
  fe_high integer not null default 0,
  fe_picks text[] not null default '{}',
  top_text text,
  updated_at timestamptz not null default now(),
  primary key (date, theme)
);
create table if not exists public.ms_summaries (
  date date primary key,
  headline text not null,
  highlight text,
  updated_at timestamptz not null default now()
);
alter table public.ms_feeds enable row level security;
alter table public.ms_summaries enable row level security;
-- 정책을 두지 않는다: 서비스 롤 키(서버)만 접근한다.
```

**Supabase REST 호출**(헤더는 `api/ahram.ts`의 `supabaseHeaders()` 형태 그대로):
- 목록
  - `GET {base}/rest/v1/ms_feeds?select=date,theme,item_count,fe_high,fe_picks,top_text,updated_at&order=date.asc`
  - `GET {base}/rest/v1/ms_summaries?select=date,headline,highlight,updated_at`
- 날짜 상세
  - `GET {base}/rest/v1/ms_feeds?date=eq.D&select=*`
  - `GET {base}/rest/v1/ms_summaries?date=eq.D&select=*`
- feed upsert
  - `POST {base}/rest/v1/ms_feeds?on_conflict=date,theme`
  - 헤더: `Prefer: resolution=merge-duplicates,return=minimal`
  - 본문: `{ date, theme, items, note: note ?? null, generated_at, model, item_count, fe_high, fe_picks, top_text, updated_at: new Date().toISOString() }`
- summary upsert
  - `POST {base}/rest/v1/ms_summaries?on_conflict=date`
  - 본문: `{ date, headline, highlight: highlight ?? null, updated_at }`

**처리 순서 (POST)**
1. 환경변수 3개가 있는지 본다. 없으면 503.
2. `Authorization: Bearer <token>`을 `crypto.timingSafeEqual`로 비교한다. 두 값의 sha256 digest를 비교한다. 틀리면 401.
3. 본문을 읽는다. 262144 bytes를 넘으면 413.
4. JSON을 파싱한다. 실패하면 400 `INVALID_JSON`.
5. `parseIngest`로 검증한다. 실패하면 400 `INVALID_PAYLOAD`.
6. 날짜 규칙을 본다(`date !== kstToday(new Date())` 또는 `!isWeekday(date)`). 어기면 400 `DATE_NOT_ACCEPTED`.
7. upsert한다.

**날짜 상세의 `feeds` 변환**: 행마다 `{ date, theme, generatedAt: generated_at, model, status: items.length ? 'ok' : 'empty', note?: note ?? undefined, items }`로 바꾼다.

- [ ] **Step 1: 실패하는 테스트를 쓴다.** 준비: `vi.stubGlobal('fetch', vi.fn(...))`, `vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T00:00:00Z'))`(KST 금 09:00), env 3개.

```ts
it('GET 503 when SUPABASE_URL is empty')
it('POST 503 when MS_INGEST_TOKEN is empty')
it('POST 401 without bearer / with wrong bearer')
it('POST 400 INVALID_JSON on malformed body')
it('POST 400 INVALID_PAYLOAD lists issue paths')               // issues[0].path === 'items.0.impact'
it('POST 400 DATE_NOT_ACCEPTED for yesterday')                 // body.expectedDate === '2026-10-23'
it('POST 400 DATE_NOT_ACCEPTED on saturday even if today')     // setSystemTime('2026-10-24T00:00:00Z'), date '2026-10-24'
it('POST 413 when body exceeds 262144 bytes')
it('POST feed upserts with aggregates')
  // fetch URL === 'https://example.supabase.co/rest/v1/ms_feeds?on_conflict=date,theme'
  // headers.Prefer contains 'resolution=merge-duplicates'; JSON body item_count/fe_high/fe_picks/top_text 값 확인
  // res 200 { ok:true, date:'2026-10-23', theme:'gh', itemCount:N }
it('derives status from items, ignores client status')         // status:'ok' + items [] → 저장 본문 item_count 0, 200
it('POST summary upserts ms_summaries')                        // URL …/ms_summaries?on_conflict=date, highlight null when omitted
it('GET index returns days built from rows')                   // 두 fetch 응답 → days[0].status.gh === 'missing' 등, 오름차순
it('GET ?date=bad → 400 INVALID_DATE; ?date with no rows → 404')
it('GET ?date returns day + feeds with derived status')        // items [] → feeds.world.status === 'empty'
it('503 SUPABASE_UNAVAILABLE when supabase responds !ok')
it('405 for PUT')
```

- [ ] **Step 2: 실패를 확인한다** — `pnpm vitest run api/morning-signal.test.ts` → FAIL
- [ ] **Step 3: `api/morning-signal.ts`에 `export default async function handler(req: VercelRequest, res: ServerResponse)`를 구현한다.** `VercelRequest`·`readBody`·`json` 헬퍼는 `api/ahram.ts`와 같은 모양으로 이 파일 안에 둔다. `schema.sql`도 작성한다.
- [ ] **Step 4: 통과를 확인한다** — `pnpm vitest run api/` → PASS(ahram 포함, core 블록 유지). `pnpm typecheck` → 0
- [ ] **Step 5: 변경을 워킹 트리에 둔다**

---

### Task 3: 페이지 골격 — 라우트·CSS·데이터 훅·헤더·상태·E2E 기반

**Files:**
- Modify: `app/routes.ts` — `route('morning-signal', 'routes/morning-signal.tsx')` 추가
- Create:
  - `app/routes/morning-signal.tsx`
  - `app/routes/morning-signal/morning-signal.css`
  - `app/routes/morning-signal/model.ts`
  - `app/routes/morning-signal/model.test.ts`
  - `app/routes/morning-signal/Header.tsx`
  - `app/hooks/use-morning-signal.ts`
  - `playwright.config.ts`
  - `e2e/morning-signal.e2e.ts`
  - `e2e/fixtures/{normal,missing,noai,single}.json`
  - `e2e/fixtures/mock-api.ts`

**Interfaces:**
- Consumes
  - Task 1 타입: 훅에서는 `import type { DaySummary, Feeds } from '../../api/morning-signal'`, model.ts에서는 `'../../../api/morning-signal'`.
  - Task 2 HTTP 계약.
- Produces:

```ts
// app/hooks/use-morning-signal.ts
export function useMsDays(): UseQueryResult<DaySummary[]>          // key ['ms','days'], fetch '/api/morning-signal' → .days
export function useMsDay(date: string | null, stamp: string | undefined): UseQueryResult<{ day: DaySummary; feeds: Feeds }>
  // key ['ms','day',date,stamp], enabled: !!date, placeholderData: keepPreviousData
// 두 훅 공통: retry: 3, retryDelay: (n) => 1500 * (n + 1), !res.ok면 throw

// app/routes/morning-signal/model.ts (이 태스크 분)
export const WD_KO: readonly string[]                               // ['일','월',…,'토']
export function labelEn(date: string): string                       // '2026-10-19' → 'Mon, Oct 19'
export function kstTime(iso: string | null | undefined): string     // '2026-10-18T23:03:00Z' → '08:03', 잘못된 값 → ''
export function pickInitialDate(days: DaySummary[], hash: string): string | null  // 해시가 목록에 있으면 그 날짜, 아니면 마지막, 목록이 비면 null
export interface CalCell { date: string | null; day: number | null; has: boolean; on: boolean }
export function calendarCells(year: number, month: number, have: ReadonlySet<string>, cur: string | null): CalCell[]
  // 레퍼런스 buildCal: 월~금만, 선행 빈칸 = (첫날 요일+6)%7 (단 >4면 0)
```

**페이지 동작** (레퍼런스 JS 363–774행 기준. 개발 보기 관련 부분은 뺀다)
- `cur`는 `pickInitialDate(days, location.hash.slice(1))`로 처음 한 번 정한다. 이후 날짜를 옮길 때마다 `navigate({ hash: cur }, { replace: true })`로 해시를 바꾼다.
- 목록이 갱신됐을 때 `cur`가 목록에 없으면 마지막 날짜로 바꾼다.
- `useMsDay(cur, days.find(d => d.date === cur)?.updatedAt)`로 상세를 받는다. stamp가 바뀌면 다시 받는 효과가 난다(레퍼런스 `lastStamp`와 같은 동작).
- **상태**
  - 목록 로딩 중: 스탬프에 「불러오는 중」을 보이고 본문은 숨긴다.
  - 목록이 빈 배열: 빈 상태(Global Constraints 문구)를 보인다.
  - 목록 또는 상세 쿼리 오류(재시도 소진 후): 오류 상태를 보인다.
- **스탬프**: `${labelEn(cur)} · ${HH:MM} KST 갱신`. 시각은 `kstTime(day.updatedAt || 최신 feed.generatedAt)`이다. 시각이 비면 ` · …` 부분을 뺀다.
- **테마**
  - 마운트 시 `localStorage['ms-theme']`(try/catch, 기본 `light`)를 `document.documentElement.dataset.msTheme`에 쓴다. **언마운트 시 이 속성을 지운다**(다른 라우트에 새지 않게).
  - 토글은 레퍼런스 414–423행 그대로다(`document.startViewTransition` + 원형 clipPath, reduced-motion이면 즉시 적용).
  - 버튼 aria-label은 「다크 모드로 전환」 또는 「라이트 모드로 전환」이다.
- **글꼴**: 컴포넌트 안에서 `<link rel="stylesheet" href={레퍼런스 4행 URL} precedence="default" />`를 렌더한다(React 19가 head로 올린다).
- **viewport-fit**: `root.tsx`는 건드리지 않는다. `env(safe-area-inset-*)`는 0으로 떨어져 `max(16px, …)`가 16px가 된다(의도된 폴백).
- **배경**: 라우트 최상위 `.ms` 안에 레퍼런스 277–278행의 `.aurora`(i 3개)와 `.grid-bg`를 그대로 둔다.
- **헤더**(`Header.tsx`, 레퍼런스 281–310·597–635행): 로고 이퀄라이저, 제목, 스탬프, 날짜 이동을 그린다. 날짜를 옮기면 날짜 라벨에 방향에 따라 `in-l` 또는 `in-r` 클래스를 붙인다(레퍼런스 `updNav`).
  - 날짜 이동 버튼: `‹`(aria-label 「이전 날짜」), 날짜 버튼(레퍼런스 마크업의 「최신」 배지 포함), `›`(aria-label 「다음 날짜」).
  - 달력 팝오버(role=dialog, aria-label 「날짜 선택」): 월 이동이 된다. 뉴스가 없는 날은 disabled다. 바깥을 클릭하거나 Escape를 누르면 닫힌다.
  - **보기 전환 버튼(뉴스/개발)은 만들지 않는다.**
- **CSS 이식 규칙**(`morning-signal.css`, 레퍼런스 6–276행)
  1. 다음 개발 전용 규칙은 버린다: `.vsw`, `.devhead`, `.devgrid`, `.devcard`, `.crow`, `.jiras`, `.raw`, `.sum`.
  2. `:root{…}`·`:root[data-ms-theme="dark"]{…}` 토큰 블록은 `:root[data-ms-theme]{…}`(라이트)와 `:root[data-ms-theme="dark"]{…}`로 바꾼다. 속성이 있을 때만 적용되게 하려는 것이다.
  3. `body{…}`는 `.ms{…}`로 바꾸고 `min-height:100vh`를 둔다. `.ms`는 라우트 최상위 요소다.
  4. 그 밖의 모든 선택자 앞에 `.ms `를 붙인다. 테마 조건이 있는 선택자는 `:root[data-ms-theme="dark"] .ms .theme .core` 형태로 둔다.
  5. 예외는 `::view-transition-*`다.
  6. `@keyframes` 이름에는 `ms-` 접두를 붙이고, 참조하는 쪽도 함께 바꾼다. 전역 `globals.css`의 `fadeUp` 등과 충돌하지 않게 하려는 것이다.
  7. CSS는 라우트 파일에서 `import './morning-signal/morning-signal.css'`로 불러온다.
- **E2E 기반**
  - `playwright.config.ts`
    - `testDir: 'e2e'`, `testMatch: '**/*.e2e.ts'`(vitest 기본 include와 겹치지 않게 한다)
    - `use.baseURL: 'http://localhost:5179'`
    - `webServer: { command: 'pnpm dev --port 5179', url: 'http://localhost:5179', reuseExistingServer: true }`
    - 프로젝트는 chromium만 둔다.
  - `e2e/fixtures/*.json`: 레퍼런스 fixture를 그대로 복사하되 `dev` 키는 뺀다.
  - `mock-api.ts`의 `export async function mockApi(page: Page, fixture: 'normal'|'missing'|'noai'|'single'|'empty'|'error'): Promise<void>`
    - `page.route('**/api/morning-signal**')`로 응답을 가로챈다.
    - 쿼리 없는 요청에는 `{ days: fx.days }`를 돌려준다.
    - `?date=D` 요청에는 `{ day, feeds: { ai: fx.feeds['D--ai'], world: …, gh: … } }`를 돌려준다. 없는 테마 키는 생략한다.
    - `'empty'`는 `{ days: [] }`, `'error'`는 항상 500이다.

- [ ] **Step 1: model 테스트를 쓴다**

```ts
it('labelEn', () => expect(labelEn('2026-10-19')).toBe('Mon, Oct 19'))
it('kstTime', () => { expect(kstTime('2026-10-18T23:03:00Z')).toBe('08:03'); expect(kstTime(undefined)).toBe(''); expect(kstTime('x')).toBe('') })
it('pickInitialDate honours known hash, else latest', () => { /* days 10-15,10-16,10-19: '2026-10-16'→'2026-10-16', '2026-10-18'→'2026-10-19', ''→'2026-10-19', []→null */ })
it('calendarCells skips weekends with weekday lead', () => {
  const cells = calendarCells(2026, 10, new Set(['2026-10-19']), '2026-10-19')
  // 10월 1일 = 목 → 선행 빈칸 3, 평일 22일 → 길이 25
  // cells.find(c => c.date === '2026-10-19') → { has: true, on: true }; '2026-10-17'(토) 없음
})
```

- [ ] **Step 2: 실패를 확인한다** — `pnpm vitest run app/routes/morning-signal/model.test.ts` → FAIL
- [ ] **Step 3: model 함수와 훅, 헤더, 라우트 골격, CSS 이식, Playwright 설정·fixture·mock을 구현한다.** 본문 영역(KPI·벤토·피드)은 Task 4·5의 자리만 남겨 둔다(빈 `<section>`).
- [ ] **Step 4: e2e 테스트를 쓴다** (`e2e/morning-signal.e2e.ts`)

```ts
test('opens latest date with 최신 badge', async ({ page }) => { /* mockApi normal → 날짜 버튼 'Mon, Oct 19', '최신' 보임, 「다음 날짜」 disabled, URL hash '#2026-10-19' */ })
test('honours hash and prev button updates hash', async ({ page }) => { /* goto '/morning-signal#2026-10-15' → 'Thu, Oct 15'; 「이전 날짜」 클릭 → hash가 목록의 바로 앞 날짜로 */ })
test('falls back to latest for unknown hash', async ({ page }) => { /* '#2026-10-18' → 'Mon, Oct 19', 콘솔 에러 0 */ })
test('calendar navigates and closes on Escape', async ({ page }) => { /* 날짜 버튼 클릭 → dialog '날짜 선택' 보임, '10월 16일' 클릭 → 'Fri, Oct 16', 다시 열고 Escape → 숨김 */ })
test('theme persists and does not leak to other routes', async ({ page }) => {
  // 기본 html[data-ms-theme="light"]; 「다크 모드로 전환」 클릭 → "dark", localStorage ms-theme === 'dark'
  // reload → 여전히 dark; page.goto('/') → html에 data-ms-theme 속성 없음
})
test('empty state', async ({ page }) => { /* mockApi empty → '아직 저장된 뉴스가 없어요' */ })
test('error state after retries', async ({ page }) => { /* mockApi error → '데이터를 불러오지 못했어요' (timeout 15_000) */ })
```

- [ ] **Step 5: 통과를 확인한다** — `pnpm vitest run app/routes/morning-signal` → PASS. `pnpm exec playwright test e2e/morning-signal.e2e.ts` → 7 passed. `pnpm typecheck` → 0
- [ ] **Step 6: 변경을 워킹 트리에 둔다**

---

### Task 4: KPI 4장 + 벤토(한 줄·도넛·카테고리바·BarList)

**Files:**
- Create: `app/routes/morning-signal/Odometer.tsx`, `app/routes/morning-signal/Kpis.tsx`, `app/routes/morning-signal/Bento.tsx`
- Modify: `app/routes/morning-signal/model.ts`, `app/routes/morning-signal/model.test.ts`, `app/routes/morning-signal.tsx`(자리 채우기), `e2e/morning-signal.e2e.ts`

**Interfaces:**
- Consumes: Task 3의 `labelEn`, `WD_KO`, 페이지 상태(`days`, `cur`, `feeds`).
- Produces (model.ts 추가분):

```ts
export type KpiKey = 'total' | Theme
export interface Counts { ai: number; world: number; gh: number; total: number }
export function countsFor(day: DaySummary, feeds: Feeds | null): Counts        // feeds가 있으면 items 길이, 없으면 day.counts
export interface Kpi { value: number; delta: number | null; prevDate: string | null; series: number[]; min: number; max: number }
export function kpiModel(days: DaySummary[], cur: string, feeds: Feeds): Record<KpiKey, Kpi>   // 창 = cur 포함 최근 10개, 비교 = 바로 앞 날짜
export function sparkPath(vals: number[], w?: number, h?: number): { line: string; area: string; len: number; end: [number, number] }  // 레퍼런스 427–437 (기본 220×36)
export function chipFor(feed: Feed | undefined): { show: boolean; zero: boolean; text: '' | '0건' | '수집 실패' }
export function headlineParts(headline: string | null, highlight: string | null): { before: string; mark: string; after: string } | null  // 레퍼런스 481–487: 강조 뒤 공백 아닌 글자를 강조에 붙인다
export function deriveTops(feeds: Feeds): Top[]                                  // day.tops가 비었을 때만 쓴다(레퍼런스 492–496)
export function donutModel(items: AiItem[]): { high: number; mid: number; low: number; total: number; segments: { len: number; offset: number }[] }  // C=2π·46, 비어 있지 않은 세그먼트는 −3 간격
export function catModel(items: WorldItem[]): { counts: [number, number, number]; pct: (number | null)[] }       // 순서 시사·국제, 경제, 상식·교양. pct = Math.round(n/total*100), total 0이면 null
export function barTop(items: GhItem[]): { repo: string; value: string; scale: number }[]   // 상위 5개, null은 뒤로, scale = max(0.05, n/max), value = starsToday || '+'+n(ko-KR) || '—'
```

**컴포넌트 동작** (레퍼런스와 같은 클래스명·마크업 구조)
- **Odometer** (`{ value: number; id?: string }`)
  - 레퍼런스 397–406행의 릴(reel) 방식이다. 자리수마다 0–9 숫자 20개를 쌓는다.
  - 렌더할 때마다 base를 10과 0 사이로 번갈아 바꿔 같은 값이라도 다시 굴러가게 한다. 자리마다 80ms씩 지연을 준다.
  - 루트 요소에 `data-value={String(Math.max(0, Math.round(value)))}`를 단다(테스트 앵커).
- **Kpis**
  - 카드 4장을 그린다(레퍼런스 438–441·447–470행). 각 article에 `data-kpi={key}`를 단다.
  - 델타 클래스는 up / down / flat이고, title은 `MM.DD 대비`다. 이전 날짜가 없으면 「—」와 title 「비교할 이전 날짜가 없어요」다.
  - 보조 줄은 `MM.DD 대비 · 최근 N일 범위 a–b`다.
  - 테마 카드에는 `chipFor` 칩을 붙인다(`kchip`, 0건이면 `zero` 클래스).
- **Bento**
  - **한 줄**: eyebrow `MM.DD 요일 · 오늘의 한 줄`. 단어마다 `span.w`에 65ms 간격 지연을 주고, `mark`로 강조한다.
    - headline이 없으면 `line none` 클래스와 문구 「오늘의 한 줄이 아직 없어요.」를 보인다.
    - 날짜가 바뀔 때는 이전 단어에 `out` 클래스를 붙이고 220ms 뒤에 바꾼다(reduced-motion이면 즉시).
  - **tops**: `day.tops`가 있으면 그것을, 비어 있으면 `deriveTops`를 쓴다. 이름표는 AI / 시사·경제 / GitHub이다.
  - **도넛**: 레퍼런스 502–514행. 빈 상태 문구는 feed가 있으면 「검증된 AI 뉴스가 없는 날이에요.」, 없으면 「AI 뉴스를 가져오지 못했어요.」다.
  - **카테고리바**: 레퍼런스 515–523행. scaleX가 0→1로 늘어나며 160ms씩 지연한다. 빈 문구는 「검증된 시사·경제 뉴스가 없는 날이에요.」 / 「시사·경제 뉴스를 가져오지 못했어요.」다.
  - **BarList**: 레퍼런스 524–550행.
    - 행 key는 repo다. `top = i*32px`로 위치를 정하고, 처음 들어오는 행은 `5*32+12px`에서 시작한다.
    - 빠지는 행은 opacity 0과 `-32px`로 600ms 동안 유지한 뒤 지운다.
    - 패널 머리 `#pick`에 `FE 주목 · <repo>` 칩을 단다.
    - 빈 문구는 「오늘은 정리된 레포가 없어요.」 / 「GitHub 트렌딩을 가져오지 못했어요.」다.
  - **패널 기울기·광택**: hover가 되는 기기에서만, reduced-motion이 아닐 때 켠다(레퍼런스 754–760행).

- [ ] **Step 1: model 테스트를 쓴다.** 값은 `e2e/fixtures/normal.json`의 2026-10-19를 기준으로 한다.

```ts
it('kpiModel deltas vs previous date', () => {
  // normal: cur '2026-10-19', prev '2026-10-16'
  // total.value 24, total.delta -1, ai.delta -1, world.delta -1, gh.delta 1, prevDate '2026-10-16', series 길이 10
})
it('kpiModel first day has null delta', () => { /* single → delta null, prevDate null */ })
it('chipFor', () => { /* undefined → {show:true, zero:false, text:'수집 실패'}; items [] → {show:true, zero:true, text:'0건'}; items 1+ → show false */ })
it('headlineParts glues trailing punctuation', () => { expect(headlineParts('막는 기업이 늘고, 루머가 돌아요', '기업이 늘고')).toEqual({ before: '막는 ', mark: '기업이 늘고,', after: ' 루머가 돌아요' }) })
it('headlineParts ignores highlight not in headline', () => { expect(headlineParts('A B', 'Z')).toEqual({ before: 'A B', mark: '', after: '' }) })
it('headlineParts null headline → null', () => { expect(headlineParts(null, null)).toBeNull() })
it('donutModel counts and gaps', () => { /* impacts high,high,mid → high 2, mid 1, low 0, total 3; segments[2].len 0 */ })
it('catModel percentages', () => { /* [시사·국제×2, 경제×1] → counts [2,1,0], pct [67,33,0]; [] → pct [null,null,null] */ })
it('barTop sorts nulls last', () => { /* starsTodayNum [null, 50, 100] → repos 순서 [100, 50, null], 마지막 scale 0.05, value '—' (starsToday 없음) */ })
it('sparkPath single value is flat', () => { /* [5] → line 'M0.0 18.0 L220.0 18.0' */ })
```

- [ ] **Step 2: 실패를 확인한다** — `pnpm vitest run app/routes/morning-signal/model.test.ts` → FAIL
- [ ] **Step 3: model 함수, Odometer, Kpis, Bento를 구현하고 라우트에 끼운다**
- [ ] **Step 4: e2e를 추가한다**

```ts
test('kpis show counts, deltas and failure chips', async ({ page }) => {
  // normal: [data-kpi="total"] .odo[data-value="24"], [data-kpi="gh"] delta 텍스트 '+1'
  // missing: [data-kpi="gh"] .kchip '수집 실패', [data-kpi="world"] .kchip '0건'
})
test('headline renders mark and tops', async ({ page }) => { /* normal: h2.line mark 텍스트에 '막는 기업이 늘고' 포함, tops 3개 */ })
test('bento empty texts when feeds missing', async ({ page }) => { /* noai: 'AI 뉴스를 가져오지 못했어요.', 'GitHub 트렌딩을 가져오지 못했어요.', '검증된 시사·경제 뉴스가 없는 날이에요.' */ })
```

- [ ] **Step 5: 통과를 확인한다** — vitest PASS. `pnpm exec playwright test` → 10 passed. `pnpm typecheck` → 0
- [ ] **Step 6: 변경을 워킹 트리에 둔다**

---

### Task 5: 피드 탭 + 목록

**Files:**
- Create: `app/routes/morning-signal/Feed.tsx`
- Modify: `app/routes/morning-signal/model.ts`, `model.test.ts`, `app/routes/morning-signal.tsx`, `e2e/morning-signal.e2e.ts`

**Interfaces:**
- Consumes: Task 3의 페이지 상태, Task 4의 `chipFor`.
- Produces:

```ts
export function safeUrl(u: unknown): string | null                       // /^https?:\/\//i 만 통과
export function domain(u: string): string                                // 'www.' 제거, 파싱 실패 시 원문
export interface FeedRowView { title: string; tags: string[]; meta: string; chip: { cls: 'h' | 'm' | 'l' | 'c'; text: string } | null; summary: string | null; impactNote: string | null; grade: string | null; link: { href: string; label: string } | null }
export function feedRows(theme: Theme, feed: Feed | undefined): FeedRowView[]   // 레퍼런스 553–569행을 구조화한 것
export function tabCount(feed: Feed | undefined): { text: string; bad: boolean } // 없으면 '수집 실패', 0이면 '0건', 아니면 숫자 문자열
```

**동작** (레퍼런스 342–350·570–594·636–641행)
- **세그먼트 탭**: AI 뉴스 / 시사·경제·상식 / GitHub. role=tab, aria-selected를 단다. 탭별 건수는 `tabCount`로 정하고 `bad` 클래스를 붙인다.
- **인디케이터**: 선택된 탭의 offsetLeft·offsetWidth로 움직인다. 크기를 바꿀 때와 글꼴이 로드됐을 때 다시 잰다.
- **슬라이드**: 탭을 바꾸면 순서 방향에 따라 목록에 `sl` 또는 `sr` 클래스를 붙인다. 날짜를 바꿀 때도 방향을 넘긴다.
- **행**
  - 번호(01…), 제목, 태그 `span.tag`, meta, 칩, 펼침 표시를 그린다.
  - 행을 누르면 `open` 토글과 aria-expanded가 바뀐다.
  - 펼친 본문 순서: summary → `FE 영향` → `검증 X등급` → 링크.
  - 링크는 `target="_blank" rel="noopener"`이고 라벨은 `domain ↗`다. GitHub은 URL에서 스킴을 뺀 것을 라벨로 쓴다.
  - 본문이 비면 「추가 정보가 없어요.」를 보인다.
- **칩**
  - AI: impact에 따라 `FE 높음`(h) / `FE 중간`(m) / `FE 낮음`(l).
  - 시사: category(c).
  - GitHub: fePick이면 `FE 주목`(h), 아니면 impact.
- **meta**
  - AI·시사: `게재 YYYY-MM-DD`.
  - GitHub: `[language, '★ '+stars, starsToday]`를 ` · `로 잇는다.
- **빈 목록**: feed가 있으면 「검증된 {라벨}가 없는 날이에요.」에 note를 붙인다. 없으면 「이 날짜의 {라벨}를 가져오지 못했어요.」다. 라벨은 AI 뉴스 / 시사·경제·상식 뉴스 / GitHub 트렌딩이다.

- [ ] **Step 1: model 테스트를 쓴다**

```ts
it('feedRows ai maps chip, tags, meta, link', () => { /* impact 'high' → chip {cls:'h', text:'FE 높음'}, tags ['루머'], meta '게재 2026-10-18', link.label 'fourweekmba.com ↗' */ })
it('feedRows drops non-http urls', () => { /* url 'javascript:alert(1)' → link null; url '' → link null */ })
it('feedRows gh meta and fePick chip', () => { /* language 'TypeScript', stars '52,971', starsToday '+2,213', fePick true → meta 'TypeScript · ★ 52,971 · +2,213', chip {cls:'h', text:'FE 주목'}, link.label 'github.com/a/b ↗' */ })
it('tabCount', () => { /* undefined → {text:'수집 실패', bad:true}; [] → {'0건', true}; 5개 → {'5', false} */ })
```

- [ ] **Step 2: 실패를 확인한다** → FAIL
- [ ] **Step 3: model 함수와 `Feed.tsx`를 구현하고 라우트에 끼운다**
- [ ] **Step 4: e2e를 추가한다**

```ts
test('tabs switch lists and rows expand', async ({ page }) => {
  // normal: AI 탭 행 6개; GitHub 탭 클릭 → aria-selected true, 행 13개
  // 첫 행 클릭 → aria-expanded 'true', 링크 target '_blank'
})
test('tab counts flag failures', async ({ page }) => { /* missing: GitHub 탭 em '수집 실패', 시사 탭 '0건' + 목록 '검증된 시사·경제·상식 뉴스가 없는 날이에요.' */ })
test('reduced motion still renders everything', async ({ page }) => { /* page.emulateMedia({ reducedMotion: 'reduce' }) → KPI data-value 24, 행 6개 */ })
```

- [ ] **Step 5: 통과를 확인한다** — vitest PASS. playwright → 13 passed. `pnpm typecheck` → 0
- [ ] **Step 6: 변경을 워킹 트리에 둔다**

---

### Task 6: 홈 카드 + 프로젝트 문서

**Files:**
- Modify
  - `app/routes/home.tsx`: `/stock` 카드 다음에 카드를 추가한다. 제목은 `Morning Signal<span>뉴스 대시보드</span>`, 버튼은 「보러가기」, `navigate('/morning-signal')`.
  - `CLAUDE.md`
    - 라우트 표에 `/morning-signal` 「Morning Signal 뉴스 대시보드(보기 전용)」와 `/api/morning-signal`을 추가한다.
    - 빠져 있던 `/ahram`·`/api/ahram`을 채운다.
    - Directory Structure에 `morning-signal.tsx`, `morning-signal/`, `e2e/`, `docs/morning-signal/`을 적는다.
    - 환경 변수 절에 서버 변수 3개를 적는다(값은 적지 않는다).
  - `README.md`: 「페이지 구성」 표에 `/morning-signal` 행을 추가하고 트리를 갱신한다.

- [ ] **Step 1: 위 세 파일을 수정한다**
- [ ] **Step 2: 확인한다**
  - `grep -n "morning-signal" CLAUDE.md README.md app/routes/home.tsx` → 세 파일 모두 히트
  - `grep -n "/ahram" CLAUDE.md` → 라우트 표에 히트
- [ ] **Step 3: e2e를 추가한다** — `test('home links to morning signal')`: `/`에서 Morning Signal 카드의 버튼을 누르면 URL이 `/morning-signal`이 된다. 실행 → PASS
- [ ] **Step 4: 변경을 워킹 트리에 둔다**

---

### Task 7: 루틴 문서 (다른 계정용)

**Files:**
- Create: `docs/morning-signal/routines/README.md`, `news-ai.md`, `news-world.md`, `news-gh.md`, `summary.md`

**각 프롬프트 파일의 형식**
1. 머리말(프롬프트가 아니다): 이름, 스케줄(평일 KST), 모델 `claude-sonnet-5-5`, 커넥터 없음, 복사 원본 `second-brain/.wiki-automation/routines/<파일> (2026-10-23)`.
2. `## 프롬프트` 헤딩 다음 줄에 백틱 4개짜리 `text` 펜스를 열고, 붙여넣을 본문 전체를 넣은 뒤 백틱 4개로 닫는다. GitHub의 복사 버튼으로 그대로 가져갈 수 있게 하려는 것이다. 펜스 안 1행이 본문 1행이다.

**뉴스 3개 본문**
- 원본의 2행부터 저장 단계 헤딩 바로 앞 행까지를 **바이트 그대로** 복사한다. 저장 단계 헤딩은 다음과 같다.
  - `news-ai.md`: 57행 `【5단계 — Morning Signal DB 저장`
  - `news-world.md`: 62행 `【5단계 — Morning Signal DB 저장`
  - `news-gh.md`: 42행 `【4단계 — Morning Signal DB 저장`
- 1행만 바꾼다: 「Morning Signal 대시보드 DB에 저장하는」 → 「Vibe_app Morning Signal API에 저장하는」.
- 그 뒤에 새 저장 단계를 붙인다. 단계 번호는 원본과 같다(5단계 / GitHub 4단계). 담을 내용은 다음과 같다.
  - Slack을 보내지 않는다는 문장(원본과 같은 문장).
  - `date -u +%Y-%m-%dT%H:%M:%SZ` → GENERATED_AT.
  - 문서 형식: 원본의 JSON 형식·항목 필드 정의를 그대로 옮기고 맨 앞에 `"kind": "feed"`를 더한다.
  - 파일 쓰기: Write 도구로 `feed.json`을 쓴다.
  - 전송 명령(정확히):
    ```
    curl -sS -w '\n%{http_code}' -X POST "https://vibe-app-omega.vercel.app/api/morning-signal" -H "Content-Type: application/json" --data-binary @feed.json
    ```
    `MS_INGEST_TOKEN` 환경변수가 있으면(폴백 구성) `-H "Authorization: Bearer $MS_INGEST_TOKEN"`을 더한다. 없으면 붙이지 않는다(네트워크 시크릿이 붙인다).
  - 재시도 규칙(스펙 §7 그대로).
    - 5xx·네트워크 오류는 1~2회 재시도한다.
    - 400 `INVALID_PAYLOAD`는 issues의 필드 형식만 고쳐 1회 다시 보낸다. 내용은 바꾸지 않는다. 고칠 수 없는 항목은 빼고 그 제목을 보고한다.
    - `DATE_NOT_ACCEPTED`는 `expectedDate`와 0단계 날짜를 비교한다. 같으면 주말 실행이므로 보고하고 끝낸다. 다르면 0단계를 재확인한다.
    - 401은 재시도하지 않고 보고한다.
  - 최종 출력 첫 줄: `SAVED <theme> items=N` / `SAVE_FAILED <HTTP 코드> <응답 원문>`. 이어서 제목 목록을 적는다.
  - 0건이어도 반드시 보낸다는 문장(원본의 ★ 문장을 대상만 바꿔 쓴다).

**`summary.md` 본문**
- 절대 규칙: 원본 `notify.md` 4행의 1번 규칙을 그대로 쓴다.
- 0단계: TODAY만 쓴다(`TZ=Asia/Seoul date +%Y-%m-%d`).
- 1단계: `curl -sS -w '\n%{http_code}' "https://vibe-app-omega.vercel.app/api/morning-signal?date=TODAY"`. 200이면 feeds의 제목·요약을 읽는다. 404면 세 테마 모두 수집 실패로 본다.
- 2단계: headline·highlight 규칙. `notify.md` 70–71행 문장과 75행의 「세 테마가 모두 missing이면…」 규칙을 그대로 옮긴다. tops·counts는 쓰지 않는다(서버가 계산한다).
- 3단계: `{"kind":"summary","date":"TODAY","headline":…,"highlight":…}`를 `summary.json`으로 쓴 뒤, 뉴스 루틴과 같은 curl 형식으로 POST한다. 재시도 규칙도 같다.
- 최종 출력: `SUMMARIZED TODAY` / `SUMMARY_FAILED <HTTP 코드> <응답 원문>`.
- Slack·dev·집계 스크립트·ArtifactData 언급은 없다.

**`README.md`**: 스펙 §7 「설정 안내」 1~5와 「확인 결과」를 그대로 옮긴다. 담을 항목은 다음과 같다.
- 사전 준비: `docs/morning-signal/schema.sql` 실행, Vercel `MS_INGEST_TOKEN` 등록, 재배포.
- 토큰 만드는 법: 예) `openssl rand -hex 32`.
- 환경 설정: 네트워크 시크릿을 1순위로, Custom + 환경변수를 폴백으로.
- 작업 4개 등록 표: 이름 / 파일 / 평일 KST 시각 07:50·07:55·08:00·08:30 / 모델 / 커넥터 끔.
- 평일 시험 운행과 `command -v curl` 확인.
- 문제 해결: 401 / 403 `host_not_allowed` / 400.
- **실제 토큰 값은 어디에도 쓰지 않는다.**

- [ ] **Step 1: 다섯 파일을 작성한다**
- [ ] **Step 2: 원문 보존을 검증한다.** 파일마다 아래 순서로 한다. 프로세스 치환과 `$(( ))`는 셸 훅에 막힐 수 있으므로 쓰지 않고 명령을 하나씩 실행한다.
  1. `grep -n '^````' docs/morning-signal/routines/news-ai.md`로 여는 펜스 행 번호 F를 얻는다.
  2. `sed -n '2,56p' /Users/seungho/Documents/second-brain/.wiki-automation/routines/news-ai.md > .tmp-ms-orig.txt`를 실행한다.
  3. `sed -n '<F+2>,<F+56>p' docs/morning-signal/routines/news-ai.md > .tmp-ms-new.txt`를 실행한다. `<F+2>`·`<F+56>` 자리에는 계산한 숫자를 넣는다.
  4. `diff .tmp-ms-orig.txt .tmp-ms-new.txt`의 출력이 없으면 통과다.
  - world는 원본 `2,61p` ↔ `<F+2>,<F+61>p`, gh는 `2,41p` ↔ `<F+2>,<F+41>p`로 같은 방식이다.
  - 끝나면 `rm .tmp-ms-orig.txt .tmp-ms-new.txt`로 지운다.
- [ ] **Step 3: 금지어 검사**
  - `grep -rn -e "ArtifactData" -e "claude.ai/artifact" -e "U0BADF0DMS9" -e "slack_send" -e "ms-inbox" docs/morning-signal/routines/` → 0건
  - `grep -rn "vibe-app-omega.vercel.app/api/morning-signal" docs/morning-signal/routines/` → 4개 프롬프트 파일 모두 히트
- [ ] **Step 4: 변경을 워킹 트리에 둔다**

---

### Task 8: 전체 검증 + 사용자 인계

- [ ] **Step 1: 게이트를 돌린다** (각 명령을 따로 실행한다)
  - `pnpm check` → 오류 0(Biome가 포맷을 고친 뒤 다시 실행해도 변경 없음)
  - `pnpm typecheck` → 0
  - `pnpm test` → 전부 PASS(ahram·motion 포함)
  - `pnpm test:e2e` → 14 passed
  - `pnpm build` → 성공. `build/client/assets`에 morning-signal 청크가 생기고, `grep -rl "SERVICE_ROLE\|MS_INGEST" build/client` → 0건
- [ ] **Step 2: 화면을 실측한다.**
  - 새 페이지: `pnpm dev`와 mock(`mockApi normal`)으로 1280px·390px 스크린샷을 찍는다.
  - 레퍼런스: `dashboard/` 폴더를 정적 서버로 띄운다(`python3 -m http.server 8765 --directory /Users/seungho/Documents/second-brain/.wiki-automation/dashboard`). Playwright `addInitScript`로 `fake-db.js` 내용을 주입하고 `morning-signal.html?fx=normal`을 같은 크기로 찍는다.
  - 라이트·다크 두 벌을 나란히 비교한다. 개발 탭 버튼이 없는 것만 다르고 나머지는 같아야 한다.
  - 차이(간격·색·모션 누락)를 목록으로 남기고 고친다.
- [ ] **Step 3: 사용자에게 보고하고 멈춘다.** 커밋·푸시·배포는 사용자 지시 후에만 한다. 보고에 다음 순서를 적는다.
  1. Supabase SQL Editor에서 `docs/morning-signal/schema.sql`을 실행한다.
  2. Vercel Production에 `MS_INGEST_TOKEN`을 추가한다. `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`가 있는지 확인한다.
  3. 커밋·푸시를 승인한다 → Vercel이 배포한다.
  4. 배포 뒤 확인할 것: `GET https://vibe-app-omega.vercel.app/api/morning-signal` → `{"days":[]}`(회사망 밖에서 확인한다). 이 응답으로 함수 배포와 Supabase 연결이 함께 확인된다.
  5. 다른 계정에서 `docs/morning-signal/routines/README.md` 순서대로 등록하고 평일에 시험 운행한다.
