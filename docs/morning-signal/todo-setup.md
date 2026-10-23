# Morning Signal TO-DO 탭 — 실제 장비에서 할 일

`feat/morning-signal-todo` 브랜치를 머지하기 전후로 위에서부터 차례로 따라 하는 체크리스트다. 이 저장소는 공개라서 **PIN·비밀값·키는 어디에도 적지 않는다.**

- 설계: [`docs/superpowers/specs/2026-10-23-morning-signal-todo-design.md`](../superpowers/specs/2026-10-23-morning-signal-todo-design.md)
- 뉴스(기존) 설정: [`README.md`](./README.md) — TO-DO는 그 설정(Supabase 프로젝트·`SUPABASE_*` 환경변수)을 그대로 쓴다.

## 1. Supabase 테이블·함수·버킷 만들기

- 위치: Supabase 대시보드 → /ahram·/morning-signal이 쓰는 같은 프로젝트 → SQL Editor
- 할 일: [`docs/morning-signal/todo-schema.sql`](./todo-schema.sql) 전체를 붙여넣어 실행한다.
- 확인:
  - Table Editor에 `ms_todos`·`ms_todo_auth`가 보이고 둘 다 RLS가 켜져 있다.
  - `ms_todo_auth`에 `id = 1`인 행이 하나 있다(`fails = 0`).
  - Database → Functions에 `ms_todo_attempt`가 있다(PIN 시도 판정·기록을 한 번에 하는 함수).
  - Storage에 버킷 `ms-todo`가 있다. **Public이 꺼져 있고**, 파일 크기 제한 10MB, 허용 형식 `image/*`·`application/pdf`다.
- 여러 번 실행해도 된다. 다만 버킷이 이미 있으면 설정을 덮어쓰지 않는다(`on conflict do nothing`). 버킷을 손으로 다르게 만들었다면 Storage 화면에서 위 값으로 맞춘다.

## 2. PIN과 비밀값 정하기

- **PIN**: 숫자 4자리. 직접 정한다. `1234`·생일처럼 쉬운 숫자는 피한다.
- **비밀값**: 터미널에서 만든다.

  ```bash
  openssl rand -hex 32
  ```

- 두 값은 3단계 Vercel에만 넣는다. 다른 곳에는 적지 않는다.

## 3. Vercel 환경변수

- 위치: Vercel → 프로젝트 → Settings → Environment Variables
- **Production과 Preview** 모두에 추가한다.

  | 이름 | 값 |
  |---|---|
  | `MS_TODO_PIN` | 2단계 PIN(숫자 4자리) |
  | `MS_TODO_SECRET` | 2단계 비밀값(64자) |

- `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`가 이미 있는지 확인한다(뉴스가 쓰고 있다).
- 환경변수는 **다음 배포부터** 적용된다. 이미 배포된 뒤에 추가했다면 재배포한다.

## 4. 배포

- 브랜치를 main에 머지하면 Vercel이 프로덕션에 배포한다(머지는 사용자가 정한다).
- 브랜치만 푸시한 상태에서는 Vercel 프리뷰 URL로 먼저 볼 수 있다. 프리뷰는 **Preview 환경변수**를 쓰므로 3단계 값이 Preview에도 있어야 한다.

## 5. 배포 확인 (회사 와이파이 밖에서)

```bash
curl -sS "https://seungho-apps.vercel.app/api/morning-signal-todo?op=session"
```

- 기대 응답: `{"unlocked":false,"lockedUntil":null}` — 함수 배포·환경변수·Supabase 연결이 함께 확인된다.
- 503 `TODO_NOT_CONFIGURED`면 3단계를 다시 본다(PIN이 숫자 4자리인지, 비밀값이 32자 이상인지).
- 503 `SUPABASE_UNAVAILABLE`면 1단계(테이블)와 3단계(`SUPABASE_*`)를 다시 본다.
- 뉴스 `https://seungho-apps.vercel.app/morning-signal`도 열어 본다. 헤더에 「뉴스 | TO-DO」 전환이 생긴 것 말고는 그대로여야 한다.

## 6. 휴대폰으로 시험하기 (필수)

`https://seungho-apps.vercel.app/morning-signal/todo`를 휴대폰으로 연다.

- [ ] PIN 화면이 뜨고, 칸을 누르면 숫자 키패드가 올라온다.
- [ ] **틀린 PIN** 1번: 칸이 빨개지며 흔들리고 「PIN이 맞지 않아요. 다시 입력해 주세요.」가 나온다(안드로이드는 진동도). 잠시 뒤 칸이 비워진다.
- [ ] **맞는 PIN**: 칸이 초록으로 바뀌고 자물쇠가 체크로 바뀐 뒤 목록이 열린다(처음엔 「아직 할 일이 없어요…」).
- [ ] 오른쪽 아래 ＋ → 제목 입력 → 「📅 날짜」로 날짜·시간 → 「📎 첨부」로 사진 1장(올라가는 동안 「추가」가 꺼져 있다) → 「추가」 → 「남은 일」과 「오늘」에 생긴다.
- [ ] 그 줄을 누르면 상세가 열리고, 사진이 보이고 눌러서 열린다.
- [ ] 줄 앞의 원을 누르고 DONE → 「남은 일」에서 접히며 빠지고, 날짜 목록에서는 취소선이 그어진다.
- [ ] 헤더 자물쇠(다시 잠그기) → PIN 화면으로 돌아간다.
- [ ] 다크 모드 버튼(헤더 오른쪽)으로 바꿔도 잘 보인다.
- [ ] 시험한 할 일은 상세 → 「삭제」 → 「지우기」로 지운다. 첨부 사진도 Storage에서 함께 지워진다.
- [ ] (선택) 사파리 공유 → 「홈 화면에 추가」로 바로가기를 둔다. 홈 화면 앱(PWA)은 아니라서 사파리로 열린다.

## 7. PIN을 바꾸려면

1. Vercel의 `MS_TODO_PIN`을 바꾸고 재배포한다.
2. PIN이 바뀌면 **모든 기기의 잠금 해제가 무효**가 된다. 새 PIN으로 다시 연다.
3. `MS_TODO_SECRET`을 바꿔도 모든 기기가 다시 잠긴다(휴대폰 분실·유출이 의심될 때 쓴다).

## 8. 문제 해결

| 증상 | 원인 | 조치 |
|---|---|---|
| 들어갈 때마다 PIN을 묻는다 | 잠금 유지는 **하루(24시간)**가 정상이다. 그보다 자주 묻는다면 쿠키가 저장되지 않는다(사파리 「모든 쿠키 차단」, 개인정보 보호 브라우징) | 사파리 설정 → 「모든 쿠키 차단」을 끈다. 일반 탭에서 연다. |
| 「10분 뒤에 다시 시도해 주세요」 | 5번 연속으로 틀렸다 | 기다린다. 급하면 Supabase SQL Editor에서 `update public.ms_todo_auth set fails = 0, locked_until = null where id = 1;` |
| 「PIN이 아직 설정되지 않았어요」 | `MS_TODO_PIN`·`MS_TODO_SECRET`이 없거나 형식이 틀렸다 | 3단계를 확인하고 재배포한다. |
| 첨부를 고르면 「저장하지 못했어요」 | 버킷이 없거나 이름이 다르다, 또는 Storage 오류 | 1단계 Storage(`ms-todo`)를 확인한다. 원인은 Vercel 함수 로그 `[api/morning-signal-todo] failed`에 남는다. |
| 「사진이나 PDF만, 파일당 10MB까지…」 | 다른 형식(SVG·동영상 등)이거나 10MB를 넘는다 | 사진·PDF로 10MB 이하만 올린다. |
| 상세에서 사진이 안 보인다 | 서명된 보기 주소를 못 만들었다 | 버킷 이름이 `ms-todo`인지, 1단계 SQL을 실행했는지 확인한다. |
| 「목록을 불러오지 못했어요」 | 테이블이 없거나 Supabase 오류다 | 1단계 확인. Vercel 함수 로그를 본다. |
| 회사망에서 안 열린다 | ePrism이 `*.vercel.app`을 막는다(알려진 한계) | 휴대폰이나 집 네트워크에서 연다. |

## 9. 알려진 한계

- 잠금 시도 제한은 사용자 한 명 기준의 **전역** 카운터다. 누군가 일부러 5번 틀리면 나도 10분 동안 못 들어간다.
- PIN 4자리는 강한 보안이 아니다. 시도 제한으로 무차별 대입만 막는다. 비밀번호·계좌 같은 민감한 정보는 적지 않는다.
- 업로드만 하고 「추가」 없이 시트를 닫은 사진은 Storage에 남을 수 있다(정리는 이번 범위 밖).
- 알림·반복 일정·공유는 없다.

## 10. 로컬 개발·테스트

`pnpm dev`는 `api/`를 띄우지 않으므로 화면은 e2e의 가짜 API로 확인한다.

```bash
pnpm test        # vitest — API(잠금·CRUD·첨부)와 화면 계산 함수
pnpm test:e2e    # Playwright — 휴대폰 폭(375px), API·Storage를 메모리 가짜로 가로챈다
```

| 무엇 | 위치 |
|---|---|
| 라우트 | `app/routes/morning-signal-todo.tsx`, `app/routes/morning-signal/todo/` |
| 공통 껍데기·헤더 | `app/routes/morning-signal/Shell.tsx`, `app/routes/morning-signal/Header.tsx` |
| 데이터 훅 | `app/hooks/use-morning-signal-todo.ts` |
| API | `api/morning-signal-todo.ts` (+ `api/morning-signal-todo.test.ts`) |
| 스키마 | `docs/morning-signal/todo-schema.sql` |
| 시안 | `docs/morning-signal/todo-mockups/` |
| e2e·가짜 API | `e2e/morning-signal-todo.e2e.ts`, `e2e/fixtures/mock-todo-api.ts` |
| 설계·계획 | `docs/superpowers/specs/2026-10-23-morning-signal-todo-design.md`, `docs/superpowers/plans/2026-10-23-morning-signal-todo.md` |

## 9. 아침 TO-DO 알림 루틴(클라우드)

- 「TODO 아침 브리핑 (평일)」 06:00 · 「(주말)」 09:00 KST. 서울 날씨와 이 페이지(`/morning-signal/todo`) 링크를 #todo 채널로 보낸다. 할 일 내용은 읽지 않고 링크로만 안내한다.
- 컨테이너 시계는 UTC라 KST 아침에는 아직 전날이다. 프롬프트가 `TZ=Asia/Seoul date`로 오늘을 확정하고, 날씨 예보 날짜가 오늘과 일치할 때만 쓴다(예전 루틴은 UTC 날짜로 검색해 어제 날씨가 왔다).
- 기본 환경에서는 yr.no가 열리지 않아 한국 뉴스 기사 검색으로 대체된다. 정확한 날씨가 필요하면 날씨 API 도메인을 허용한 전용 환경을 만든다.
