# Morning Signal 루틴 설정 안내 (다른 계정용)

> 먼저 [`../README.md`](../README.md)의 1–6단계를 끝내세요.

Morning Signal 웹 버전에 매일 아침 뉴스를 넣는 클라우드 루틴(claude.ai의 「Scheduled tasks」) 네 개를 다른 Claude 계정에 만드는 방법이다. 이 저장소는 공개라서 **실제 토큰 값은 어디에도 적지 않는다.**

| 파일 | 내용 |
|---|---|
| [news-ai.md](./news-ai.md) | AI 뉴스 루틴 프롬프트 |
| [news-world.md](./news-world.md) | 시사·경제·상식 루틴 프롬프트 |
| [news-gh.md](./news-gh.md) | GitHub 트렌딩 루틴 프롬프트 |
| [summary.md](./summary.md) | 요약 루틴 프롬프트 |

## 1. 사전 준비

1. Supabase SQL 편집기에서 [`docs/morning-signal/schema.sql`](../schema.sql)을 실행한다.
2. 토큰을 만든다. 예: `openssl rand -hex 32`
3. Vercel 프로젝트 환경변수에 `MS_INGEST_TOKEN`으로 그 값을 추가한다(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`도 있어야 한다).
4. 환경변수를 추가했으면 재배포한다.

## 2. 클라우드 환경 설정

경로: claude.ai/code/routines → 작업 Edit → Advanced settings → General → Cloud environment 옆 설정 아이콘 → Edit cloud environment.

**1순위: 네트워크 시크릿**

- Network secret을 추가한다.
  - 호스트: `vibe-app-omega.vercel.app`
  - Secret type: Bearer
  - 값: 1에서 만든 토큰
- 저장한 뒤에는 값을 다시 볼 수 없다. 바꾸려면 지우고 다시 등록한다.
- 시크릿이 있으면 프롬프트의 curl에 토큰을 따로 넣지 않아도 된다.

**폴백: 환경변수**

- Network access를 Custom으로 바꾸고 Allowed domains에 `vibe-app-omega.vercel.app`을 넣는다. **Also include default list of common package managers**를 체크한다(체크하지 않으면 Trusted 목록이 빠진다).
- Environment variables에 `MS_INGEST_TOKEN`을 넣는다. 환경변수는 평문으로 저장되므로 시크릿이 되지 않을 때만 쓴다.
- 프롬프트의 curl은 `${MS_INGEST_TOKEN:+-H "Authorization: Bearer $MS_INGEST_TOKEN"}` 한 줄로 쓴다. `MS_INGEST_TOKEN`이 있으면 인증 헤더를 더하고, 없으면 아무것도 붙이지 않는다. 값은 출력되지 않는다.

## 3. 작업 4개 등록

경로: New task → Set up manually. 작업마다 다음을 정한다.

- Prompt: 해당 md 파일의 「프롬프트」 펜스 안 본문 전체를 붙여넣는다.
- Trigger: Schedule. 프리셋은 로컬 시각 기준이므로 평일 KST 시각에 맞춘다. Custom cron은 시간대가 문서에 없으므로, 쓴다면 저장한 뒤 표시되는 다음 실행 시각으로 확인한다.
- Cloud environment: 2에서 만든 환경
- Connectors: 전부 끈다. 기본값이 전부 포함이므로 직접 꺼야 한다.
- 허용 도구를 고르는 칸은 없다. 실행은 auto mode다.

| 이름 | 파일 | 시각(평일 KST) | 모델 | 커넥터 |
|---|---|---|---|---|
| AI 뉴스 브리핑 | [news-ai.md](./news-ai.md) | 07:50 | `claude-sonnet-5-5` | 끔 |
| 시사·경제·상식 브리핑 | [news-world.md](./news-world.md) | 07:55 | `claude-sonnet-5-5` | 끔 |
| GitHub 트렌딩 브리핑 | [news-gh.md](./news-gh.md) | 08:00 | `claude-sonnet-5-5` | 끔 |
| Morning Signal 요약 | [summary.md](./summary.md) | 08:30 | `claude-sonnet-5-5` | 끔 |

요약 루틴은 뉴스 세 개가 끝난 뒤에 돌아야 하므로 08:30에 둔다.

## 4. 시험 운행

1. **평일에** 작업을 하나씩 Run now로 실행한다. 주말에 돌리면 서버가 `DATE_NOT_ACCEPTED`로 거부하는데, 이는 정상이다.
2. 최종 출력 첫 줄이 `SAVED <theme> items=N`(요약은 `SUMMARIZED <날짜>`)인지 본다.
3. 첫 실행에서 `command -v curl python3` 결과도 확인한다. 공식 문서의 기본 설치 도구 표에 curl이 없다. python3는 보내기 전 JSON 문법 확인(`python3 -m json.tool`)에 쓴다.
4. 페이지(`https://vibe-app-omega.vercel.app/morning-signal`)에서 결과를 확인한다.

## 5. 문제가 생겼을 때

| 증상 | 확인할 것 |
|---|---|
| 401 `UNAUTHORIZED` | 토큰(시크릿 또는 `MS_INGEST_TOKEN`)이 Vercel 값과 맞지 않는다. |
| 403 `host_not_allowed` | 시크릿의 호스트나 허용 도메인 목록에 `vibe-app-omega.vercel.app`이 빠졌다. |
| 400 `INVALID_JSON` | 루틴이 쓴 JSON 파일에 문법 오류가 있다(따옴표 이스케이프·끝 쉼표 등). 프롬프트는 보내기 전에 `python3 -m json.tool`로 확인하고, 이 오류가 나면 문법만 고쳐 1회 다시 보낸다. |
| 400 `INVALID_PAYLOAD` | 응답의 `issues`(path·message)에 적힌 필드를 확인한다. |
| 400 `DATE_NOT_ACCEPTED` | 응답의 `expectedDate`가 오늘이면 주말 실행이다. 다르면 날짜 확정(0단계)이 틀렸다. |
| 413 `PAYLOAD_TOO_LARGE` | 본문이 256 KiB를 넘었다. |
| 503 `INGEST_NOT_CONFIGURED` | Vercel에 `MS_INGEST_TOKEN`이 없다. 루틴 쪽 문제가 아니다 — 환경변수를 추가하고 재배포한다. 루틴은 1회만 다시 보낸다. |
| 503 `SUPABASE_UNAVAILABLE` | 서버의 Supabase 설정·테이블 문제이거나 일시 장애다. 루틴은 1회만 다시 보낸다. 원인은 Vercel 함수 로그에 남는다. |

## 확인 결과 (2026-10-23, 공식 문서)

- 출처: `https://code.claude.com/docs/en/routines.md` · `https://code.claude.com/docs/en/cloud-environments.md`
- 루틴은 「Scheduled tasks」로 이름이 바뀌었고, research preview다.
- Network access 단계는 None / Trusted / Full / Custom이다. 기본 환경은 Trusted이고, Trusted 목록에 `vercel.app`은 없다.
- 환경변수는 평문으로 저장된다. 그래서 네트워크 시크릿을 1순위로 쓴다.
- 미확인: Custom cron의 시간대, 기본 이미지에 curl이 있는지. 시험 운행에서 확인한다.
- `TZ=Asia/Seoul date`는 기존 계정 루틴이 매일 같은 클라우드 환경에서 쓰고 있어 동작이 확인됐다.

## 알려 둘 점

- 프롬프트는 기존 계정 것을 2026-10-23에 복사한 사본이다. 기존 쪽이 바뀌어도 자동으로 따라가지 않는다. 각 파일 머리의 복사 원본으로 추적한다.
- 같은 날 같은 테마를 다시 보내면 덮어쓴다.
