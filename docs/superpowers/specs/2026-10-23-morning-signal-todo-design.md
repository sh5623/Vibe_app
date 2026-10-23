# Morning Signal TO-DO 탭 설계

- 작성일: 2026-10-23
- 상태: 사용자 승인 대기
- 대상: `sh5623/Vibe_app`의 `/morning-signal`(설계 [`2026-10-23-morning-signal-design.md`](./2026-10-23-morning-signal-design.md))
- 승인된 시안(직접 열어서 눌러 볼 수 있는 HTML):
  - PIN 화면: [`docs/morning-signal/todo-mockups/pin-gate.html`](../../morning-signal/todo-mockups/pin-gate.html) — 시연 PIN `1234`
  - 목록: [`docs/morning-signal/todo-mockups/todo-list.html`](../../morning-signal/todo-mockups/todo-list.html)
  - 두 파일은 **화면과 모션의 정답지**다. 코드는 그대로 옮기지 않는다(시연용 하드코딩·`data-choice` 버튼이 들어 있다).

## 1. 왜 만드나

사용자는 아침마다 휴대폰으로 `/morning-signal` 뉴스를 본다. 같은 화면에서 **일상 할 일**도 적고 관리하고 싶어 한다. 사용자가 든 예는 다음과 같다.
- 아기 문화센터 예약 — 예약 오픈 시간이 있어서 **날짜·시간**이 필요하다.
- 식재료 사기, 약속, 결혼식 참석

혼자 쓰는 목록이다. 그런데 `/morning-signal`은 로그인 없는 공개 주소라서, **들어가기 전에 사용자가 정한 PIN 4자리**를 확인한다.

**성공 기준**
- 휴대폰에서 `/morning-signal` → TO-DO로 넘어가면 PIN 화면이 뜬다. PIN이 맞으면 시안처럼 모션과 함께 목록이 열린다.
- ＋로 제목 한 줄만 적어도 할 일이 생긴다. 필요하면 내용·링크·날짜·시간·사진/파일을 붙인다.
- 맨 위 「남은 일」에 끝나지 않은 일(TODO·IN PROGRESS)이 모여 보인다. 아래로는 추가한 날짜별 기록이 무한 스크롤로 이어진다.
- 원을 눌러 TODO / IN PROGRESS / DONE을 고르면 색·모양이 바로 바뀐다.

## 2. 목표 · 비목표 · 반목표

**목표**
1. `/morning-signal`에 「뉴스 | TO-DO」 전환을 두고, TO-DO 화면을 만든다.
2. TO-DO 진입 전 PIN 4자리 잠금 화면(시안 D)을 만든다. PIN은 서버에서만 확인한다.
3. 할 일 만들기·보기·상태 변경·수정·삭제를 만든다. 첨부(사진·PDF)도 포함한다.
4. Supabase 테이블·Storage 버킷 생성 SQL과 설정 안내를 레포에 둔다.

**비목표** (이번에 만들지 않는다)
- 알림·푸시·리마인더, 반복 일정, 캘린더 연동
- 우선순위·태그·프로젝트·하위 할 일, 드래그로 순서 바꾸기
- 여러 사용자·공유, 계정 로그인
- 오프라인 동작, 검색
- 홈 화면 앱(웹 매니페스트·아이콘·standalone). 홈 화면에는 **브라우저 바로가기**로만 꽂는다(§4-3)
- 슬랙 연동. 사용자의 "슬랙으로 받는 거처럼 탭으로"는 **화면에 탭을 하나 더 둔다**는 뜻이다.

**반목표** (돌아가더라도 이렇게 되면 실패다)
- **UI가 복잡해지는 것.** 사용자는 카드·테두리·태그 상자가 가득한 1차 시안을 "너무 복잡하다, 남은 일이 넘쳐 보인다"고 되돌렸다. v2 시안의 덜어낸 밀도를 지킨다.
- PIN 값이 프론트 번들, 레포, 응답 본문, 로그에 남는 것
- 뉴스 보기가 PIN 뒤로 숨는 것. 뉴스는 지금처럼 공개다.
- 첨부 파일이 공개 URL로 열리는 것
- 기존 뉴스 화면·API(`api/morning-signal.ts`)의 동작이 바뀌는 것

## 3. 사용자가 정한 것

| 항목 | 결정 |
|---|---|
| 쓰는 사람 | 사용자 혼자, 주로 휴대폰 |
| 잠금 | 공개 주소이니 진입 전 **사용자가 정한 PIN 4자리**가 맞을 때만 들어간다 |
| 잠금 유지 | 한 번 풀면 **하루** 유지 |
| PIN 화면 | **시안 D** — 사용자가 보낸 인스타 릴스(`OTP Animation V15 — Smooth & Modern UI`)를 재현한 것 (§6.1) |
| 만들기 | 「만들기」 버튼으로 제목·내용·링크·첨부파일 등 간단한 내용을 넣는다. 날짜·시간도 넣을 수 있다(문화센터 예약 예) |
| 상태 | **TODO · IN PROGRESS · DONE**을 영어로 표기한다. 골라서 바꾸고, 상태마다 UI·색이 달라진다 |
| 목록 | 무한 스크롤. **처음 20개, 그 뒤 20개씩** |
| 날짜 묶음 | 뉴스처럼 날짜별로 보여 준다. 기준은 **추가한 날** |
| 남은 일 | 맨 위에 TODO·IN PROGRESS를 **따로 모아** 보여 준다. 다른 날짜에 추가한 일도 끝날 때까지 여기 나온다. 날짜 목록과 **잘 구분**되어야 한다 |
| 남은 일 모양 | **세로 묶음**(가로 카드 아님) |
| 밀도 | v2 시안(줄 목록)을 "지금 좋다"로 승인 |

## 4. 내 판단 (사용자가 따로 정하지 않은 것)

설명할 때 사용자에게 *(추측)*으로 보여 줬고 반대가 없었던 것과, 이 문서에서 처음 정한 것이다.

1. **잠금은 TO-DO에만** 건다. 뉴스는 공개 그대로다.
2. **「뉴스 | TO-DO」 전환은 헤더**에 둔다. 기존 AI·시사·GitHub 탭은 날짜별 뉴스에 묶여 있는데, 할 일은 날짜와 상관없이 남아야 하므로 그 탭들 옆에 두지 않는다. 레퍼런스 대시보드에 있던 뉴스/개발 보기 전환(`.vsw`)과 같은 자리·모양이다(웹판에서는 개발 탭과 함께 뺐던 것).
3. TO-DO는 **자기 주소 `/morning-signal/todo`**를 갖는다. 휴대폰 홈 화면에 바로 꽂아 둘 수 있게 하기 위해서다. 뉴스는 지금처럼 `/morning-signal#YYYY-MM-DD`를 쓴다.
4. 잠금 유지 기간은 사용자가 **하루**로 정했다(§3). 하루는 잠금을 푼 때부터 24시간이다(자정 기준 아님). 그 전에도 헤더의 자물쇠 버튼(「다시 잠그기」)으로 직접 잠글 수 있다.
5. **5번 연속으로 틀리면 10분 동안 막는다.** 4자리는 경우의 수가 1만 개뿐이라 막지 않으면 무차별 대입에 금방 뚫린다.
6. **PIN을 바꾸면 기존 잠금 해제가 모두 풀린다** (§5.4).
7. 「남은 일」은 **처음 3개만** 보이고 나머지는 「N개 더 보기」로 접는다. 순서는 IN PROGRESS → TODO이고, 각 묶음 안에서는 **마감이 가까운 것 → 먼저 추가한 것** 순이다. 마감이 없는 일은 뒤로 간다.
8. 날짜 묶음 안에서는 **최근에 추가한 것이 위**다. DONE도 날짜 목록에는 계속 남는다(완료 기록).
9. **수정·삭제**는 상세 시트에서 한다. 삭제는 한 번 더 확인한다. 삭제하면 첨부 파일도 함께 지운다.
10. **첨부**: 사진(`image/*`)과 PDF, 파일당 10MB, 할 일당 5개까지. Supabase Storage의 **비공개 버킷**에 둔다. 브라우저가 서버에서 받은 **서명된 업로드 주소**로 Storage에 직접 올린다(§5.3) — Vercel 함수는 요청 본문이 4.5MB를 넘으면 받지 못하기 때문이다.
11. **마감 강조**: DONE이 아니고 마감까지 3일 이하(지난 것 포함)이면 날짜 글자만 빨갛게 한다.
12. 날짜 계산(「추가한 날」, 「오늘·어제」, 마감 남은 날)은 모두 **KST** 기준이다. 서버에 이미 `kstToday`가 있다.
13. 상태 바꾸기는 **즉시 화면에 반영**하고(낙관적 갱신), 서버가 실패하면 되돌리고 짧게 알린다.
14. **화면 껍데기는 뉴스와 같다.** TO-DO와 PIN 화면 모두 뉴스 화면의 배경(오로라·격자), 헤더(로고·`Morning Signal`·테마 버튼)를 그대로 쓴다. 두 시안은 휴대폰 틀 안을 단순하게 그린 것이라 헤더가 줄어 있다. 시안이 정답인 범위는 **헤더 아래 본문**(PIN 카드와 모션, 목록·시트)이다. 헤더에서 TO-DO 화면과 PIN 화면은 **날짜 이동과 갱신 스탬프를 숨기고** 그 자리에 자물쇠(다시 잠그기) 버튼을 둔다. PIN 화면에서는 자물쇠 버튼도 숨긴다. PIN 시안의 보라·분홍 그라데이션 배경은 쓰지 않고, 카드 색·모션만 가져온다.
15. **「뉴스 | TO-DO」 전환은 두 화면 모두 같은 모양**이다. 레퍼런스 `.vsw`처럼 고른 쪽이 채워지는 알약 세그먼트로 한다. v2 시안의 글자 두 개는 틀이 좁아서 줄인 표현이다. 이 전환은 **PIN 화면에도 보인다** — 잠금을 못 풀어도 뉴스로 돌아갈 수 있어야 한다. 위치는 헤더 안에서, 폭 375px 휴대폰에서도 첫 줄에 보이게 둔다. 뉴스 화면의 640px 이하 날짜 이동 줄바꿈 규칙은 바꾸지 않는다.
16. 날짜 머리글의 「완료 수/전체 수」는 **페이지 경계와 상관없이 정확**하게 보인다. `list` 응답이 그 페이지에 나온 날짜들의 집계를 함께 준다(§5.3 `dayCounts`).
17. TO-DO·PIN 화면은 검색에 걸리지 않게 `noindex`를 둔다(`/ahram`과 같은 방식).

## 5. 데이터와 API

### 5.1 Supabase

같은 프로젝트(/ahram·/morning-signal이 쓰는 것)에 둔다. SQL은 `docs/morning-signal/todo-schema.sql`.

```sql
create table if not exists public.ms_todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 4000),
  link text check (link is null or char_length(link) <= 2000),
  due_date date,
  due_time time,                      -- due_date 없이 시간만 있을 수 없다
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  attachments jsonb not null default '[]'::jsonb,  -- [{ path, name, type, size }]
  created_date date not null,         -- KST 「추가한 날」(날짜 묶음 기준)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz,
  check (due_time is null or due_date is not null)
);
create index if not exists ms_todos_created on public.ms_todos (created_at desc, id desc);
create index if not exists ms_todos_open on public.ms_todos (status) where status <> 'done';

-- 잠금 시도 횟수(행 하나)
create table if not exists public.ms_todo_auth (
  id smallint primary key default 1 check (id = 1),
  fails integer not null default 0,
  locked_until timestamptz
);

insert into public.ms_todo_auth (id) values (1) on conflict do nothing;

alter table public.ms_todos enable row level security;
alter table public.ms_todo_auth enable row level security;
-- 정책을 두지 않는다: 서비스 롤 키(서버)만 접근한다.
grant select, insert, update, delete on public.ms_todos, public.ms_todo_auth to service_role;

-- 비공개 첨부 버킷
insert into storage.buckets (id, name, public) values ('ms-todo', 'ms-todo', false) on conflict (id) do nothing;
```

- 틀린 횟수 올리기와 잠금 걸기는 동시 요청에도 어긋나지 않게 **한 번의 원자적 연산**으로 한다(RPC 함수를 SQL 파일에 함께 두는 방식 권장 — 함수 모양은 빌더 몫).

- 상태 값은 DB에서 `todo`·`in_progress`·`done`, 화면 표기는 `TODO`·`IN PROGRESS`·`DONE`이다.
- Storage 버킷: `ms-todo`, **비공개**, 버킷 자체에 `file_size_limit = 10485760`·`allowed_mime_types = {image/*, application/pdf}`를 건다(서명 업로드 주소는 크기를 강제하지 않으므로 버킷이 마지막 방어선이다). 경로는 `todos/{업로드마다 새 uuid}/{안전한 파일명}`이다 — 할 일 id와 무관하게 만들어서, 만들기 전에 올려도 옮길 필요가 없다.

### 5.2 잠금(PIN)

- PIN은 Vercel 환경변수 `MS_TODO_PIN`(숫자 4자리)에만 둔다.
- 잠금 해제 쿠키에 서명하는 비밀값은 `MS_TODO_SECRET`(32바이트 이상 임의값)이다.
- 맞으면 쿠키 `ms_todo`를 준다: `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400`(24시간). 쿠키 안의 만료 시각도 같은 24시간으로 서명하고, 서버는 쿠키 수명이 아니라 **서명된 만료 시각**으로 판정한다.
- 쿠키 값은 `{만료 시각}.{서명}`이다. 서명은 HMAC-SHA256이고, 키는 `HMAC(MS_TODO_SECRET, MS_TODO_PIN)`이다. 그래서 PIN을 바꾸면 기존 쿠키가 전부 무효가 된다(§4-6).
- PIN과 서명은 `timingSafeEqual`로 비교한다(기존 `isAuthorized`와 같은 방식).
- 틀리면 `ms_todo_auth.fails`를 1 올린다. 5가 되면 `locked_until = now() + 10분`을 걸고 `fails`를 0으로 되돌린다. 맞으면 `fails`를 0으로 만든다.
- 잠금 중에는 PIN이 맞아도 거절한다(그래야 무차별 대입이 막힌다).

### 5.3 API 계약 — `api/morning-signal-todo.ts` 한 파일

기존 `api/morning-signal.ts`처럼 자기완결 단일 파일로 만든다(Supabase는 `fetch`로 REST 호출, 검증은 zod). **잠금 관련 경로를 뺀 모든 요청은 유효한 `ms_todo` 쿠키가 있어야** 하고, 없으면 `401 {error:'LOCKED_SESSION'}`를 준다. 응답은 항상 `Cache-Control: no-store`다.

| 요청 | 하는 일 | 응답 |
|---|---|---|
| `GET ?op=session` | 쿠키가 유효한지, 지금 막혀 있는지 확인 | `{unlocked: boolean, lockedUntil: string\|null}` |
| `POST ?op=unlock` `{pin}` | PIN 확인 | 200 `{ok:true}` + 쿠키 · 401 `{error:'WRONG_PIN', left}` · 429 `{error:'TOO_MANY', until}` · 503 `{error:'TODO_NOT_CONFIGURED'}`(환경변수 없음) |
| `POST ?op=lock` | 쿠키 삭제 | `{ok:true}` |
| `GET ?op=list[&cursor=…]` | 첫 요청은 `pending`(끝나지 않은 일 전부)과 최근 20개를 준다. 다음 요청은 `cursor` 뒤 20개만 준다. 둘 다 이 페이지에 나온 날짜들의 하루 전체 집계를 함께 준다 | `{pending?: Todo[], items: Todo[], nextCursor: string\|null, dayCounts: {[date]: {done, total}}}` |
| `GET ?op=get&id=` | 상세. 첨부마다 서명된 보기 주소(1시간)를 붙인다 | `{todo: Todo & {attachments: [{…, url}]}}` |
| `POST ?op=create` | 만들기. `status`는 항상 `todo`, `created_date`는 서버가 KST로 채운다 | `{todo}` |
| `PATCH ?op=update&id=` | 상태·제목·내용·링크·날짜·시간·첨부 목록 수정. `done`이 되면 `done_at` 기록, 벗어나면 비운다 | `{todo}` |
| `DELETE ?op=delete&id=` | 할 일과 첨부 파일 삭제 | `{ok:true}` |
| `POST ?op=upload-url` `{name, type, size}` | 형식·크기 검사 후 Storage 서명 업로드 주소 발급 | `{path, uploadUrl}` |

- **페이지 넘기기**는 `created_at desc, id desc` 기준 키셋이다. `cursor`는 마지막 항목의 `(created_at, id)`를 인코딩한 값이다. 처음 20개, 그 뒤 20개씩이다(§3).
- `pending`은 개수가 적으니(사용자: "20~30개씩 쌓이진 않을 것") 페이지 없이 한 번에 준다.
- `link`는 `http(s)://`만 받는다. 스킴 없이 들어오면 `https://`를 붙인다. `javascript:` 같은 다른 스킴은 거절한다.
- 업로드 순서: ① `upload-url`로 주소를 받는다 → ② 브라우저가 그 주소로 파일을 `PUT`한다 → ③ `create`나 `update`에 `{path, name, type, size}`를 넣어 보낸다. 서버는 `path`가 `todos/{uuid}/{파일명}` 모양인지 확인한다. `update`에서 첨부 목록에서 빠진 경로는 DB 갱신 뒤 Storage에서 지운다.
- 오류 응답 본문에는 Supabase 원문을 넣지 않는다(기존 파일과 같은 규칙 — 서버 로그에만 남긴다).

### 5.4 비밀값·환경변수

| 이름 | 어디 | 값 |
|---|---|---|
| `MS_TODO_PIN` | Vercel (Production·Preview) | 사용자가 정한 숫자 4자리 |
| `MS_TODO_SECRET` | Vercel (Production·Preview) | `openssl rand -hex 32` |
| `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` | Vercel | 이미 있음 |

이 레포는 공개라서 값은 어디에도 적지 않는다. 설정 순서는 **`docs/morning-signal/todo-setup.md`**(실제 장비에서 할 일 체크리스트 — 사용자 요청, `README.md` 형식을 따른다)에 두고 `README.md`에서 링크한다. CLAUDE.md 「환경 변수」에도 두 이름을 더한다.

## 6. 화면

공통: 기존 `/morning-signal`의 라이트/다크 테마(`html[data-ms-theme]`, `ms-theme` 저장값)와 테마 버튼을 그대로 쓴다. 두 시안 모두 라이트·다크 버튼으로 양쪽을 볼 수 있다. `prefers-reduced-motion`이면 모션을 끈다. 화면 껍데기(배경·헤더)는 뉴스와 같고, 시안은 헤더 아래 본문의 정답지다(§4-14·15).

### 6.1 PIN 화면 — 시안 D (`pin-gate.html`)

카드 하나에 자물쇠, 제목, 4칸, 버튼이 있다. 휴대폰 **기본 숫자 키패드**로 입력하고, 화면에 키패드를 따로 그리지 않는다(`inputMode="numeric"`). 붙여넣기도 된다. 숫자는 잠깐 보였다가 점으로 가려지고, 눈 아이콘으로 다시 볼 수 있다.

릴스를 0.1초 단위로 뜯어 본 모션이고, 시안에 같은 타이밍으로 구현돼 있다.

| 순간 | 모션 |
|---|---|
| 숫자 입력 | 칸 안에서 다른 숫자 3개가 슬롯머신처럼 굴러가다 멈춘다(~0.4s). 멈출 때 칸 주위로 점 8개가 튀고, 칸이 살짝 커졌다 돌아온다 |
| 진행 | 버튼이 입력한 칸 수만큼 왼쪽부터 차오른다. 버튼 글자색도 채워진 경계에서 흰색/회색으로 갈린다. 자물쇠 둘레 링도 같은 비율로 그려진다. 지금 입력할 칸은 테두리 강조와 깜빡이는 커서를 보인다 |
| 확인 중 | 4칸이 차면 버튼이 「확인 중」 스피너로 바뀌고 링이 돈다 |
| 성공 | 칸이 왼쪽부터 90ms 간격으로 초록이 되며 살짝 떠오른다. 자물쇠는 초록 원으로 채워지며 체크로 바뀌고 파동이 퍼진다. 제목은 글자마다 흐림이 걷히며 「확인됐어요」로 바뀌고, 버튼은 초록 「열기 →」가 된다. ~1.3s 뒤 카드가 흐려지며 빠지고 목록이 올라온다 |
| 실패 | 링·칸이 빨갛게 된다. 숫자가 아래로 찌그러졌다 펴진 뒤 칸 줄 전체가 좌우로 흔들리고(자물쇠도 함께), 오류 문구 「PIN이 맞지 않아요. 다시 입력해 주세요.」가 내려온다. 안드로이드는 진동(`navigator.vibrate`)도 준다 |
| 되돌리기 | ~1.1s 뒤 숫자가 왼쪽부터 70ms 간격으로 아래로 떨어지며 사라지고, 버튼 막대가 비워지고, 첫 칸에 커서가 돌아온다. 오류 문구는 다음 입력을 시작하면 사라진다 |
| 막힘(429) | 칸을 비활성화하고 「10분 뒤에 다시 시도해 주세요」와 남은 시간을 보여 준다(시안에 없음 — 같은 빨강 톤으로) |

### 6.2 목록 — 시안 v2 (`todo-list.html`)

**밀도 원칙(반목표의 기준)**: 카드 대신 **줄 목록**이고, 줄 사이는 얇은 선이다. 줄마다 테두리·그림자·배경 상자를 두지 않는다. 한 줄에는 제목과 작은 정보 한 줄만 둔다.

- **헤더**: 뉴스와 같은 헤더에 「뉴스 | TO-DO」 알약 전환과 자물쇠(다시 잠그기)를 둔다. 날짜 이동·갱신 스탬프는 숨긴다(§4-14·15).
- **남은 일**: 「남은 일 N」 제목 + **옅은 면 하나**(테두리 없음). 안에 `IN PROGRESS`·`TODO` 소제목(영문, 상태색)과 줄들이 있다. 처음 3개만 보이고 「N개 더 보기 / 접기」가 있다. 남은 일이 없으면 「남은 일이 없어요」를 보여 준다. 여기서는 소제목이 상태를 말하므로 줄 끝 영문 표기를 생략한다.
- **날짜 목록**: 머리글은 「오늘 · 10월 23일 금요일」, 「어제 · …」, 그 이전은 「10월 20일 화요일」이고, 오른쪽에 「완료 수/전체 수」를 둔다. 줄 끝에는 영문 상태를 작은 글자로 표기한다. 맨 아래에 닿으면 다음 20개를 불러오고(스피너), 끝이면 「처음 기록까지 다 봤어요」를 보여 준다.
- **줄**: 맨 앞에 상태 원, 제목, 작은 정보 한 줄(마감 날짜·시간, 메모·링크·첨부가 있으면 작은 아이콘)이 있다. 마감이 임박하면 날짜 글자만 빨갛게 한다.
- **상태 표현**

  | 상태 | 원 | 색 | 그 밖 |
  |---|---|---|---|
  | TODO | 빈 원 | 파랑 | — |
  | IN PROGRESS | 반 찬 원 | 주황 | — |
  | DONE | 초록으로 채워지며 체크가 그려짐 | 초록 | 제목에 취소선이 왼쪽부터 그어지고 흐려진다. 「남은 일」에서는 ~0.7s 뒤 접히며 빠진다 |

- **원을 누르면** 아래에서 상태 고르기 시트(TODO / IN PROGRESS / DONE, 현재 표시)가 올라온다.
- **줄을 누르면** 상세 시트가 열린다: 제목, 상태 3단 전환(고른 쪽이 상태색으로 채워짐), 날짜·링크·첨부 미리보기·추가한 날, 메모. 여기에 **수정·삭제**를 더한다(시안에 없음 — 같은 밀도로).
- **＋ (오른쪽 아래 떠 있는 원형 버튼)**: 만들기 시트가 올라온다. 큰 제목 입력 한 줄과 메모 칸이 있고, 「📅 날짜」·「🔗 링크」·「📎 첨부」 알약 버튼을 누르면 그 칸만 펼쳐진다(Todoist 빠른 추가 방식). 제목이 있어야 「추가」가 켜진다. 추가하면 맨 위로 스크롤하고 새 줄이 「남은 일」과 「오늘」에 올라오는 모션을 준다.

### 6.3 참고한 레퍼런스

- Things 3: 줄 목록과 여백. 정보는 작은 표시로만 두고 자세한 건 눌러서 본다. 완료 기록을 남긴다(Logbook).
- Apple 미리 알림·Todoist: 맨 앞 원 = 상태이자 버튼. 마감은 날짜 글자색으로만 강조한다.
- 상태 아이콘 관례(빈 원 → 반 찬 원 → 체크). 색만으로 구분하지 않도록 모양과 영문 표기를 함께 쓴다.
- `input-otp`(guilhermerodz): 보이지 않는 입력칸 하나 + 직접 그린 칸. 접근성과 붙여넣기가 산다.

## 7. 구조

- 라우트 `app/routes.ts`에 `morning-signal/todo`를 추가한다. 뉴스 라우트와 헤더·테마·배경(오로라·격자)을 함께 쓴다(공통 레이아웃 라우트로 묶을지, 헤더를 나눠 쓸지는 빌더 몫). 뉴스 화면의 겉보기·동작은 전환 하나가 더해지는 것 말고는 바뀌지 않아야 한다.
- 화면 컴포넌트는 `app/routes/morning-signal/` 아래에 둔다(기존 관례). 데이터 훅은 `app/hooks/use-morning-signal-todo.ts`(TanStack Query — 목록은 `useInfiniteQuery`).
- API `api/morning-signal-todo.ts` + 테스트 `api/morning-signal-todo.test.ts`(기존 `api/morning-signal.test.ts` 방식)
- SQL `docs/morning-signal/todo-schema.sql`, 설정 안내 `docs/morning-signal/todo-setup.md`(README에서 링크)
- **복잡도 예산 오버라이드**(CLAUDE.md 「feature spec 명시 시 오버라이드」): 신규 파일은 위 목록만큼(약 12개) 허용한다. **신규 의존성은 0개 그대로**다 — `input-otp`·`@supabase/supabase-js`를 추가하지 않는다(PIN 입력은 숨은 입력칸을 직접 만들고, Supabase는 REST `fetch`).
- CLAUDE.md의 라우트 표·디렉터리 구조와 README의 「페이지 구성」을 **같은 커밋**에서 갱신한다(레포 규칙).

## 8. 검증

- API 단위 테스트: 잠금(맞음·틀림·5회 후 429·잠금 중 맞는 PIN 거절·PIN 변경 시 쿠키 무효), 쿠키 없는 요청 401, 목록 첫 페이지 `pending` + 20개, 커서 이어 받기, 상태 `done` ↔ `done_at`, 링크 스킴 거절, 업로드 형식·크기 거절.
- E2E(Playwright, 휴대폰 크기): PIN 실패 → 성공 → 목록, 만들기 → 「남은 일」·「오늘」에 나타남, 상태 DONE → 「남은 일」에서 빠지고 날짜 목록에 취소선, 무한 스크롤로 21번째 항목. API는 가로채서 가짜로 둔다.
- 화면은 시안 HTML과 나란히 열어 라이트·다크 모두 눈으로 비교한다.
- 실제 배포 확인은 회사 와이파이 밖에서 한다(사내망이 `*.vercel.app`을 막는다).

## 9. 사용자가 할 일 (구현 후)

1. Supabase SQL Editor에서 `todo-schema.sql`을 실행하고, Storage에 비공개 버킷 `ms-todo`를 만든다.
2. Vercel에 `MS_TODO_PIN`·`MS_TODO_SECRET`을 넣고 재배포한다.
3. 휴대폰에서 `/morning-signal/todo`를 열어 PIN·만들기·첨부를 한 번씩 해 본다.

## 10. 알려진 한계

- 잠금은 사용자 한 명 기준의 **전역** 카운터다. 누군가 일부러 5번 틀리면 사용자도 10분 동안 못 들어간다. 혼자 쓰는 앱이라 받아들인다.
- PIN 4자리는 강한 보안이 아니다. 시도 제한으로 무차별 대입만 막는다. 민감한 정보(비밀번호·계좌)는 적지 않는 용도다.
- 첨부는 할 일을 지우거나 수정에서 뺄 때만 지운다. 업로드만 하고 만들기를 취소한 파일은 Storage에 남을 수 있다 — 정리는 이번 범위 밖이다.
- 사내망에서는 `*.vercel.app`이 막혀 열리지 않는다.

## 11. 빌더에게 맡기는 것

- 컴포넌트 나누기, 뉴스·TO-DO 공통 껍데기 구성
- 모션 구현 도구: framer-motion(이미 설치됨) 또는 Web Animations 중 편한 쪽(시안 타이밍이 기준이다)
- 시안 색을 기존 토큰(`--s-ai`·`--ok` 등)에 맞출지 새 토큰을 둘지. 겉보기는 시안과 같아야 한다.
- 상세 시트의 수정 UI 모양(같은 밀도 원칙 안에서)
- 커서 인코딩 형식, zod 스키마 세부, 업로드 파일명 정리 규칙
