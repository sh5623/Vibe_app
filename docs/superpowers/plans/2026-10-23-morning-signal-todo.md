# Morning Signal TO-DO 탭 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/morning-signal`에 PIN 4자리로 잠긴 TO-DO 화면(`/morning-signal/todo`)을 더한다. 할 일 만들기·상태 변경·수정·삭제·첨부, 맨 위 「남은 일」과 추가한 날짜별 무한 스크롤 목록을 만든다.

**Architecture**
- 서버: 자기완결 단일 파일 `api/morning-signal-todo.ts`. `?op=`로 경로를 나눈다. Supabase REST(PostgREST·Storage)를 `fetch`로 부르고, 잠금은 HMAC 서명 쿠키(24시간)로 한다.
- 클라이언트: 새 라우트가 뉴스와 같은 껍데기(`Shell`)·헤더를 쓴다. 데이터는 TanStack Query 훅 한 파일, 화면 계산은 순수 함수 파일(`todo-model.ts`)에 둔다. 모션은 시안 HTML의 타이밍을 Web Animations/CSS로 옮긴다.
- 첨부는 서버가 발급한 서명 업로드 주소로 브라우저가 Storage에 직접 `PUT`한다.

**Tech Stack:** React Router 7.18 SPA, React 19, TypeScript 6 strict, Zod 4, TanStack Query 5, Vitest 4, Playwright 1.61, Supabase REST, Vercel Functions(Node).

**Spec:** `docs/superpowers/specs/2026-10-23-morning-signal-todo-design.md` (먼저 끝까지 읽는다)

**화면 정답지:** `docs/morning-signal/todo-mockups/pin-gate.html`(PIN, 시연 PIN `1234`) · `todo-list.html`(목록). 브라우저로 열어 눌러 본 뒤 구현한다. 시안이 정답인 범위는 **헤더 아래 본문**이다(스펙 §4-14).

## Global Constraints

- pnpm만 쓴다. **신규 의존성 0개**(`input-otp`·`@supabase/supabase-js` 금지). 신규 파일 예산은 스펙 §7이 오버라이드했다.
- **RR7 SPA**: 서버 `loader`·`action` 금지. 라우트 모듈은 `meta`와 default component만 export한다. `react-router-dom` import 금지(`react-router`만).
- **TS strict**: `any`·`!`·`React.FC`·`forwardRef` 금지, `noUncheckedIndexedAccess`. **Zod 4** 최상위 함수. **TanStack v5**: `isPending`을 쓰고 `useQuery`에 `onSuccess`를 쓰지 않는다.
- **API 파일은 자기완결**: 상대 import·`@/` 별칭 금지(Vercel ESM 런타임). 필요한 헬퍼(`readBody`·`json`·`supabaseHeaders`·`kstToday`)는 `api/morning-signal.ts`에서 **복사**해 온다. 클라이언트는 API 파일의 **타입만** `import type`으로 가져온다.
- **환경변수**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MS_TODO_PIN`(숫자 4자리), `MS_TODO_SECRET`(32자 이상).
- **고정 값**: 쿠키 이름 `ms_todo`, 속성 `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400` · 세션 24시간 · 최대 실패 5회 → 잠금 10분 · 페이지 20개 · 「남은 일」 처음 3개 · 마감 강조 3일 이하 · 첨부 `image/*`·`application/pdf`, 파일당 10485760 bytes, 할 일당 5개 · 서명 보기 주소 3600초 · 버킷 `ms-todo` · 본문 상한 262144 bytes · 제목 1–200자, 내용 ≤4000자, 링크 ≤2000자.
- **DB 상태 값** `todo`·`in_progress`·`done` ↔ **화면 표기** `TODO`·`IN PROGRESS`·`DONE`.
- **날짜는 전부 KST.** `createdDate`는 서버가 `kstToday(now)`로 채운다.
- **문구(정확히 이대로)**
  - PIN: 제목 `본인 확인` → `확인됐어요` · 설명 `PIN 4자리를 입력하세요` → `TO-DO를 열고 있어요` · 버튼 `확인` / `확인 중` / `열기 →` · 오류 `PIN이 맞지 않아요. 다시 입력해 주세요.` · 막힘 `10분 뒤에 다시 시도해 주세요` + `M:SS 남음` · 미설정 `PIN이 아직 설정되지 않았어요`
  - 목록: `남은 일` · `N개 더 보기` / `접기` · `남은 일이 없어요` · 날짜 `오늘`·`어제`·`10월 20일` + 보조 `10월 23일 금요일`(오늘·어제)/`화요일`(그 외) · 끝 `처음 기록까지 다 봤어요` · 완전 빈 상태 `아직 할 일이 없어요. ＋로 첫 할 일을 만들어 보세요.`
  - 만들기: 입력 자리 `할 일을 입력하세요` / `메모 (선택)` · 알약 `📅 날짜`·`🔗 링크`·`📎 첨부` · 버튼 `추가`
  - 상세: 행 이름 `날짜`·`링크`·`첨부`·`추가` · 버튼 `수정`·`삭제` · 삭제 확인 `이 할 일을 지울까요?` + `지우기`/`취소`(브라우저 `confirm` 금지 — 시트 안에서) · 실패 알림 `저장하지 못했어요. 다시 시도해 주세요.`
- **뉴스 화면 무회귀**: 기존 `e2e/morning-signal.e2e.ts`·`model.test.ts`·`api/morning-signal.test.ts`가 그대로 통과해야 한다.
- **커밋**: 사용자 전역 지침상 사용자가 허락한 경우에만 한다. 허락받으면 피처 브랜치 `feat/morning-signal-todo`에서 태스크마다 커밋하고, push·merge는 하지 않는다.

## Review Focus

1. **KST 자정 경계** — UTC 15:30(KST 00:30)에 만든 할 일은 KST 그날로 묶여야 한다 → Task 2 테스트 `create stamps KST createdDate across UTC midnight`.
2. **쓰는 도중 세션 만료**(24시간이 지나 화면을 연 채 상태를 바꿈) — 화면이 깨지지 않고 PIN 화면으로 돌아가야 한다 → Task 7 E2E `expired session returns to PIN`.
3. **첨부 업로드 실패** — 할 일이 첨부 없이 반쯤 저장되면 안 된다. 시트와 입력값이 남고 실패 알림이 떠야 한다 → Task 8 E2E `upload failure keeps sheet open`.
4. **연타·붙여넣기** — 「추가」를 두 번 눌러도 1건만 생기고, PIN에 `123456`을 붙여 넣으면 앞 4자리만 쓴다 → Task 6 E2E `paste uses first four digits`, Task 8 E2E `double tap creates one todo`.
5. **긴 제목·띄어쓰기 없는 문자열** — 375px에서 가로 스크롤 없이 줄바꿈되어야 한다 → Task 7 E2E `long title wraps without horizontal scroll`.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `docs/morning-signal/todo-schema.sql` (신규) | 테이블 2개·시드·RLS·grant·RPC `ms_todo_fail`·버킷 |
| `api/morning-signal-todo.ts` (신규) | 타입·검증·세션 서명·잠금·CRUD·첨부. 자기완결 |
| `api/morning-signal-todo.test.ts` (신규) | 위 파일 단위·핸들러 테스트 |
| `app/routes/morning-signal/Shell.tsx` (신규) | 글꼴 link·오로라·격자·`.ms .wrap` 껍데기 |
| `app/routes/morning-signal/Header.tsx` (수정) | `ViewSwitch`·`Brand` 추출, `TodoHeader` 추가 |
| `app/routes/morning-signal.tsx` (수정) | `Shell` 사용 |
| `app/routes/morning-signal-todo.tsx` (신규) | 라우트: 세션에 따라 PIN ↔ 목록 |
| `app/routes/morning-signal/todo/todo-model.ts` (+`.test.ts`) (신규) | 정렬·묶음·날짜·마감 계산(순수) |
| `app/routes/morning-signal/todo/PinGate.tsx` (신규) | 시안 D |
| `app/routes/morning-signal/todo/TodoList.tsx` (신규) | 남은 일·날짜 목록·줄·무한 스크롤 |
| `app/routes/morning-signal/todo/TodoSheets.tsx` (신규) | 시트 껍데기·상태 고르기·상세/수정/삭제·만들기 |
| `app/routes/morning-signal/todo/todo.css` (신규) | TO-DO 전용 스타일(`.ms` 아래) |
| `app/hooks/use-morning-signal-todo.ts` (신규) | 세션·잠금·목록·CRUD·업로드 훅 |
| `app/routes.ts` (수정) | `route('morning-signal/todo', 'routes/morning-signal-todo.tsx')` |
| `e2e/fixtures/mock-todo-api.ts` · `e2e/morning-signal-todo.e2e.ts` (신규) | 메모리 가짜 API + E2E |
| `docs/morning-signal/todo-setup.md` (신규) · `README.md`·`CLAUDE.md`·`docs/morning-signal/README.md` (수정) | 장비에서 할 일 체크리스트, 라우트·환경변수 표 |

---

### Task 1: 스키마 + API 잠금(세션·PIN·시도 제한)

**Files:**
- Create: `docs/morning-signal/todo-schema.sql`, `api/morning-signal-todo.ts`, `api/morning-signal-todo.test.ts`

**Interfaces:**
- Produces (export, `api/morning-signal-todo.ts`):
  - `type TodoStatus = 'todo' | 'in_progress' | 'done'`
  - `interface Attachment { path: string; name: string; type: string; size: number; url?: string }`
  - `interface Todo { id: string; title: string; body: string | null; link: string | null; dueDate: string | null; dueTime: string | null /* HH:MM */; status: TodoStatus; attachments: Attachment[]; createdDate: string; createdAt: string; updatedAt: string; doneAt: string | null }`
  - `interface SessionResponse { unlocked: boolean; lockedUntil: string | null }`
  - `const SESSION_MS = 86_400_000`, `MAX_FAILS = 5`, `LOCK_MS = 600_000`
  - `signSession(exp: number, secret: string, pin: string): string` — `"{exp}.{base64url(HMAC-SHA256(key, String(exp)))}"`, `key = HMAC-SHA256(secret, pin)`
  - `verifySession(token: string | undefined, now: number, secret: string, pin: string): boolean` — 형식·서명(`timingSafeEqual`)·`exp > now`
  - `parseCookie(header: string | undefined, name: string): string | undefined`
  - `default handler(req: VercelRequest, res: ServerResponse)` — 이 태스크에서는 `session`·`unlock`·`lock`과 「그 밖의 op는 세션 필요」 가드까지
  - 내부: `requireSession(req): boolean`(다음 태스크가 쓴다), `sb(path, init)`(Supabase REST 호출, 실패 시 `Error` throw — 기존 `sbGet`/`errorDetail` 패턴 복사)

- [ ] **Step 1: SQL 작성** — 스펙 §5.1 SQL 전체에 다음을 더한다.
  - RPC: `create or replace function public.ms_todo_fail() returns public.ms_todo_auth language sql`. `id = 1` 행에서 다음을 한 번의 `update … returning *`로 처리한다.
    - `fails + 1 >= 5`이면 `fails = 0`, `locked_until = now() + interval '10 minutes'`
    - 아니면 `fails = fails + 1`
  - `grant execute on function public.ms_todo_fail() to service_role;`
  - 버킷 insert에 `file_size_limit = 10485760`, `allowed_mime_types = array['image/*','application/pdf']`를 넣는다.
  - 파일 머리에 「여러 번 실행해도 된다」 주석을 단다(기존 `schema.sql` 관례).

- [ ] **Step 2: 실패하는 테스트 작성** (`api/morning-signal-todo.test.ts`)
  - `makeReq`·`makeRes`·`okJson`·`failJson`은 `api/morning-signal.test.ts:282-325`를 복사하고, `makeReq` 옵션에 `cookie?: string`을 더한다.
  - `beforeEach`: `vi.setSystemTime(new Date('2026-10-23T00:00:00Z'))`, env `MS_TODO_PIN='1234'`, `MS_TODO_SECRET='s'.repeat(32)`, Supabase URL·키, `fetch` stub.
  - 테스트 이름과 단언:
    - `signSession/verifySession round-trip`: `verifySession(signSession(now+1000,S,'1234'), now, S, '1234') === true`. 같은 토큰에 `now+1001` → false. PIN `'9999'`로 검증 → false. 서명 한 글자 변조 → false. `undefined`·`'abc'` → false.
    - `parseCookie finds value among others`: `parseCookie('a=1; ms_todo=x.y; b=2','ms_todo') === 'x.y'`.
    - `session without cookie is locked`: `GET ?op=session` → 200 `{unlocked:false, lockedUntil:null}`. auth 행 조회 fetch를 `[{fails:0, locked_until:null}]`로 둔다.
    - `session reports active lockout`: auth 행 `locked_until = '2026-10-23T00:05:00Z'` → `lockedUntil`이 그 값.
    - `unlock with right pin sets cookie and resets fails`: `POST ?op=unlock {pin:'1234'}` → 200 `{ok:true}`. `Set-Cookie`가 `ms_todo=`로 시작하고 `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400`을 포함한다. `ms_todo_auth?id=eq.1`에 `PATCH {fails:0, locked_until:null}`이 간다.
    - `unlock with wrong pin returns left`: RPC 응답 `{fails:2, locked_until:null}` → 401 `{error:'WRONG_PIN', left:3}`. `/rest/v1/rpc/ms_todo_fail`에 `POST`가 간다.
    - `fifth failure locks`: RPC 응답 `{fails:0, locked_until:'2026-10-23T00:10:00Z'}` → 429 `{error:'TOO_MANY', until:'2026-10-23T00:10:00.000Z'}`.
    - `right pin is refused while locked`: auth 행이 잠금 중 → 429. RPC·PATCH 호출 없음.
    - `malformed pin is 400`: `{pin:'12a4'}`·`{pin:'12345'}` → 400 `{error:'INVALID_PIN'}`. 시도 횟수 변화 없음.
    - `not configured is 503`: `MS_TODO_PIN=''` 또는 `MS_TODO_SECRET`이 32자 미만 → 503 `{error:'TODO_NOT_CONFIGURED'}`.
    - `lock clears cookie`: `POST ?op=lock` → `Set-Cookie`에 `Max-Age=0`.
    - `other ops need a session`: 쿠키 없이 `GET ?op=list` → 401 `{error:'LOCKED_SESSION'}`, fetch 호출 0.
    - `pin change invalidates sessions`: `MS_TODO_PIN='1234'`로 만든 쿠키를 들고 env를 `'5678'`로 바꾼 뒤 `GET ?op=list` → 401.
    - `responses are no-store`: 모든 응답 `Cache-Control: no-store`.
    - `unknown op or method is 405`.

- [ ] **Step 3: 실패 확인** — `pnpm vitest run api/morning-signal-todo.test.ts` → FAIL(모듈 없음).

- [ ] **Step 4: 구현** (`api/morning-signal-todo.ts`)
  - 헬퍼는 `api/morning-signal.ts`에서 복사한다(Global Constraints).
  - PIN 비교는 `timingSafeEqual(sha256(a), sha256(b))`.
  - 쿠키 `exp = Date.now() + SESSION_MS`.
  - 잠금 판정은 `locked_until`을 `Date`로 바꿔 `> now`.
  - 응답 `until`·`lockedUntil`은 ISO Z로 정규화한다(`normalizeStamp` 복사).

- [ ] **Step 5: 통과 확인** — `pnpm vitest run api/morning-signal-todo.test.ts` → PASS. `pnpm typecheck` → 오류 0.

- [ ] **Step 6: 커밋** — `feat(morning-signal-todo): 스키마·PIN 잠금 API`

---

### Task 2: API 할 일 CRUD·목록 페이지

**Files:**
- Modify: `api/morning-signal-todo.ts`, `api/morning-signal-todo.test.ts`

**Interfaces:**
- Consumes: Task 1 `requireSession`, `sb`, `Todo`
- Produces:
  - `interface ListResponse { pending?: Todo[]; items: Todo[]; nextCursor: string | null; dayCounts: Record<string, { done: number; total: number }> }`
  - `const PAGE_SIZE = 20`
  - `normalizeLink(v: string): string | null` — 앞뒤 공백 제거. 스킴이 없으면 `https://`를 붙인다. `http:`·`https:` 말고는 `null`. `URL`로 파싱 실패해도 `null`.
  - `encodeCursor(createdAt: string, id: string): string` / `decodeCursor(c: string): { createdAt: string; id: string } | null` — base64url JSON
  - `toTodo(row: TodoRow): Todo` — snake → camel. `due_time` `'10:00:00'` → `'10:00'`. 스탬프는 ISO Z.
  - op: `list`·`get`·`create`·`update`·`delete`(스펙 §5.3 표의 메서드)

- [ ] **Step 1: 실패하는 테스트 작성** — 이름과 단언:
  - `normalizeLink`: `'naver.com'` → `'https://naver.com/'`. `' https://a.b/c '` → `'https://a.b/c'`. `'javascript:alert(1)'`·`'ftp://x'`·`'http://'` → `null`.
  - `cursor round-trip`: `decodeCursor(encodeCursor('2026-10-23T01:00:00.000Z','u1'))` → 같은 값. `decodeCursor('@@')` → `null`.
  - `list first page returns pending, 20 items, cursor, dayCounts`:
    - 목록 질의 URL에 `order=created_at.desc,id.desc&limit=21`.
    - 행 21개를 주면 `items.length === 20`이고 `nextCursor === encodeCursor(20번째 createdAt, id)`.
    - pending 질의 URL에 `status=neq.done`.
    - `dayCounts` 질의는 `created_date=in.(…)`이고, 결과를 날짜별 `{done,total}`로 센다.
  - `list next page uses keyset and omits pending`:
    - `cursor`가 있으면 URL에 `or=(created_at.lt.{ts},and(created_at.eq.{ts},id.lt.{id}))`가 들어간다(인코딩된 형태로 비교).
    - 응답에 `pending` 키가 없다.
    - 행이 20개 이하이면 `nextCursor:null`.
  - `list with bad cursor is 400` → `{error:'INVALID_CURSOR'}`.
  - `create stamps KST createdDate across UTC midnight`: `setSystemTime('2026-10-22T15:30:00Z')`, `POST ?op=create {title:'장보기'}` → 보낸 행 `created_date === '2026-10-23'`, `status === 'todo'`. 응답 `{todo}`가 camelCase다.
  - `create validates`:
    - 제목이 공백뿐이거나 201자 → 400 `INVALID_PAYLOAD`
    - `dueTime:'10:00'`에 `dueDate`가 없음 → 400
    - `dueTime:'24:00'` → 400
    - `link:'javascript:x'` → 400 `{error:'INVALID_LINK'}`
    - `body:''` → 보낸 행 `body:null`
  - `update to done stamps done_at, leaving done clears it`:
    - `PATCH ?op=update&id=u1 {status:'done'}` → 보낸 본문에 `status:'done'`, `done_at`(ISO), `updated_at`.
    - `{status:'todo'}` → `done_at:null`.
  - `update with dueDate null also clears dueTime`.
  - `update rejects unknown id format` → `id`가 uuid가 아니면 400.
  - `get returns one todo or 404`.
  - `delete removes row` → `DELETE …ms_todos?id=eq.u1`. (첨부 삭제는 Task 3)
  - `supabase failure is 503 without detail` → 응답 본문에 Supabase 원문이 없다.

- [ ] **Step 2: 실패 확인** — `pnpm vitest run api/morning-signal-todo.test.ts` → 새 테스트 FAIL.

- [ ] **Step 3: 구현**
  - zod 스키마 `createSchema`·`updateSchema`(update는 create의 partial에 `status` enum을 더한다).
  - 목록은 21개를 읽어 20개만 돌려준다.
  - `dayCounts`는 이 페이지 `items`의 고유 `createdDate`만 대상으로 한 번 더 질의한다(`select=created_date,status`).
  - insert·update는 `Prefer: return=representation`으로 행을 받는다.

- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS.

- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): 할 일 CRUD·키셋 목록 API`

---

### Task 3: API 첨부(업로드 주소·보기 주소·삭제)

**Files:**
- Modify: `api/morning-signal-todo.ts`, `api/morning-signal-todo.test.ts`

**Interfaces:**
- Produces:
  - `const MAX_FILE_BYTES = 10_485_760`, `MAX_FILES = 5`, `BUCKET = 'ms-todo'`, `SIGNED_VIEW_SECONDS = 3600`
  - `safeFileName(name: string): string` — 경로 구분자·제어문자 제거, 공백은 `-`, 최대 80자. 비면 `'file'`.
  - `isAttachmentPath(p: string): boolean` — `/^todos\/[0-9a-f-]{36}\/[^/]{1,80}$/`
  - op `upload-url`(POST): `{name, type, size}` → `{path, uploadUrl}`
  - Storage REST(`SUPABASE_URL` 기준). 구현 전 `supabase/storage` 저장소의 라우트 정의로 한 번 확인한다.
    - 업로드 서명: `POST /storage/v1/object/upload/sign/ms-todo/{path}` → `{url}`(상대경로, `token` 포함). `uploadUrl = SUPABASE_URL + '/storage/v1' + url`. 클라이언트는 이 주소로 `PUT`한다.
    - 보기 서명: `POST /storage/v1/object/sign/ms-todo` `{expiresIn:3600, paths:[…]}` → `[{path, signedURL}]`
    - 삭제: `DELETE /storage/v1/object/ms-todo` `{prefixes:[…]}`

- [ ] **Step 1: 실패하는 테스트 작성** — 이름과 단언:
  - `upload-url issues signed url for allowed file`: `{name:'영수증 사진.jpg', type:'image/jpeg', size:1000}` → `path`가 `isAttachmentPath`를 통과하고 `영수증-사진.jpg`로 끝난다. `uploadUrl`이 `https://example.supabase.co/storage/v1/object/upload/sign/ms-todo/`로 시작한다.
  - `upload-url rejects type and size`: `type:'text/html'` → 400 `{error:'UNSUPPORTED_FILE'}`. `size:10485761`·`size:0` → 400 `{error:'FILE_TOO_LARGE'}`/`UNSUPPORTED_FILE`.
  - `create rejects foreign attachment paths`: `attachments:[{path:'../x', …}]` 또는 6개 → 400.
  - `get signs attachment urls`: 행에 첨부 2개 → 보기 서명 `POST` 1번(`paths` 2개)이고, 응답 각 첨부 `url`이 `https://example.supabase.co/storage/v1/object/sign/…`.
  - `update deletes removed attachments after saving`: 기존 `[a,b]` → 새 `[b]` → DB `PATCH` 성공 **뒤에** Storage `DELETE`가 `{prefixes:[a.path]}`로 간다.
  - `delete removes storage objects too`: 행 조회 → 행 `DELETE` → Storage `DELETE`. 첨부가 없으면 Storage 호출 없음.
  - `storage delete failure does not fail the request`: Storage `DELETE` 500 → 200(서버 로그만).

- [ ] **Step 2: 실패 확인** — `pnpm vitest run api/morning-signal-todo.test.ts` → FAIL.

- [ ] **Step 3: 구현** — 업로드 경로는 `todos/${crypto.randomUUID()}/${safeFileName(name)}`.

- [ ] **Step 4: 통과 확인** — PASS. `pnpm typecheck` 오류 0.

- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): 첨부 서명 업로드·보기·삭제`

---

### Task 4: 화면 계산 함수 (`todo-model.ts`)

**Files:**
- Create: `app/routes/morning-signal/todo/todo-model.ts`, `app/routes/morning-signal/todo/todo-model.test.ts`

**Interfaces:**
- Consumes: `import type { Todo, TodoStatus } from '../../../../api/morning-signal-todo'`
- Produces:
  - `STATUS_LABEL: Record<TodoStatus, 'TODO' | 'IN PROGRESS' | 'DONE'>`
  - `kstToday(now: Date): string` — 서버와 같은 규칙(KST `YYYY-MM-DD`)
  - `splitPending(todos: Todo[]): { progress: Todo[]; todo: Todo[] }` — `done` 제외. 각 묶음은 `dueDate` 오름차순(없으면 뒤) → `createdAt` 오름차순.
  - `PENDING_LIMIT = 3`
  - `groupByCreatedDate(items: Todo[]): Array<{ date: string; items: Todo[] }>` — 날짜 내림차순, 묶음 안 `createdAt` 내림차순. 같은 id가 두 페이지에 오면 한 번만.
  - `dayHeading(date: string, today: string): { name: string; sub: string }`
  - `dueText(t: Pick<Todo, 'dueDate' | 'dueTime'>): string | null` — `'10/27 (화) 10:00'`, 시간이 없으면 `'10/27 (화)'`
  - `isDueSoon(t: Todo, today: string): boolean` — `status !== 'done'` 이고 `dueDate`가 있고 `dueDate − today ≤ 3`일(지난 것 포함)

- [ ] **Step 1: 실패하는 테스트 작성** — 이름과 단언(`today = '2026-10-23'`, 금요일):
  - `splitPending orders by due then created`: progress `[due 10-25, due null 생성 10-20, due null 생성 10-22]` 순. done은 빠진다.
  - `groupByCreatedDate sorts and dedupes`
  - `dayHeading`:
    - `('2026-10-23')` → `{name:'오늘', sub:'10월 23일 금요일'}`
    - `('2026-10-22')` → `{name:'어제', sub:'10월 22일 목요일'}`
    - `('2026-10-20')` → `{name:'10월 20일', sub:'화요일'}`
  - `dueText`: `{dueDate:'2026-10-27', dueTime:'10:00'}` → `'10/27 (화) 10:00'`. 날짜가 없으면 `null`.
  - `isDueSoon`: 10-26 → true. 10-27 → false. 10-20(지남) → true. done이면 false.
  - `kstToday`: `new Date('2026-10-22T15:30:00Z')` → `'2026-10-23'`.

- [ ] **Step 2: 실패 확인** — `pnpm vitest run app/routes/morning-signal/todo/todo-model.test.ts` → FAIL.
- [ ] **Step 3: 구현** — 요일은 `['일','월','화','수','목','금','토']`. 날짜 차이는 `YYYY-MM-DD`를 UTC 자정으로 바꿔 계산한다(로컬 시간대 영향 없음).
- [ ] **Step 4: 통과 확인** — PASS.
- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): 목록 계산 함수`

---

### Task 5: 껍데기·헤더 전환·라우트·데이터 훅

**Files:**
- Create: `app/routes/morning-signal/Shell.tsx`, `app/routes/morning-signal-todo.tsx`, `app/hooks/use-morning-signal-todo.ts`, `app/routes/morning-signal/todo/todo.css`, `e2e/fixtures/mock-todo-api.ts`, `e2e/morning-signal-todo.e2e.ts`
- Modify: `app/routes/morning-signal.tsx`, `app/routes/morning-signal/Header.tsx`, `app/routes/morning-signal/morning-signal.css`, `app/routes.ts`

**Interfaces:**
- Produces:
  - `Shell({ children }: { children: ReactNode })` — 지금 `morning-signal.tsx`의 글꼴 `<link>`·`.aurora`·`.grid-bg`·`.wrap`을 옮긴 것. 뉴스 라우트도 이것을 쓴다.
  - `Header.tsx`: `ViewSwitch({ view }: { view: 'news' | 'todo' })` — `react-router`의 `Link` 두 개(`/morning-signal`, `/morning-signal/todo`, 글자 `뉴스`·`TO-DO`)를 `role="tablist"`·`aria-label="보기 전환"` 컨테이너에 넣고, 각 `Link`에 `role="tab"`, 고른 쪽에 `aria-selected` + `.on`. 스타일은 레퍼런스 `.vsw`(second-brain `.wiki-automation/dashboard/morning-signal.html:230-235`)를 `.ms` 아래로 옮긴다.
  - `TodoHeader({ onLock }: { onLock?: () => void })` — `Brand`(스탬프 없음) + `ViewSwitch view="todo"` + `onLock`이 있을 때만 자물쇠 버튼(`aria-label="다시 잠그기"`) + `ThemeButton`
  - 뉴스 `Header`는 `.top` 안 브랜드와 `.mid` 사이에 `ViewSwitch view="news"`를 둔다. 640px 이하에서 `.mid`의 둘째 줄 규칙은 그대로 둔다. 첫 줄(브랜드·전환·테마)이 375px에서 넘치지 않게, 그 폭에서만 브랜드 글자를 줄이거나 말줄임한다.
  - `use-morning-signal-todo.ts`:
    - `todoKeys = { session: ['ms','todo','session'], list: ['ms','todo','list'], detail: (id: string) => ['ms','todo','detail', id] }`
    - `class TodoApiError extends Error { constructor(status: number, code: string, body?: unknown) }` — 필드 `status`·`code`(응답 `error` 값, 없으면 `'HTTP_{status}'`)·`body`. 비 2xx 응답을 여기에 담는다. 모든 훅이 `fetch`를 `credentials: 'same-origin'`으로 부른다.
    - `useTodoSession(): UseQueryResult<SessionResponse>`
    - `useUnlock(): UseMutationResult<void, TodoApiError, string>` — 성공하면 `session`을 무효화한다.
    - `useLock(): UseMutationResult<void, TodoApiError, void>` — 성공하면 `queryClient.removeQueries({queryKey:['ms','todo']})`.
    - `useTodoList(enabled: boolean): UseInfiniteQueryResult<InfiniteData<ListResponse, string | null>>` — `initialPageParam: null`, `getNextPageParam: (p) => p.nextCursor`
    - `useTodoDetail(id: string | null)`, `useCreateTodo()`, `useUpdateTodo()`, `useDeleteTodo()` — 변경 후 `list`를 무효화한다. `useUpdateTodo`는 `status` 변경을 낙관적으로 반영하고 실패하면 되돌린다(`onMutate` 스냅샷 → `onError` 복원).
    - `uploadAttachment(file: File): Promise<Attachment>` — `upload-url` → `PUT uploadUrl`(`Content-Type: file.type`). PUT이 비 2xx이면 `TodoApiError(status, 'UPLOAD_FAILED')`.
    - 공통: 어떤 훅이든 `401 LOCKED_SESSION`을 받으면 `session`을 무효화한다(→ PIN 화면).
  - 라우트 `morning-signal-todo.tsx`: `meta` → `[{ title: 'TO-DO | Morning Signal' }, { name: 'robots', content: 'noindex, nofollow' }]`. 본문은 `<Shell><TodoHeader onLock={unlocked ? lock : undefined}/>` 다음에 세션 상태에 따라 나뉜다.
    - `isPending`: 빈 자리
    - 잠김: `<PinGate/>` 자리. 이 태스크에서는 `<section className="card state">`에 「본인 확인」만 둔다.
    - 풀림: `<TodoList/>` 자리. 이 태스크에서는 「남은 일」 제목만 둔다.
  - `e2e/fixtures/mock-todo-api.ts`: `mockTodoApi(page, opts?: { pin?: string; seed?: Todo[]; locked?: boolean })` — 메모리 상태로 스펙 §5.3 op 전부를 흉내 낸다. 쿠키 대신 메모리 플래그를 쓴다. `**/api/morning-signal-todo**`를 가로채고, 업로드용 `**/storage/v1/**`는 200으로 응답한다. **`mockApi` 다음에 등록**한다. Playwright는 나중에 등록한 route가 먼저 맞으므로, 기존 `**/api/morning-signal**` 패턴과 겹쳐도 이쪽이 이긴다. `makeTodos(n: number, today = '2026-10-23'): Todo[]`도 export한다.

- [ ] **Step 1: 실패하는 E2E 작성** (`e2e/morning-signal-todo.e2e.ts`, `test.use({ viewport: { width: 375, height: 812 } })`)
  - `news header has view switch to TO-DO`: `mockApi(page,'normal')` → `/morning-signal` → `getByRole('tab', {name:'TO-DO'})` 클릭 → URL `/morning-signal/todo`, 「본인 확인」이 보인다.
  - `todo page keeps news shell and theme`: `.aurora`·`.grid-bg`가 보이고 `html[data-ms-theme]`가 있다. 날짜 이동(`.datenav`)은 없다.
  - `switch fits first row at 375px`: `document.documentElement.scrollWidth <= 375`. 전환의 `boundingBox().y`가 테마 버튼과 같은 줄이다(±8px).
- [ ] **Step 2: 실패 확인** — `pnpm test:e2e e2e/morning-signal-todo.e2e.ts` → FAIL.
- [ ] **Step 3: 구현** — 위 Interfaces 그대로. 뉴스 `morning-signal.tsx`는 겉보기가 바뀌지 않게 `Shell`만 갈아 끼운다.
- [ ] **Step 4: 통과 확인** — `pnpm test:e2e` 전체 PASS(기존 뉴스 E2E 포함). `pnpm typecheck`·`pnpm check` 오류 0.
- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): 화면 껍데기·보기 전환·라우트·데이터 훅`

---

### Task 6: PIN 화면 (시안 D)

**Files:**
- Create: `app/routes/morning-signal/todo/PinGate.tsx`
- Modify: `app/routes/morning-signal-todo.tsx`, `app/routes/morning-signal/todo/todo.css`, `e2e/morning-signal-todo.e2e.ts`

**Interfaces:**
- Consumes: `useUnlock`, `useTodoSession`(`lockedUntil`), `TodoApiError`
- Produces: `PinGate()` — 성공하면 성공 모션(~1.3s)이 끝난 뒤 `session`을 무효화해 목록으로 넘어간다. 모션 도중에 화면이 바뀌지 않게, 무효화는 모션이 끝난 시점에 한다.

- [ ] **Step 1: 실패하는 E2E 작성** — `mockTodoApi(page, {pin:'1234'})`
  - `wrong PIN shows error then clears`: 숨은 입력칸(`getByLabel('PIN 4자리')`)에 `0000` → 「PIN이 맞지 않아요. 다시 입력해 주세요.」 → 1.5초 안에 칸 4개가 비고 첫 칸이 활성(`.slot.active` 1개)이다.
  - `right PIN unlocks to list`: `1234` → 「확인됐어요」 → 「남은 일」이 보인다.
  - `paste uses first four digits`: 입력칸에 `123456`을 `fill`하면 잠금이 풀린다.
  - `locked shows countdown`: `mockTodoApi(page,{locked:true})` → 「10분 뒤에 다시 시도해 주세요」와 `/\d+:\d{2} 남음/`이 보이고, 입력칸이 `disabled`다.
  - `not configured message`: 가짜 API가 503 `TODO_NOT_CONFIGURED`를 주면 「PIN이 아직 설정되지 않았어요」가 보인다.
  - `reduced motion still unlocks`: `page.emulateMedia({ reducedMotion: 'reduce' })` 상태에서 `1234` → 「남은 일」이 보인다.
- [ ] **Step 2: 실패 확인** — `pnpm test:e2e e2e/morning-signal-todo.e2e.ts` → 새 테스트 FAIL.
- [ ] **Step 3: 구현** — `pin-gate.html`의 마크업·CSS·타이밍을 옮긴다.
  - 숨은 입력칸: `<input aria-label="PIN 4자리" inputMode="numeric" autoComplete="off" pattern="[0-9]*">`. 숫자만 받고, 칸이나 카드를 누르면 포커스한다.
  - 모션: 숫자 굴림(420ms)과 점 8개 튐(330ms 시점), 진행 막대·링, 성공(칸 90ms 간격·파동·글자 흐림 걷힘·버튼 초록), 실패(찌그러짐 → 240ms 뒤 흔들림·진동), 되돌리기(1150ms 뒤 70ms 간격으로 떨어짐), 숫자 가림(900ms)과 눈 버튼.
  - 시안 대비 바꾸는 것: 시연 PIN 비교를 `useUnlock`으로 바꾼다. 「시연용 PIN」 문구와 시안 오른쪽 설명 패널은 뺀다. 배경 그라데이션은 쓰지 않는다(Shell 배경을 쓴다).
  - 색은 시안 값을 쓰되 라이트·다크 모두 `html[data-ms-theme]` 아래에서 정의한다.
- [ ] **Step 4: 통과 확인** — E2E PASS. 라이트·다크에서 `pin-gate.html`과 나란히 열어 눈으로 비교한다.
- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): PIN 잠금 화면(시안 D)`

---

### Task 7: 목록 (남은 일·날짜별·무한 스크롤·상태 고르기)

**Files:**
- Create: `app/routes/morning-signal/todo/TodoList.tsx`, `app/routes/morning-signal/todo/TodoSheets.tsx`
- Modify: `app/routes/morning-signal-todo.tsx`, `app/routes/morning-signal/todo/todo.css`, `e2e/morning-signal-todo.e2e.ts`, `e2e/fixtures/mock-todo-api.ts`

**Interfaces:**
- Consumes: `useTodoList`, `useUpdateTodo`, Task 4 함수 전부
- Produces:
  - `TodoList({ onOpen }: { onOpen: (id: string) => void })`
  - `Sheet({ open, onClose, label, children })` — 아래에서 올라오는 시트와 어두운 배경. Escape·배경 누르면 닫힌다. `role="dialog"`·`aria-modal`·`aria-label`.
  - `StatusSheet({ todo, onPick, onClose })` — TODO / IN PROGRESS / DONE, 현재 상태에 「현재」 표시.
  - 줄 마크업은 `.row.s-{todo|progress|done}`. 원은 `button[aria-label="상태 바꾸기"]`, 끝의 영문 표기는 `.st`(「남은 일」 안에서는 숨김).

- [ ] **Step 1: 실패하는 E2E 작성** — 잠금을 푼 상태로 시작한다. 헬퍼 `unlock(page)`가 `1234`를 넣는다.
  - `pending shows progress first and collapses after 3`: seed는 progress 2·todo 3·done 2. 「남은 일 5」, 소제목 `IN PROGRESS`·`TODO`, 보이는 줄 3개, 「2개 더 보기」 → 5개, 「접기」.
  - `day groups by created date with counts`: 「오늘」·「10월 23일 금요일」·`1/3`, 「어제」, 「10월 20일」·「화요일」.
  - `status to DONE leaves pending and strikes in day list`: 「남은 일」의 첫 줄 원 → 시트 `DONE` → 「남은 일 4」. 같은 제목이 날짜 목록에서 `.row.s-done`이다.
  - `infinite scroll loads next 20`: `makeTodos(25)` → 처음 줄 수(남은 일 제외 날짜 목록)가 20 → 끝까지 스크롤 → 25 → 「처음 기록까지 다 봤어요」.
  - `due soon is red text only`: 마감 10-25인 줄의 `.due.soon`.
  - `expired session returns to PIN`: 가짜 API가 다음 `update`에 401 `LOCKED_SESSION`을 준다 → 원 → `DONE` → 「본인 확인」이 보인다.
  - `long title wraps without horizontal scroll`: 제목 `'가'.repeat(120)`과 `'x'.repeat(120)` → `scrollWidth <= 375`.
  - `lock button returns to PIN`: 헤더 「다시 잠그기」 → 「본인 확인」.
  - `empty state`: seed 0개 → 「아직 할 일이 없어요. ＋로 첫 할 일을 만들어 보세요.」
- [ ] **Step 2: 실패 확인** — FAIL.
- [ ] **Step 3: 구현** — `todo-list.html`의 줄·남은 일·날짜 머리글·로더 CSS를 옮긴다.
  - 무한 스크롤은 마지막 센티널을 `IntersectionObserver`(`rootMargin: '200px'`)로 보고 `hasNextPage && !isFetchingNextPage`일 때 `fetchNextPage`한다.
  - 페이지 `items`를 합쳐 `groupByCreatedDate`에 넘긴다. 날짜 머리글 숫자는 `dayCounts`를 합쳐서 쓴다(뒤 페이지 값이 이긴다).
  - DONE이 된 줄은 「남은 일」에서 700ms 뒤 높이를 줄이며 빠진다.
  - 제목은 `overflow-wrap: anywhere`.
- [ ] **Step 4: 통과 확인** — E2E PASS. 라이트·다크에서 `todo-list.html`과 비교한다(줄 목록 밀도·옅은 면 하나·테두리 없음 — 스펙 반목표).
- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): 목록·남은 일·무한 스크롤·상태 고르기`

---

### Task 8: 만들기·상세·수정·삭제·첨부

**Files:**
- Modify: `app/routes/morning-signal/todo/TodoSheets.tsx`, `app/routes/morning-signal-todo.tsx`, `app/routes/morning-signal/todo/todo.css`, `e2e/morning-signal-todo.e2e.ts`, `e2e/fixtures/mock-todo-api.ts`

**Interfaces:**
- Consumes: `useCreateTodo`, `useTodoDetail`, `useUpdateTodo`, `useDeleteTodo`, `uploadAttachment`, `Sheet`
- Produces:
  - `CreateSheet({ open, onClose })` — 폼은 `useActionState`로 만든다(레포 규칙). 첨부는 고르는 즉시 `uploadAttachment`를 부르고, 업로드가 끝나야 「추가」가 켜진다.
  - `DetailSheet({ id, onClose })` — 보기 → `수정` 모드(같은 시트에서 입력칸으로 바뀜, 저장/취소) → `삭제`(시트 안에서 확인).
  - ＋ 버튼은 `button[aria-label="할 일 만들기"]`.

- [ ] **Step 1: 실패하는 E2E 작성**
  - `create with title only appears in pending and today`: ＋ → 「할 일을 입력하세요」에 `우유 사기` → 「추가」 → 시트가 닫히고 「남은 일」과 「오늘」 둘 다에 `우유 사기`가 보인다.
  - `create with date time link`: `📅 날짜` → `2026-10-27`·`10:00`, `🔗 링크` → `culture.example.com` → 줄에 `10/27 (화) 10:00`. 상세의 링크가 `https://culture.example.com/`.
  - `create with attachment uploads via signed URL`: `📎 첨부`에 `setInputFiles`(작은 png) → `**/storage/v1/object/upload/sign/**`로 `PUT`이 1회 간다 → 「추가」 → 상세에 썸네일 1개.
  - `upload failure keeps sheet open`: storage `PUT` 500 → 「저장하지 못했어요. 다시 시도해 주세요.」. 시트가 열려 있고 제목 입력값이 남아 있다. 가짜 API의 할 일 수는 그대로다.
  - `double tap creates one todo`: 「추가」를 빠르게 두 번 누르면(`click({clickCount: 2})`) 할 일이 1건만 늘어난다.
  - `detail shows fields and changes status`: 줄 누름 → 제목·`날짜`·`링크`·`첨부`·`추가` 행이 보인다. 상태 세그먼트 `IN PROGRESS` → 시트를 닫아도 줄이 `.s-progress`다.
  - `edit title`: `수정` → 제목 변경 → 저장 → 목록에 새 제목.
  - `delete asks inside sheet`: `삭제` → 「이 할 일을 지울까요?」 → `지우기` → 줄이 사라진다. `page.on('dialog')`가 한 번도 불리지 않는다.
- [ ] **Step 2: 실패 확인** — FAIL.
- [ ] **Step 3: 구현** — `todo-list.html`의 시트·알약·상세 CSS를 옮긴다.
  - 저장 중에는 「추가」·저장 버튼을 `disabled`로 둔다(연타 방지).
  - 실패 알림은 화면 아래 짧은 토스트(3초)로 띄운다.
  - 새 할 일은 `list` 무효화 뒤 맨 위로 스크롤하고, 그 줄에 등장 모션을 준다.
- [ ] **Step 4: 통과 확인** — `pnpm test:e2e` 전체 PASS.
- [ ] **Step 5: 커밋** — `feat(morning-signal-todo): 만들기·상세·수정·삭제·첨부`

---

### Task 9: 장비에서 할 일 문서·레포 표 갱신·전체 검증

**Files:**
- Create: `docs/morning-signal/todo-setup.md`
- Modify: `docs/morning-signal/README.md`, `CLAUDE.md`, `README.md`

**Interfaces:**
- Consumes: 스펙 §5.4·§9, Task 1 SQL

- [ ] **Step 1: `todo-setup.md` 작성** — `docs/morning-signal/README.md`와 같은 형식(번호 절 + 위치·할 일·확인·문제 해결 표)으로 쓴다. 이 레포는 공개라 값은 적지 않는다.
  1. Supabase SQL Editor에서 `todo-schema.sql` 실행. 확인: 테이블 2개, RLS 켜짐, `ms_todo_auth` 행 1개, Storage 버킷 `ms-todo`(비공개·10MB·이미지/PDF), 함수 `ms_todo_fail`.
  2. 값 만들기: PIN 4자리는 사용자가 정한다. `openssl rand -hex 32`로 `MS_TODO_SECRET`을 만든다.
  3. Vercel 환경변수 `MS_TODO_PIN`·`MS_TODO_SECRET`(Production·Preview) → 재배포.
  4. 배포 확인(회사 와이파이 밖): `curl https://vibe-app-omega.vercel.app/api/morning-signal-todo?op=session` → `{"unlocked":false,"lockedUntil":null}`. 503 `TODO_NOT_CONFIGURED`면 3단계, 503 `SUPABASE_UNAVAILABLE`면 1단계를 다시 본다.
  5. 휴대폰 시험: `/morning-signal/todo` → 틀린 PIN 1회(오류 모션) → 맞는 PIN → 할 일 만들기(사진 1장 첨부) → 상태 DONE → 「다시 잠그기」.
  6. 문제 해결 표: 계속 PIN을 물음(쿠키가 저장 안 됨 — 사파리 「모든 쿠키 차단」 확인), 10분 막힘(Supabase에서 `ms_todo_auth`의 `fails`·`locked_until`을 초기화하는 SQL 한 줄), 첨부 실패(버킷 이름·MIME·10MB).
  7. PIN을 바꾸려면: Vercel 값 변경 → 재배포 → 모든 기기가 다시 잠긴다.
- [ ] **Step 2: 레포 표 갱신**
  - `CLAUDE.md`: 라우트 표에 `/morning-signal/todo`(TO-DO, PIN 잠금, noindex)·`/api/morning-signal-todo`, 디렉터리 구조에 `todo/`·`Shell.tsx`, 「환경 변수」에 `MS_TODO_PIN`·`MS_TODO_SECRET`.
  - `README.md`: 「페이지 구성」 표와 트리.
  - `docs/morning-signal/README.md`: 맨 위에 「TO-DO 탭 설정은 [`todo-setup.md`](./todo-setup.md)」 한 줄.
- [ ] **Step 3: 전체 검증** — 아래가 모두 오류 0이고 통과해야 한다. 결과를 붙여 둔다.
  - `pnpm check`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm build`
- [ ] **Step 4: 커밋** — `docs(morning-signal-todo): 장비 설정 체크리스트·라우트 표 갱신`
