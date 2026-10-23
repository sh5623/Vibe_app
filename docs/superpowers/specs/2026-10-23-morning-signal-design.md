# Morning Signal 웹 버전 (Vibe_app `/morning-signal`) 설계

- 작성일: 2026-10-23
- 상태: 사용자 승인 대기
- 화면 기준(레퍼런스): `/Users/seungho/Documents/second-brain/.wiki-automation/dashboard/morning-signal.html` (second-brain 커밋 `9aebe90`). 확인용 fixture는 같은 폴더의 `fixtures/*.json`(normal·missing·noai·single), 가짜 DB 주입기는 `fake-db.js`.
- 기존 설계(참고): `/Users/seungho/Documents/second-brain/.wiki-automation/specs/2026-10-19-morning-signal-design.md`
- 기존 루틴 프롬프트(복사 원본): `/Users/seungho/Documents/second-brain/.wiki-automation/routines/news-ai.md` · `news-world.md` · `news-gh.md` · `notify.md`

## 1. 왜 만드나

지금 Morning Signal은 이렇게 돈다.
- claude.ai 비공개 페이지(Artifact)와 그 페이지의 내장 DB를 쓴다.
- 클라우드 루틴 4개가 DB에 데이터를 쓴다.
- 슬랙 DM으로 페이지 링크를 받는다.

이 구성은 **그대로 유지**한다.

이와 별도로 사용자는 **내 앱(Vibe_app) 안에서 직접 관리하는 웹페이지 버전**을 원한다. 조건은 두 가지다.
- claude.ai 로그인 없이 브라우저만 있으면 어디서나 열린다.
- 데이터는 Supabase에 쌓는다.

이 웹 버전의 데이터는 **다른 개인 장비의 다른 Claude 계정**에 둔 클라우드 루틴이 채운다. 그래서 그 계정에 등록할 루틴 문서도 이 레포에 함께 둔다. 두 계열(기존 Artifact판과 새 웹판)은 데이터를 주고받지 않는다.

**성공 기준**
- 루틴을 등록한 다음 평일 아침 `https://vibe-app-omega.vercel.app/morning-signal`을 연다.
- 그날의 AI·시사·GitHub 뉴스가 지금 Morning Signal과 같은 화면으로 보인다. 숫자 모션, 차트, 오늘의 한 줄, 피드 목록이 모두 나와야 한다.
- 날짜를 넘겨 지난 날짜도 볼 수 있다.

## 2. 목표 · 비목표 · 반목표

**목표**
1. `/morning-signal` 라우트를 만든다. 레퍼런스 페이지의 **뉴스 보기를 그대로** 옮긴다.
2. Supabase 테이블과 Vercel 함수 `api/morning-signal.ts`를 만든다. 루틴이 쓰는 쓰기 API와 페이지가 쓰는 읽기 API를 둔다.
3. 다른 계정에서 그대로 등록할 루틴 문서 4개와 설정 안내를 레포에 둔다. 루틴은 AI·시사·GitHub·요약이다.
4. 테이블 생성 SQL을 레포에 둔다.

**비목표**
- **개발 탭은 넣지 않는다.** 뉴스/개발 보기 전환 버튼도 함께 뺀다. 개발 보고는 회사 장비의 git 기록에서 나오므로 다른 장비에서 만들 수 없다.
- 슬랙 알림을 보내지 않는다. 사용자가 직접 열어서 본다.
- 과거 데이터를 옮기지 않는다(백필 없음). 첫 루틴이 도는 날부터 쌓는다.
- second-brain 위키 적재와 연동하지 않는다.
- 기존 루틴, 기존 Artifact 페이지, 기존 DB는 건드리지 않는다.
- 화면에서 데이터를 쓰거나 고치는 기능은 없다. 로그인도 없다.
- 회사 와이파이(ePrism)는 `*.vercel.app`을 막는다. 여기서도 열리게 하는 일은 범위 밖이다(§8 알려진 한계).

**반목표** (기술적으로 돌아가도 실패로 본다)
- 출처에 없는 사실이 화면에 들어간다. 루틴 문서의 할루시네이션 금지·A/B 검증 규칙이 약해진 경우도 포함한다.
- 토큰 없이 누구나 데이터를 쓸 수 있다.
- Supabase 서비스 롤 키나 쓰기 토큰이 브라우저 번들 또는 레포에 노출된다.
- 수집 실패가 조용히 묻힌다. 실패한 테마에는 반드시 "수집 실패" 또는 "0건" 칩이 보여야 한다.
- 건수·FE 집계를 루틴 AI가 직접 센다. 기존 운영에서 AI가 6건을 5건으로 센 적이 있다.
- 기존 Morning Signal 쪽에 영향이 간다.

## 3. 사용자가 정한 것

1. 기존 Morning Signal(Artifact판)은 유지하고, Vibe_app에 웹판을 따로 만든다.
2. 화면은 지금 페이지와 똑같이 만든다.
3. DB는 Supabase를 쓴다.
4. 데이터는 다른 개인 장비·다른 Claude 계정의 루틴이 보낸다. 그 루틴 문서를 Vibe_app에 포함한다.
5. 개발 탭은 뺀다.
6. 페이지는 보기 전용이고 링크는 공개한다. 화면에 쓰기 기능은 없다.
7. 슬랙은 보내지 않는다.
8. 데이터는 루틴이 처음 도는 날부터 쌓는다. 백필하지 않는다.
9. 다음은 제가 제안했고 사용자가 "맞다"고 확인했다.
   - 요약 루틴을 따로 둔다(슬랙 없이 한 줄 요약만 쓴다).
   - 건수·상태·FE 집계는 서버가 계산한다.
   - `/ahram`이 쓰는 Supabase 프로젝트를 그대로 쓰고, 새 의존성 없이 REST로 호출한다.
   - 루틴 문서는 `docs/` 아래에 둔다.
   - 회사망에서 안 열리는 것은 한계로 받아들인다.

## 4. 구조

```
[다른 계정 클라우드 루틴]
 07:50 KST AI 뉴스   ─┐
 07:55 KST 시사·경제 ─┼─ POST /api/morning-signal (kind: feed)    ─┐
 08:00 KST GitHub    ─┘                                            ├─ Supabase
 08:30 KST 요약      ─ GET ?date=오늘 → 한 줄 작성 → POST (kind: summary) ─┘
                                                                    │
[브라우저] /morning-signal ─ GET /api/morning-signal (날짜 목록·집계)  ─┘
                           GET /api/morning-signal?date=D (그날 피드)
```

- 루틴 실행 시각은 기존 루틴과 같다. UTC cron은 다음과 같다. 모두 평일(월~금 KST)이다.
  - AI: `50 22 * * 0-4`
  - 시사: `55 22 * * 0-4`
  - GitHub: `0 23 * * 0-4`
  - 요약: `30 23 * * 0-4`
- Vercel 프로덕션 주소: `https://vibe-app-omega.vercel.app`(레포 homepage 값).

## 5. 데이터와 API

### 5.1 Supabase 테이블 (제 판단)

같은 프로젝트(`SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`, `/ahram`과 공용)에 두 테이블을 만든다.
- 두 테이블 모두 **RLS를 켜고 정책은 두지 않는다.** 이렇게 하면 서비스 롤 키(서버)만 읽고 쓸 수 있고, anon 키로는 접근할 수 없다.
- SQL은 `docs/morning-signal/schema.sql`에 둔다. 사용자가 Supabase SQL Editor에서 한 번 실행한다. 서비스 롤 권한(`grant select, insert, update … to service_role`)도 명시한다. 여러 번 실행해도 된다.

**`ms_feeds`**: 테마별 하루 1행. 기본키는 `(date, theme)`이다.

| 열 | 내용 |
|---|---|
| `date` | `date`, KST 날짜 |
| `theme` | `ai` / `world` / `gh` |
| `items` | `jsonb`. 루틴이 보낸 항목 배열을 그대로 저장한다 |
| `note` | 0건일 때 루틴이 적은 사유(선택) |
| `generated_at`, `model` | 루틴이 보낸 값 |
| `item_count`, `fe_high`, `fe_picks`, `top_text` | **서버가 쓰기 시점에 `items`에서 계산해 저장하는 집계** |
| `updated_at` | 서버 기록 시각 |

**`ms_summaries`**: 날짜별 1행. 기본키는 `date`이다.

| 열 | 내용 |
|---|---|
| `date` | `date`, KST 날짜 |
| `headline` | 요약 루틴이 쓴 한 줄 |
| `highlight` | `headline` 안에서 강조할 구절(선택) |
| `updated_at` | 서버 기록 시각 |

집계 열을 따로 두는 이유는 목록 API가 날짜 수에 비례해 커지지 않게 하려는 것이다. `items`는 날짜 상세에서만 읽는다(제 판단).

### 5.2 집계 규칙 (서버가 결정적으로 계산)

기존 알림 루틴의 스크립트(`notify.md` 1단계)와 같은 규칙을 쓴다.
- **상태(테마별)**
  - 행이 없으면 `missing`이다. 화면에는 "수집 실패"로 표시한다.
  - 행은 있는데 `items`가 0개면 `empty`다. 화면에는 "0건"으로 표시한다.
  - 1개 이상이면 `ok`다.
  - 루틴이 보낸 `status` 값은 믿지 않고 `items` 길이로 다시 판정한다.
- **FE 높음 수**: AI 항목 중 `impact == "high"`인 수 + GitHub 항목 중 `fePick == true`인 수.
- **`fe.picks`**: GitHub에서 `fePick`인 레포 이름 목록.
- **대표 3줄(`tops`)**
  - AI·시사는 첫 항목의 제목이다.
  - GitHub는 `fePick`인 첫 레포를 쓴다. 없으면 `starsTodayNum`이 가장 큰 레포를 쓴다. 표시는 `"<repo> · 오늘 <starsToday>"`이고, `starsToday`가 없으면 레포 이름만 쓴다.
- **요일**: 날짜에서 계산한다(월~금 한 글자).

### 5.3 API 계약 — `api/morning-signal.ts` 한 파일

**`GET /api/morning-signal`**: 공개, 인증 없음.
- 데이터가 있는 모든 날짜를 오름차순으로 돌려준다. 행이 하나라도 있으면 데이터가 있는 날짜로 본다.
- PostgREST 응답 행 상한(Supabase 기본 `max_rows` 1000)에 잘리지 않게 `limit=1000`·`offset`으로 페이지가 1000행보다 적게 올 때까지 끝까지 읽는다. 정렬은 `ms_feeds`가 `date, theme`, `ms_summaries`가 `date` 오름차순이다(전순서라 페이지가 겹치지 않는다).
- 날짜마다 다음 값을 담는다: `date`, `weekday`, `counts{ai,world,gh}`, `status{ai,world,gh}`, `fe{high,picks}`, `tops[]`, `headline|null`, `highlight|null`, `updatedAt`.
- `updatedAt`은 그 날짜 행들의 `updated_at` 중 가장 늦은 값이다.
- 이 응답이 기존 Artifact DB의 `days` 문서 역할을 한다. 날짜 이동, 달력의 점, KPI 델타와 스파크라인이 여기서 나온다.

**`GET /api/morning-signal?date=YYYY-MM-DD`**: 공개.
- 그날의 요약 한 건(위와 같은 형태)과 `feeds{ai?,world?,gh?}`를 돌려준다.
- 각 feed는 `date`, `theme`, `generatedAt`, `model`, `status`, `note?`, `items`를 담는다. 기존 `feeds/{날짜}--{테마}` 문서와 같은 형태다.
- 데이터가 없는 날짜는 404를 돌려준다.
- `date`가 `YYYY-MM-DD` 형식이 아니거나 달력에 없는 날(`2026-02-30`)이면 400 `INVALID_DATE`다.

**`POST /api/morning-signal`**: 루틴 전용.
- 헤더 `Authorization: Bearer <MS_INGEST_TOKEN>`이 필요하다.
  - 토큰이 없거나 틀리면 401이다. 비교는 상수 시간으로 한다.
  - 서버 환경변수가 비어 있으면 503이다(`/ahram`과 같은 방식). Supabase 값(`SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`)이 없으면 `SUPABASE_UNAVAILABLE`, `MS_INGEST_TOKEN`이 없으면 `INGEST_NOT_CONFIGURED`다.
  - 본문이 JSON이 아니면 400 `INVALID_JSON`이다.
- `kind: "feed"`
  - 본문: `date`, `theme`, `generatedAt`, `model`, `status`, `note?`, `items[]`.
  - `(date, theme)` 행을 **통째로 덮어쓰고**, 그때 §5.2 집계를 다시 계산한다.
- `kind: "summary"`
  - 본문: `date`, `headline`, `highlight?`.
  - `date` 행을 덮어쓴다.
- **검증**: Zod 4로 테마별 항목 스키마를 검사한다.
  - 필드는 기존 루틴 문서의 「항목 필드」 정의와 같다.
    - AI: `title`, `summary`, `publishedAt|null`, `impact`, `impactNote`, `url`, `grade`, `tags?`
    - 시사: `title`, `summary`, `publishedAt|null`, `category`, `url`, `grade`
    - GitHub: `rank`, `repo`, `url`, `description`, `language|null`, `stars|null`, `starsToday|null`, `starsTodayNum|null`, `impact`, `impactNote`, `fePick`, `grade`
  - 실패하면 400과 필드 오류를 돌려준다. 루틴이 이 응답을 그대로 보고한다.
  - 모르는 키는 버린다(제 판단).
  - **엄격도 (제 판단).** LLM이 만든 JSON의 사소한 형식 차이 때문에 그 테마를 그날 통째로 잃지 않게 한다.
    - enum과 필수 문자열은 엄격하게 검사한다. 대상은 `impact`·`grade`·`category`·`theme`, 그리고 `title`·`url`·`repo`다.
    - 내용과 무관한 타입 차이는 서버가 변환해 받는다.
      - 숫자 자리에 `"2,213"`·`"+2,213"` 같은 숫자 문자열이 오면 숫자로 바꾼다. 대상은 `rank`·`starsTodayNum`이다.
      - 문자열 자리(`stars`·`starsToday`)에 숫자가 오면 문자열로 바꾼다.
      - `null` 자리에 빈 문자열이 오면 `null`로 바꾼다.
      - 선택 필드(`note`·`tags`·`highlight`)에 `null`이 오면 키가 없는 것으로 본다.
    - `generatedAt`은 오프셋(`Z` 또는 `+09:00`)이 있는 ISO 8601 시각이어야 한다. `timestamptz` 열에 들어가므로 Postgres 거부(503) 대신 400 `INVALID_PAYLOAD`로 알린다.
    - `date`는 달력에 있는 날이어야 한다(`2026-02-30`은 400 `INVALID_PAYLOAD`).
- **날짜 규칙 (제 판단).**
  - `date`는 **서버 시계 기준 KST 오늘**이면서 **평일**일 때만 받는다.
  - 아니면 400과 `{ error: "DATE_NOT_ACCEPTED", expectedDate }`를 돌려준다.
  - 이렇게 하는 이유는 두 가지다.
    - 루틴이 날짜를 잘못 확정한 경우(UTC 날짜 사용)에 어제 데이터를 조용히 덮어쓰지 않게 한다.
    - 주말 시험 운행이 운영 데이터에 토·일 행을 남기지 않게 한다. 레퍼런스 달력은 월~금 칸만 그린다.
  - 그래서 요일 계산은 월~금만 다룬다.
- 본문 상한은 256 KiB로 한다. GitHub 25개 항목이 약 15 KB라 여유가 있다.
- 성공하면 200과 `{ ok, date, theme?, itemCount? }`를 돌려준다.
- Supabase가 오류를 돌려주면 503 `SUPABASE_UNAVAILABLE`이다. PostgREST 오류 본문(앞 500자)은 서버 로그에만 남기고 HTTP 응답에는 넣지 않는다.

### 5.4 비밀값

Vercel 환경변수(Production)는 세 개다. 앞의 두 개는 이미 `/ahram`이 쓰고 있을 것이다. 구현 전에 있는지 확인한다.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MS_INGEST_TOKEN`: 새로 만든다. 사용자가 긴 무작위 문자열을 생성해 Vercel에 넣는다.

다른 계정의 클라우드 루틴 실행 환경에서는 토큰을 **네트워크 시크릿**(Network secret)으로 등록한다. 2026-10-23 공식 문서로 확인한 내용이다(`https://code.claude.com/docs/en/cloud-environments.md` 「Add network secrets」).
- 등록할 값: 호스트 `vibe-app-omega.vercel.app`, Secret type은 **Bearer**, 값은 `MS_INGEST_TOKEN`과 같은 값.
- 프록시가 그 호스트로 가는 요청에 `Authorization: Bearer …`를 붙여 준다. 그래서 루틴 세션은 토큰 값을 볼 수 없다.
- 시크릿 호스트로 가는 요청은 네트워크 접근 레벨과 무관하게 나간다. 따라서 허용 목록을 따로 고치지 않아도 된다.
- 환경변수(Environment variables)는 쓰지 않는다. 문서에 따르면 환경변수는 평문으로 저장되고 그 환경을 쓰는 누구나 읽을 수 있다.
- API 주소 `https://vibe-app-omega.vercel.app`은 공개 값이므로 루틴 프롬프트에 그대로 적는다.
- **폴백**: 그 계정 플랜에서 네트워크 시크릿을 쓸 수 없으면 두 단계로 대신한다.
  1. 환경의 Network access를 **Custom**으로 바꾸고 Allowed domains에 `vibe-app-omega.vercel.app`을 넣는다. **Also include default list of common package managers**를 체크한다(체크하지 않으면 Trusted 목록이 빠진다).
  2. Environment variables에 `MS_INGEST_TOKEN=<값>`을 넣는다. 그러면 루틴이 `-H "Authorization: Bearer $MS_INGEST_TOKEN"`을 직접 붙인다.

레포와 문서에는 실제 값을 쓰지 않는다.

## 6. 페이지 `/morning-signal`

**기준은 레퍼런스 HTML의 뉴스 보기와 같은 화면·같은 동작이다.** 화면 구성, 모션, 색, 글꼴, 반응형 구간, 빈 상태, 실패 칩까지 같게 만든다. 다른 점은 아래 목록뿐이다.

**같게 둘 것**(레퍼런스 그대로)
- **헤더**: 로고 이퀄라이저, `Morning Signal`, 갱신 시각 스탬프, 날짜 이동(‹ 날짜 › + 달력 팝오버, 뉴스 있는 날 점 표시, 「최신」 표시), 테마 아이콘 버튼(해↔달 모양 변환 + 버튼에서 원형으로 퍼지는 화면 전환).
- **KPI 4장**: 전체·AI·시사·GitHub. 숫자 롤링, 전 영업일 대비 중립색 델타, 최근 2주 스파크라인, 수집 실패·0건 칩.
- **벤토**: 오늘의 한 줄(단어 등장 + 형광펜 강조) + 대표 3줄, AI FE 영향도 도넛, 시사 분포 CategoryBar, GitHub 오늘 별 증가 BarList(순위 이동 모션).
- **피드**: 세그먼트 탭(AI·시사·GitHub, 탭별 건수·칩, 인디케이터 이동)과 촘촘한 목록. 행을 누르면 요약·FE 영향·출처가 펼쳐진다. 출처는 새 탭으로 연다.
- **배경·효과**: 오로라 배경, 그리드 배경, 패널 기울기·광택(hover 가능한 기기만), 날짜 전환 방향 슬라이드. `prefers-reduced-motion`이면 모두 끈다.
- **테마**: 기본은 라이트다. 사용자가 고른 테마는 브라우저에 기억한다(localStorage, 실패해도 라이트로 동작). Vibe_app의 다른 페이지 테마와 섞이지 않게 이 페이지 전용 속성을 쓴다.
- **글꼴**: Geist, Geist Mono, IBM Plex Sans KR(Google Fonts).
- **날짜 결정**: 처음 열면 `#YYYY-MM-DD` 해시가 가리키는 날짜를 연다. 해시가 없으면 가장 최근 날짜를 연다. 날짜를 옮기면 해시를 `replaceState`로 바꾼다.
- **실패 판정**: 선택한 날짜의 feeds로 판정한다. 행이 없으면 「수집 실패」, 0건이면 「0건」이다(서버 `status`와 같은 규칙).

**바꿀 것**
- 뉴스/개발 보기 전환 버튼, 개발 콘텐츠, 개발 빈 상태를 뺀다.
- 데이터는 Artifact DB(`window.claude.use("db")`, `onSnapshot`) 대신 TanStack Query 훅(`app/hooks/use-*.ts`)이 `/api/morning-signal`에서 받는다.
  - 목록은 탭에 다시 돌아올 때 새로 받는다(TanStack 기본 `refetchOnWindowFocus`).
  - 목록의 `updatedAt`이 바뀐 날짜는 상세를 다시 받는다. 이는 레퍼런스의 `lastStamp` 동작과 같다(제 판단).
- 빈 상태 문구는 이렇게 바꾼다.
  - 데이터가 전혀 없을 때: 「아직 저장된 뉴스가 없어요 / 평일 아침 8시에 첫 브리핑이 들어와요」.
  - API 오류일 때: 「데이터를 불러오지 못했어요 / 잠시 뒤 새로고침해 주세요」. 보여 줄 데이터가 없을 때만 띄운다. 이미 그린 화면은 백그라운드 재조회가 실패해도 그대로 둔다(TanStack v5는 이때 `data`를 남긴 채 `isError`를 켠다).
  - 「claude.ai에서 열어 주세요」 상태는 없앤다.
- 오늘의 한 줄(`headline`)이 아직 없을 때는 레퍼런스의 폴백 동작을 그대로 쓴다. 요약 루틴 실행 전이거나 실패한 경우다.

**구현 방식**
- Vibe_app 규약(`CLAUDE.md`)을 따른다: RR7 SPA, Tailwind 4 CSS-first, framer-motion, TS strict, Biome, `react-router-dom` 금지.
- 레퍼런스의 CSS와 모션을 Tailwind 유틸로 옮길지, 라우트 전용 스타일로 옮길지는 빌더가 정한다. 기준은 시각·동작이 같은가다.
- 이 스펙은 `CLAUDE.md` 복잡도 예산의 「신규 파일 ≤ 3개」를 **오버라이드**한다. 라우트·하위 컴포넌트·훅·스키마·API·테스트·문서가 필요하다.
- **신규 pnpm 의존성은 0개를 지킨다.** supabase-js를 쓰지 않고 `/ahram`처럼 REST `fetch`로 호출한다.
- 라우트 모듈은 `meta`와 default component만 export한다는 규약이 있다. Google Fonts를 불러오는 방법은 이 규약 안에서 빌더가 정한다.

**같은 커밋에서 갱신할 문서**: `CLAUDE.md`의 라우트 표·Directory Structure와 `README.md`의 「페이지 구성」 표·트리. `CLAUDE.md` 규약이 이를 요구한다. 지금 `CLAUDE.md` 라우트 표에 `/ahram`이 빠져 있으니 이때 함께 채운다.

**safe-area**: 레퍼런스는 `env(safe-area-inset-*)`를 쓴다. 이 값이 적용되려면 `viewport-fit=cover`가 필요한데, 지금 `root.tsx`의 공통 viewport meta에는 없다. 처리 방법은 빌더가 정한다. 다른 라우트에는 영향이 없어야 한다.

## 7. 루틴 문서 (다른 계정용)

**위치**: `docs/morning-signal/routines/`

| 파일 | 내용 |
|---|---|
| `README.md` | 설정 안내. 아래 「설정 안내」 항목을 담는다 |
| `news-ai.md` | AI 뉴스 루틴 프롬프트 전문 |
| `news-world.md` | 시사·경제·상식 루틴 프롬프트 전문 |
| `news-gh.md` | GitHub 트렌딩 루틴 프롬프트 전문 |
| `summary.md` | 요약 루틴 프롬프트 전문 |

**뉴스 루틴 3개**
- 기존 프롬프트의 규칙과 0~4단계를 **원문 그대로** 복사한다. 할루시네이션 금지, A/B 검증, 날짜 확정, 탐색 최소 기준, 자가 점검, 항목 필드 정의가 여기에 들어간다.
- 문서 머리에 복사 원본과 기준 날짜를 적는다: second-brain `.wiki-automation/routines/*.md`, 2026-10-23.
- **바꾸는 것은 저장 단계뿐이다.**
  - 지금: `ToolSearch select:ArtifactData` → `ArtifactData set`
  - 바뀐 뒤:
    1. JSON 문서를 절대 경로 파일(`/tmp/feed.json`)로 쓴다.
    2. 보내기 전에 `python3 -m json.tool /tmp/feed.json > /dev/null`로 문법을 확인한다. 틀리면 문법만 고쳐 다시 확인한다.
    3. Bash로 다음 한 줄을 실행한다. 토큰은 네트워크 시크릿이 붙여 준다. 폴백 구성이라 `MS_INGEST_TOKEN`이 설정돼 있을 때만 `${MS_INGEST_TOKEN:+…}`가 인증 헤더를 더하고, 값은 출력되지 않는다. 환경변수를 출력하지 않는다.
       ```
       curl -sS -w '\n%{http_code}' -X POST "https://vibe-app-omega.vercel.app/api/morning-signal" -H "Content-Type: application/json" ${MS_INGEST_TOKEN:+-H "Authorization: Bearer $MS_INGEST_TOKEN"} --data-binary @/tmp/feed.json
       ```
    4. 최종 출력 첫 줄에 결과를 적는다. 성공하면 `SAVED <theme> items=N`(N은 응답의 `itemCount`), 실패하면 `SAVE_FAILED <HTTP 코드> <응답 원문>`.
  - 문서 형태는 기존 feeds 문서에 `"kind": "feed"`만 더한 것이다.
  - 0건이어도 반드시 보낸다. 그래야 화면에 「0건」이 뜬다.
- 프롬프트에서 Artifact URL, ArtifactData, 슬랙 언급을 모두 뺀다.
- 실패 시 재시도 규칙 (제 판단)
  - 503(`INGEST_NOT_CONFIGURED`·`SUPABASE_UNAVAILABLE`)은 서버 설정 문제다. 최대 1회만 다시 보내고 보고한다.
  - 그 밖의 5xx나 네트워크 오류는 짧게 1~2회 재시도한다.
  - 400 `INVALID_JSON`은 JSON 문법만 고쳐(내용은 그대로) 1회 다시 보낸다.
  - 400 필드 오류는 응답에 적힌 필드의 **형식만** 고쳐 1회 다시 보낸다.
    - 내용(사실·수치·URL)은 바꾸지 않는다.
    - 고칠 수 없는 항목은 그 항목만 빼고 보낸다. 뺀 항목의 제목은 최종 출력에 적는다.
  - `DATE_NOT_ACCEPTED`는 `expectedDate`와 0단계에서 확정한 날짜를 비교한다.
    - 둘이 같은데 거부됐다면 주말 실행이다. 그대로 보고하고 끝낸다.
    - 다르면 0단계를 다시 확인한다.
  - 401은 재시도하지 않고 보고한다.

**요약 루틴 `summary.md`**
- 기존 `notify.md` 프롬프트에서 2단계 headline·highlight 작성 규칙만 가져온다.
  - 절대 규칙 1: 그날 items에 적힌 내용만 근거로 쓴다.
  - 해요체 한 문장, 공백 포함 28~48자.
  - highlight는 headline 안의 연속 구절로, 4~14자.
- 슬랙 발송, 개발 줄, 집계 스크립트는 뺀다. 집계는 서버가 한다.
- 절차
  1. 0단계로 날짜를 확정한다(KST).
  2. `curl "https://vibe-app-omega.vercel.app/api/morning-signal?date=TODAY"`로 그날 feeds를 받는다.
  3. headline·highlight를 쓴다.
  4. `{ "kind": "summary", "date", "headline", "highlight" }`를 `/tmp/summary.json`으로 쓰고 문법을 확인한 뒤 POST한다(저장 방식·재시도 규칙은 뉴스 루틴과 같다).
  5. 결과를 보고한다(`SUMMARIZED TODAY` / `SUMMARY_FAILED …`).
- 그날 데이터가 없어 404가 나오면(세 테마 모두 수집 실패) headline을 「오늘은 뉴스를 가져오지 못했어요」로 두고 highlight 없이 POST한다.

**설정 안내 `README.md`**
1. 사전 준비: Supabase SQL 실행(`docs/morning-signal/schema.sql`), Vercel에 `MS_INGEST_TOKEN` 추가, 재배포.
2. 다른 계정의 claude.ai 클라우드 환경 설정. 경로는 claude.ai/code/routines → 작업 Edit → Advanced settings → General → Cloud environment 옆 설정 아이콘 → Edit cloud environment.
   - **Network secret**을 추가한다: 호스트 `vibe-app-omega.vercel.app`, Secret type은 Bearer, 값은 토큰. 저장한 뒤에는 값을 다시 볼 수 없으므로, 바꾸려면 지우고 다시 등록한다.
   - 폴백(§5.4): Network access를 Custom으로 바꾸고 Allowed domains에 그 호스트를 넣고, **Also include default list of common package managers**를 체크한다(체크하지 않으면 Trusted 목록이 빠진다). Environment variables에는 `MS_INGEST_TOKEN`을 넣는다.
3. 작업 4개를 등록한다. 경로는 New task → Set up manually다. 작업마다 다음을 정한다.
   - Name
   - Prompt: 해당 md 파일의 「프롬프트」 본문을 붙여넣는다.
   - 모델: `claude-sonnet-5-5`
   - Trigger: Schedule. 프리셋은 로컬 시각 기준이므로 평일 07:50 / 07:55 / 08:00 / 08:30 KST로 정한다. Custom cron은 시간대가 문서에 없으므로, 쓴다면 저장한 뒤 표시되는 다음 실행 시각으로 확인한다.
   - Cloud environment: 2에서 만든 환경
   - Connectors: 전부 끈다. 기본값이 전부 포함이므로 직접 꺼야 한다.
   - 허용 도구를 고르는 칸은 없다. 실행은 auto mode다.
4. 시험 운행: **평일에** 작업을 하나씩 Run now로 실행한다 → 최종 출력이 `SAVED`인지 확인한다 → 페이지에서 확인한다. 주말에 돌리면 서버가 `DATE_NOT_ACCEPTED`로 거부하는데, 이는 정상이다. 첫 실행에서 `command -v curl python3` 결과도 확인한다(문서의 기본 설치 도구 표에 curl이 없다. python3는 JSON 문법 확인에 쓴다).
5. 문제가 생겼을 때 보는 곳
   - 401이면 토큰(시크릿)이 맞지 않는다.
   - `403 host_not_allowed`면 시크릿 호스트나 허용 목록이 빠졌다.
   - 400이면 필드 오류 응답을 확인한다(`INVALID_JSON`이면 JSON 문법 오류다).
   - 503 `INGEST_NOT_CONFIGURED`면 Vercel에 `MS_INGEST_TOKEN`이 없다. 503 `SUPABASE_UNAVAILABLE`면 Supabase 설정·테이블 문제이거나 장애다.

**확인 결과 (2026-10-23, 공식 문서)**
- 출처: `https://code.claude.com/docs/en/routines.md` · `https://code.claude.com/docs/en/cloud-environments.md`
- 루틴은 「Scheduled tasks」로 이름이 바뀌었고, research preview다.
- Network access 단계는 None / Trusted / Full / Custom이다. 기본 환경은 Trusted이고, Trusted 목록에 `vercel.app`은 없다.
- 환경변수는 평문으로 저장된다. 그래서 위 2처럼 네트워크 시크릿을 1순위로 쓴다.
- 미확인: Custom cron의 시간대, 기본 이미지에 curl이 있는지. 시험 운행에서 확인한다.
- `TZ=Asia/Seoul date`는 기존 계정 루틴이 매일 같은 클라우드 환경에서 쓰고 있어 동작이 확인됐다.

## 8. 알려진 한계

- 회사 와이파이(ePrism)는 `*.vercel.app`을 막는다. 회사망에서는 열리지 않는다. 휴대폰이나 집 네트워크에서 보는 용도다.
- 읽기 API는 공개다. 링크를 아는 사람은 뉴스 JSON을 읽을 수 있다. 뉴스만 있으므로 받아들인다.
- 루틴 프롬프트는 기존 계정 것을 2026-10-23에 복사한 사본이다. 이후 기존 쪽 프롬프트가 바뀌어도 자동으로 따라가지 않는다. 문서 머리의 복사 원본 표기로 추적한다.
- 같은 날 같은 테마를 다시 보내면 덮어쓴다. 이력은 남지 않는다.
- 07:50~08:00 사이에 열면 아직 오지 않은 테마가 「수집 실패」로 보인다. 레퍼런스와 같은 동작이다.

## 9. 빌더에게 맡기는 것

- 컴포넌트 분할, 파일 이름, 상태 관리 세부(Zustand 필요 여부 등).
- CSS를 옮기는 방식, framer-motion과 CSS 애니메이션 중 어느 쪽을 쓸지(시각·동작이 같은 범위에서).
- Zod 스키마 위치(`app/schemas/` 또는 API 파일 안). 클라이언트와 공유할지도 포함한다.
- 홈(`/`)에 카드로 링크할지. `/stock`·`/otp` 등 기존 관례를 따른다.
- 테스트 구성
  - API 핸들러: vitest. `api/ahram.test.ts` 방식으로 인증, 검증, 집계, 덮어쓰기, 503·401·400을 검사한다.
  - 집계 함수: 순수 함수 단위 테스트.
  - 페이지: Playwright로 API 응답을 가로채 확인한다. 레퍼런스 fixture 4종(normal·missing·noai·single)을 API 응답 형태로 바꿔 쓰고, 주요 상태와 날짜 이동, 테마 전환을 검증한다.
- 배포 순서와 브랜치. 커밋·푸시는 사용자가 명시적으로 지시할 때만 한다(사용자 전역 규칙).
