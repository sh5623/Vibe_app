# 규약 Changelog & 라우팅 (self-improvement)

> 이 파일이 이 프로젝트 자가개선 시스템의 **단일 데이터 파일**이다(도구는 플러그인, 데이터는 이 파일).
> 규약 갭 처리: `/self-improvement:si-improve` · 문서 비대 정리: `/self-improvement:si-archive` · 라우팅·초안 위임: `convention-smith` 에이전트.
> 형식: 작업 단위 1개 = §로그 1블록(그 안에 개선 N건) · 개선 1건 = §색인 1줄. **최신이 위로**(아래에 append 금지 — 두 갈래로 갈라진다).
> 로그 본문은 **안착 문서에 없는 것**(계기·증거·경위·검증)을 담는다 — 규약 문장 자체는 안착 문서가 정본. "내용이 안착 문서에 있다"는 본문을 건너뛸 이유가 아니다.

<!-- si-plugin: v0.4.0 — 이 파일이 어느 플러그인 버전의 템플릿에서 나왔는지. `/self-improvement:si-init` 재실행이 이 값을 현재 버전과 대조해 위 형식 문구만 보수한다(프로젝트 데이터는 불변). 지우지 말 것. -->

## §라우팅 — 이 프로젝트에서 규약이 사는 곳 (좁은 스코프 우선)

새 규약은 **위에서부터 처음 맞는 층**에 쓴다. 이 표가 정본이며, 표에 없는 홈을 쓰게 되면 표도 같이 갱신한다.

| 층 | 이 프로젝트의 실제 위치 | 로드/발동 시점 | 예산 |
| --- | --- | --- | --- |
| 도구 설정 | `biome.json`(lint/format) · `tsconfig.json`(strict + noUncheckedIndexedAccess) · `package.json` scripts(`check`/`check:tw`/`typecheck`/`test`/`test:e2e`) — CI 워크플로 없음 | 자동 강제 | — (문서 규약보다 항상 우선) |
| 경로 스코프 룰 | 없음(필요 시 `.claude/rules/` 신설) | 매칭 파일을 만질 때만 | 파일당 ≤150줄 |
| 태스크·도메인 문서 | 없음(필요 시 `docs/` 하위 신설) | 해당 작업 시 명시적 Read | 느슨(문서당 ≤400줄 권장) |
| 상시 로드 문서 | `CLAUDE.md`(루트, AGENTS.md 없음 — 이 파일이 앵커 그 자체) | 모든 세션 | **≤200줄** — 모든 세션·모든 파일에서 참인 것만 |
| 아카이브 | docs/conventions/archive/ | 로드 안 됨 | — (사문화 규약 + 로테이션된 로그) |

## §예산·로테이션 규칙

- 예산 수치는 프로젝트 사정에 맞게 조정할 수 있다 — 단 "무제한"은 금지(예산 없는 캡은 아무도 지키지 않는다).
- 이 파일의 §로그 본문 블록은 **최대 15개**. 기록하는 사람이 그 자리에서 검산한다:
  `grep -c '^### ' docs/conventions/CHANGELOG.md` — 15 초과분은 오래된 것부터 `archive/CHANGELOG-ARCHIVE.md` 맨 위로 이동(**§색인·§이관표는 이 파일에 전 기간 유지** — 중복 확인이 한 파일로 끝나는 근거).
- 층 간 이동·아카이브 이관은 `/self-improvement:si-archive` 절차를 따르고 §이관표에 1행을 남긴다.
- 병렬 안전: 규약 편집은 **가산(새 불릿·새 섹션) 우선**, 가능하면 신규 파일(충돌 0), 공유 문서는 규칙당 작은 단일 목적 커밋/PR.

## §이관표 (층 이동·아카이브 내역 — 원위치 인용은 이 표가 커버한다)

| 일자 | 원위치 §조항 | 새 위치 | 사유 |
| --- | --- | --- | --- |

## §색인 (전 기간 · 최신이 위 — 규약화 전 중복 확인은 이 표를 훑는 것으로 시작한다)

| 날짜 | 무엇에 물렸나 (≤120자 한 줄) | 안착 |
| --- | --- | --- |
| 2026-10-10 | CLAUDE.md·README가 SSR이라 적었으나 실제 `ssr: false`(SPA) — 서브에이전트 4개가 SSR HTML 검증에 실패·SSR 우회 코드 설계 | `CLAUDE.md` §Stack·§React Router 7·§상태 관리 · `README.md` |
| 2026-09-05 | 라우트 페이지 PR 2건(#35·#37)이 README·CLAUDE.md 라우트 표·트리를 빠뜨림 → 표 갱신을 같은 커밋 규칙으로 | `CLAUDE.md` §Project Overview |
| 2026-08-11 | self-improvement 시스템 부트스트랩 — 문서 지형 탐지·라우팅 표 작성 | 이 파일 |

## §로그 (최신이 위 · 블록 1개 = 작업 단위 1개 · 본문 최대 15블록)

### 2026-10-10 — 포트폴리오·소개 페이지 모션 작업 중 「SSR」 문서 오류 정정

- **계기**: `/dev`·소개 페이지 4종에 모션을 넣으며 서브에이전트 4개에 「`curl <라우트> | grep <본문>` ≥ 1(SSR 렌더 확인)」 검증을 지시했는데 **4개 전부 0건**으로 실패했다. 오케스트레이터도 CLAUDE.md 를 믿고 SSR 하이드레이션 대비 코드(`CountUp` 이 최종값을 먼저 그렸다가 0 으로 되돌림 → 첫 화면 숫자 깜빡임, `TypeLines` 의 SSR 자리잡기 주석 등)를 설계했다.
- **증거**: `react-router.config.ts` = `ssr: false`(커밋 d8be8cd 「Vercel SPA 배포 설정」) · dev 서버 HTML 에 `"isSpaMode":true` · `pnpm build` 산출물에 `build/server` 없음(`pnpm start` 의 `react-router-serve ./build/server/index.js` 는 실행 불가) · `app/routes` 의 `loader` export 0건 · `/api/*` 는 루트 `api/*.ts` Vercel Functions(`vercel.json` rewrites). 재발 지점: 라우트 검증(4개 페이지), 데이터 로딩 설계(상태 관리 표의 `loader (SSR)`), SSR 안전 설계(`app/components/Motion`).
- **변경**: 기존 규약 **정정**(실패 유형 = 조건 분기 — 「SSR 이면 X」가 사실이 아님). `CLAUDE.md` 스택 표·명령·개요·`/api` 라우트 표·디렉터리 트리·§React Router 7(SSR loader·resource route 예제 → SPA 데이터 흐름 + 「HTML grep 은 언제나 0건 → 브라우저로 검증」 + 「라우트에서 하이드레이션 우회 금지」)·상태 관리 표를 실제값으로 교체. `README.md` 동기화(SSR 3곳·resource route 2곳).
- **소급(§5)**: 코드의 SSR 전제 4곳 정리 — `CountUp` 을 첫 렌더부터 0 으로 시작(깜빡임 제거), `useCycle`·`GanttPlayhead`·fe-rail 강조어 주석의 SSR 언급 삭제. `app/lib/query-client.ts` 의 `isServer` 분기는 빌드 때 `root.tsx` 프리렌더에서 실제로 쓰이므로 유지.
- **위치**: `CLAUDE.md`(253 → 223줄, 상시 로드 예산 200줄 초과는 이전부터 — si-archive 필요) · `README.md`
- **검증**: 효력 재판정 — 새 문장으로 이번 위반 2종(HTML grep 검증 · SSR 우회 설계)이 모두 「하지 말 것」으로 걸리고, 정상인 `root.tsx` 프리렌더는 문장이 명시적으로 제외. `grep -n "api\.stock\|api\.otp\|resource route"` → 새 정정 문장 1건만 남음. `pnpm check`·`typecheck`·`test`(41)·`build` 통과, 브라우저에서 e2e-rail STATS 최종값(0·5·1·~30분) 확인.
- **커밋·PR**: 미커밋(워킹 트리)

### 2026-09-05 — 플러그인 소개 페이지 갱신 중 라우트 표 누락 규약화

- **계기**: `/self-improvement`(PR #35, e232a88)와 `/parallel-worktree`(PR #37, fd4c80d) 페이지가 각각 `routes.ts`·홈 카드·포트폴리오 카드는 갱신했지만 `README.md` 「페이지 구성」 표·디렉터리 트리와 `CLAUDE.md` 라우트 표·트리는 두 번 다 빠뜨렸다. 2026-09-05 갱신 작업이 두 라우트를 뒤늦게 채웠다.
- **증거**: `git show --stat e232a88 fd4c80d`에 README.md·CLAUDE.md 없음. 재발 2곳(두 PR)이라 일반성 충족.
- **변경**: `CLAUDE.md` 라우트 표 바로 아래에 「라우트 추가·삭제 시 표·트리·README를 같은 커밋에서 갱신」 1문장.
- **위치**: `CLAUDE.md` §Project Overview (라우트 표가 사는 자리라 가장 좁은 스코프. 린터로 강제할 수 없는 문서 정합이므로 도구 층 불가)
- **검증**: 이 작업 단위의 커밋이 routes.ts·README.md·CLAUDE.md를 함께 담는다.
- **커밋/PR**: main 직접 커밋

### 2026-08-11 — si-init: 자가개선 시스템 부트스트랩

- **계기**: 이 프로젝트에 규약 갭을 되돌려 넣을 장소·절차가 없었다.
- **변경**: 이 파일 생성(라우팅 표 = 탐지 결과) + 상시 로드 문서(`CLAUDE.md`)에 자가개선 절 3줄 배선.
- **위치**: `docs/conventions/CHANGELOG.md` · `CLAUDE.md`
- **검증**: 라우팅 표의 각 위치 실재 확인(ls/grep) — biome.json·tsconfig.json·package.json scripts 존재 확인, `.claude/rules/`·`docs/` 하위 도메인 문서·CI 워크플로는 부재 확인.
- **커밋/PR**: (프로젝트 git 규칙대로)
