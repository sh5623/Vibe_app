# Morning Signal 구현 후 할 일

`feat/morning-signal` 브랜치가 만들어진 뒤 위에서부터 차례로 따라 하는 체크리스트다. 이 저장소는 공개라서 **토큰·키 값은 어디에도 적지 않는다.**

## 1. Supabase 테이블 만들기

- 위치: Supabase 대시보드 → /ahram이 쓰는 같은 프로젝트 → SQL Editor
- 할 일: [`docs/morning-signal/schema.sql`](./schema.sql) 전체를 붙여넣어 실행한다.
- 확인: Table Editor에 `ms_feeds`·`ms_summaries`가 보이고 두 테이블 모두 RLS가 켜져 있다.

## 2. 토큰 만들기

```bash
openssl rand -hex 32
```

이 값은 아래 3단계(Vercel)와 루틴 설정(7단계) 두 곳에만 넣는다. 다른 곳에는 적지 않는다.

## 3. Vercel 환경변수

- 위치: Vercel → 프로젝트 → Settings → Environment Variables
- Production에 `MS_INGEST_TOKEN`을 추가한다(값은 2단계 토큰).
- `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`가 이미 있는지 확인한다(/ahram이 쓰고 있다).
- 환경변수는 **다음 배포부터** 적용된다. 이미 배포된 뒤에 추가했다면 재배포한다.

## 4. 배포

- 이 브랜치를 main에 머지하면 Vercel이 프로덕션에 배포한다(머지는 사용자가 정한다).
- 브랜치만 푸시한 상태에서는 Vercel 프리뷰 URL로 먼저 볼 수 있다. 프리뷰는 Production이 아니라 **Preview 환경변수**를 쓰므로 3단계 값이 Preview에도 있어야 한다.

## 5. 배포 확인 (회사 와이파이 밖에서)

```bash
curl https://vibe-app-omega.vercel.app/api/morning-signal
```

- 기대 응답: `{"days":[]}` (함수 배포와 Supabase 연결이 함께 확인된다)
- 브라우저로 `https://vibe-app-omega.vercel.app/morning-signal`을 열면 「아직 저장된 뉴스가 없어요」가 보여야 한다.
- 503 `SUPABASE_UNAVAILABLE`이면 1단계와 3단계를 다시 본다.

## 6. 쓰기 시험 (선택, 평일에)

`date`는 서버 기준 KST 오늘이어야 한다. `<토큰>`과 `<오늘 날짜>`는 직접 채운다.

```bash
curl -sS -w '\n%{http_code}' -X POST "https://vibe-app-omega.vercel.app/api/morning-signal" \
  -H "Authorization: Bearer <토큰>" \
  -H "Content-Type: application/json" \
  -d '{"kind":"summary","date":"<오늘 날짜>","headline":"시험 저장이에요"}'
```

- 200 `{"ok":true,...}`이면 성공이다. 같은 날 요약 루틴이 같은 키로 **덮어쓴다.**
- 주말에 보내면 400 `DATE_NOT_ACCEPTED`가 나온다. 정상이다.

## 7. 다른 계정에서 루틴 등록

[`routines/README.md`](./routines/README.md)를 따른다.

1. 클라우드 환경에 네트워크 시크릿(호스트 `vibe-app-omega.vercel.app`, Bearer)을 만든다.
2. 작업 4개를 등록한다(AI 07:50 · 시사 07:55 · GitHub 08:00 · 요약 08:30, 평일 KST).
3. 평일에 하나씩 Run now로 시험 운행한다.

## 8. 첫 평일 아침 확인

08:30 이후 `/morning-signal`에서 본다.

- [ ] KPI 4장에 숫자가 들어 있다.
- [ ] 「오늘의 한 줄」이 나온다.
- [ ] 「수집 실패」 칩이 없다.
- [ ] 루틴 실행 기록에서 각 최종 출력 첫 줄이 `SAVED <theme> items=N` / `SUMMARIZED <날짜>`다.

## 9. 문제 해결

| 증상 | 원인 | 조치 |
|---|---|---|
| 401 `UNAUTHORIZED` | 보낸 토큰이 Vercel의 `MS_INGEST_TOKEN`과 다르다 | 시크릿(또는 환경변수)과 Vercel 값을 맞춘다. 재시도하지 않는다. |
| 403 `host_not_allowed` | 루틴 환경의 시크릿 호스트나 허용 도메인에 `vibe-app-omega.vercel.app`이 없다 | [`routines/README.md`](./routines/README.md) 2단계를 다시 설정한다. |
| 400 `INVALID_PAYLOAD` | 본문 형식이 스키마와 다르다 | 응답의 `issues`(path·message) 필드를 고친다. |
| 400 `DATE_NOT_ACCEPTED` | `date`가 서버 KST 오늘이 아니거나 주말이다 | 응답의 `expectedDate`가 오늘이면 주말 실행이라 정상이다. 다르면 루틴의 날짜 확정을 점검한다. |
| 503 `SUPABASE_UNAVAILABLE` | Supabase 환경변수나 `MS_INGEST_TOKEN`이 없다, 또는 테이블이 없다 | 1단계와 3단계를 확인하고 재배포한다. |
| 회사망에서 페이지가 안 열린다 | ePrism이 `*.vercel.app`을 막는다(알려진 한계) | 휴대폰이나 집 네트워크에서 연다. |

## 10. 알려진 한계

- 회사 와이파이(ePrism)는 `*.vercel.app`을 막는다. 휴대폰·집 네트워크에서 보는 용도다.
- 읽기 API는 공개다. 링크를 아는 사람은 뉴스 JSON을 읽을 수 있다(뉴스만 있다).
- 루틴 프롬프트는 기존 계정 것을 2026-10-23에 복사한 사본이다. 기존 쪽이 바뀌어도 자동으로 따라가지 않는다. 각 문서 머리의 복사 원본 표기로 추적한다.
- 같은 날 같은 테마를 다시 보내면 덮어쓴다. 이력은 남지 않는다.
- 07:50~08:00 사이에 열면 아직 오지 않은 테마가 「수집 실패」로 보인다(레퍼런스와 같은 동작이다).

## 11. 로컬 개발·테스트

`pnpm dev`는 `api/`를 띄우지 않으므로 페이지는 e2e의 API mock으로 확인한다.

```bash
pnpm test        # vitest (API·집계 포함)
pnpm test:e2e    # Playwright, API 응답을 mock으로 가로챈다
```

| 무엇 | 위치 |
|---|---|
| 라우트 | `app/routes/morning-signal.tsx`, `app/routes/morning-signal/` |
| 데이터 훅 | `app/hooks/use-morning-signal.ts` |
| API | `api/morning-signal.ts` (+ `api/morning-signal.test.ts`) |
| 스키마 | `docs/morning-signal/schema.sql` |
| 루틴 문서 | `docs/morning-signal/routines/` |
| e2e·fixture | `e2e/morning-signal.e2e.ts`, `e2e/fixtures/` |
| 설계 | `docs/superpowers/specs/2026-10-23-morning-signal-design.md` |
| 계획 | `docs/superpowers/plans/2026-10-23-morning-signal.md` |
