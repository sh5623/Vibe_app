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
| 도구 설정 | `biome.json`(lint/format) · `tsconfig.json`(strict + noUncheckedIndexedAccess) · `package.json` scripts(`check`/`check:tw`/`check:e2e-waits`/`typecheck`/`test`/`test:e2e`) — CI 워크플로 없음 | 자동 강제 | — (문서 규약보다 항상 우선) |
| 경로 스코프 룰 | 없음 — `.gitignore`가 `.claude/` 통째라 `.claude/rules/`에 써도 커밋되지 않는다(다른 클론·워크트리에 안 감). 쓰려면 먼저 `.gitignore`를 `.claude/*` + `!.claude/rules/`로 바꾼다 | 매칭 파일을 만질 때만 | 파일당 ≤150줄 |
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
| 2026-11-05 | e2e가 레일 열림·전환 끝을 고정 시간(`waitForTimeout`)으로 기다린 뒤 한 번만 확인해 병렬 실행에서 5개가 번갈아 실패 | `package.json` `check:e2e-waits`(도구) |
| 2026-11-05 | 라우팅 표가 경로 룰 위치로 `.claude/rules/`를 가리켰으나 `.claude/`가 gitignore라 커밋되지 않음 | 이 파일 §라우팅 |
| 2026-10-23 | 라이브 클라우드 루틴 프롬프트를 고치고 `docs/morning-signal/routines/` 사본을 안 고쳐 어긋남(요약 루틴 Slack 단계) | `docs/morning-signal/routines/README.md` §알려 둘 점 |
| 2026-10-23 | 레포 안 Claude 워크트리(`.claude/worktrees/`)가 있으면 Biome이 중첩 루트로 멈추고 vitest가 테스트를 두 번 셈 | `biome.json`·`tsconfig.json`·`vite.config.ts` 제외(도구) |
| 2026-10-23 | route CSS 커스텀 클래스 `.ring`·`.static`이 Tailwind 4 유틸리티와 같은 이름이라 덧씌워짐(PIN 자물쇠에 사각 테두리) | `package.json` `check:tw-names`(도구) |
| 2026-10-23 | 포트폴리오 카드 4장의 버전·«118건 eval» 이 릴리스마다 낡음 → 릴리스마다 바뀌는 값은 꼭 필요할 때만(카드엔 금지) | `CLAUDE.md` §Project Overview |
| 2026-10-10 | CLAUDE.md·README가 SSR이라 적었으나 실제 `ssr: false`(SPA) — 서브에이전트 4개가 SSR HTML 검증에 실패·SSR 우회 코드 설계 | `CLAUDE.md` §Stack·§React Router 7·§상태 관리 · `README.md` |
| 2026-09-05 | 라우트 페이지 PR 2건(#35·#37)이 README·CLAUDE.md 라우트 표·트리를 빠뜨림 → 표 갱신을 같은 커밋 규칙으로 | `CLAUDE.md` §Project Overview |
| 2026-08-11 | self-improvement 시스템 부트스트랩 — 문서 지형 탐지·라우팅 표 작성 | 이 파일 |

## §로그 (최신이 위 · 블록 1개 = 작업 단위 1개 · 본문 최대 15블록)

### 2026-11-05 — Morning Signal 사이드 레일 구현 중 e2e 고정 대기를 도구로 막음

- **계기**: 사이드 레일 e2e(`e2e/morning-signal.e2e.ts` 레일 묶음)의 Esc·호버·레일 링크·동작 줄이기·스쳐 지나감 테스트가 병렬 실행에서 번갈아 실패했다. 같은 동작을 따로 재면 제품은 8/8·6/6 정상이었다. 원인은 테스트 쪽이었다. «0.12초 뒤 열림 · 0.15초 뒤 닫힘 · View Transition 끝»을 정해진 시간(`waitForTimeout`)만큼 기다린 뒤 한 번만 확인했고, 부하가 걸리면 그 시간이 모자랐다.
- **증거**: 실패는 병렬 실행에서만 나왔다(단독 실행은 통과). `expect.poll`·전환 끝 대기로 바꾼 뒤 72개가 3회 연속 통과했다. 재발 지점:
  - ① 레일 테스트 5개(고침)
  - ② 같은 파일의 날짜 출발판 테스트 2개 `date flips to the new date`·`rapid date clicks settle on the last date`(1.5초·2초 고정 대기 뒤 판 글자를 한 번 확인)
  - ③ `e2e/morning-signal-todo.e2e.ts` `content is not hidden behind the tab bar`(스크롤 뒤 0.3초)
  - ④ second-brain 아티팩트 검사 `.wiki-automation/tests/fx_check.js` `rail.clickWhileOpen`(고정 900ms에서 1회 실패 → 전환 끝을 기다리게 바꿈)
- **변경 1(도구 신설)**: `package.json`에 `check:e2e-waits`를 추가하고 `pnpm check`에 연결했다.
  - `e2e/**/*.ts`의 `waitForTimeout(` 줄에 `// 고정 대기: <이유>` 표시가 없으면 실패한다.
  - 실패 메시지가 판단 기준을 함께 알려 준다: 일어나야 하는 상태는 `expect.poll`·자동 재시도 단언으로 기다리고, 부재 확인·연타 간격만 고정 대기 + 이유로 쓴다.
  - 「일어나야 하는가 / 일어나지 않아야 하는가」는 도구가 가르지 못한다. 표시를 다는 사람이 메시지 기준으로 고른다.
  - 문서 규약은 따로 쓰지 않았다. 상시 로드 `CLAUDE.md`는 238줄로 예산 200을 넘었고, 경로 룰은 아래 변경 2 때문에 공유되지 않는다.
- **변경 2(라우팅 정정)**: §라우팅의 경로 스코프 룰 칸이 `.claude/rules/` 신설을 안내했다. 그런데 `.gitignore:42`가 `.claude/`를 통째로 제외해 거기 쓴 룰은 커밋되지 않는다(`git check-ignore -v .claude/rules/e2e.md` → `.gitignore:42:.claude/`). 칸을 실제 상태와 쓰는 조건으로 고쳤다.
- **전파**: 기존 고정 대기 8건을 나눴다. 소급 미적용은 0건이다.
  - 일어나야 하는 상태 3건(②의 2건, ③)은 `expect.poll`로 바꿨다.
  - 부재 확인 4건에는 이유 표시를 달았다: `morning-signal.e2e.ts`의 오류 문구 없음·스쳐 지나감, `morning-signal-todo.e2e.ts`의 스프링 없음·추가 요청 없음.
  - 연타 간격 1건에도 표시를 달았다.
- **로컬 처리(게이트 탈락)**: react-bits `Waves`가 효과 정리 단계에서 `loseContext()`를 불렀다. React StrictMode(개발)가 효과를 정리→재실행하면 같은 `<canvas>`가 끊긴 컨텍스트를 받아 배경이 흰 면이 됐다. 레포의 WebGL 컴포넌트 중 정리 단계에서 컨텍스트를 끊는 것은 `Waves` 하나뿐이다(`ElectricBorder`는 끊지 않는다). 그래서 전역화하지 않고 `app/components/react-bits/Waves.tsx` 정리 주석에만 두었다. react-bits WebGL 컴포넌트를 하나 더 들일 때 재발 지점이 둘이 되면 그때 규약화한다. (같은 날 오후 사용자 요청으로 `Waves`를 통째로 지워 그 주석도 사라졌다 — 지금 레포에 정리 단계에서 컨텍스트를 끊는 컴포넌트는 0개다. 다시 받을 때 원본 정리 단계의 `loseContext()`를 지울 것.)
- **검증**:
  - PoC: 표시 없는 `waitForTimeout(900)`이 든 임시 e2e 파일을 두면 그 줄을 짚고 rc=1, 지우면 rc=0. 표시를 달기 전 기존 8건도 모두 검출했다.
  - `pnpm check`·`typecheck`가 통과했고, 뉴스·TO-DO e2e 72개도 통과했다.
  - 바꾼 3개 테스트를 5회 반복(동시 15개)하면 14개 통과, 1개 실패였다. 실패는 `content is not hidden behind the tab bar`의 바꾸지 않은 첫 단언(목록 첫 표시 5초 초과)에서 났고, 그 테스트만 10회 반복하면 10/10 통과했다.
- **커밋·PR**: 미커밋(워킹 트리 · 브랜치 `feat/morning-signal-rail`)

### 2026-10-23 — Morning Signal 모바일 성능·표시 수정 중 「라이브 루틴 ↔ 사본」 어긋남 규약화

- **계기**: 요약 루틴에 Slack 링크 알림 단계를 더하면서 라이브(클라우드)만 고쳤고 `docs/morning-signal/routines/summary.md` 사본은 그대로 남았다. 이 폴더는 라이브 프롬프트를 복사해 둔 문서라, 한쪽만 고치면 다음 사람이 낡은 사본으로 루틴을 다시 만든다.
- **증거**: 이 작업 단위에서 요약·TO-DO·영어 브리핑 등 루틴 5개를 라이브로 만들거나 고쳤다. 사본이 있는 것은 뉴스 3개·요약 1개 = 4개(재발 지점 4곳). 요약 사본은 같은 작업에서 맞췄다.
- **변경**: 신설 — `docs/morning-signal/routines/README.md` §알려 둘 점에 1문장(라이브 프롬프트를 고치면 사본도 같은 작업에서 고친다) + 클라우드 루틴 API가 기본 커넥터를 자동으로 붙이는 점. 도구로 강제할 수단이 없어(라이브는 claude.ai 쪽) 문서로 둔다.
- **로컬 처리(게이트 탈락)**: SVG `preserveAspectRatio="none"` 안의 원이 모바일에서 타원으로 납작해지는 문제(KPI 스파크라인 끝점) — 레포 안 재발 지점을 하나만 확인해 전역화하지 않았다. `Kpis.tsx` `Spark` 주석과 e2e(`sparkline end dot stays round`)에만 둔다.
- **검증**: `grep -n "5단계 — Slack" docs/morning-signal/routines/summary.md` → 1건. `pnpm typecheck`·`test`(176+)·`test:e2e`(morning-signal 2종) 통과.
- **커밋·PR**: 브랜치 `fix/morning-signal-mobile-perf` → main 병합

### 2026-10-23 — TO-DO 머지 검증 중 레포 안 워크트리가 검사 도구를 오염

- **계기**: `feat/morning-signal-todo`를 main에 머지한 뒤 main 체크아웃에서 검증하자, `pnpm check`가 `Found a nested root configuration`으로 멈추고 `pnpm test`가 338개(=169×2)를 셌다. 구현용 워크트리를 Claude Code 기본 위치인 레포 안 `.claude/worktrees/`에 두어서, 그 안의 `biome.json`과 테스트 파일까지 함께 스캔된 것이다. `tsconfig.json`의 `include: **/*.ts`도 같은 이유로 워크트리 파일까지 타입 검사한다.
- **증거**: 임시 워크트리(`git worktree add --detach .claude/worktrees/poc HEAD`)로 재현 → 수정 전 `check=1`·`Tests 338`, 수정 후 `check=0`·`Tests 169`·`typecheck=0`. 재발 지점: 이번 TO-DO 워크트리, 앞선 morning-signal 워크트리 작업, parallel-worktree 스킬로 띄우는 모든 워크트리(EnterWorktree 기본 위치가 `.claude/worktrees/`).
- **변경**: 신설(도구) — `biome.json` `files.includes`에 `!**/.claude`, `tsconfig.json` `exclude`에 `.claude`, `vite.config.ts`에 `test.exclude: [...configDefaults.exclude, '.claude/**']`. `.claude/`는 gitignore 대상이라 소스가 아니다.
- **검증**: 위 재현 전후 비교. 워크트리를 지운 상태에서도 build·E2E 48·check 통과. 2026-10-25 origin/main(`2805f63`) 위에 다시 얹어 check·typecheck·test 재확인.
- **커밋·PR**: main 직접 커밋(이 블록과 같은 커밋, push 안 함)

### 2026-10-23 — Morning Signal TO-DO 구현 중 Tailwind 이름 충돌을 도구로 막음

- **계기**: TO-DO PIN 화면(`app/routes/morning-signal/todo/PinGate.tsx`)의 자물쇠 링에 시안에 없는 검은 사각 테두리가 나왔다. 원인은 route 전용 CSS의 커스텀 클래스 `ring`이었다. Tailwind 4가 소스(TSX)를 스캔하다 `className="ring"` 토큰을 보고 같은 이름의 유틸리티(`box-shadow` 링)를 만들어 덧씌웠다. 같은 화면의 `col static`도 Tailwind `static`(position)과 겹쳤다(커스텀 선택자 특이도가 높아 겉보기는 우연히 무사했다).
- **증거**: 375px 캡처(구현 워크트리 `.superpowers/sdd/…/shots/light.png`)에서 사각 테두리가 보였고, `ring`→`pin-ring`, `static`→`still`로 이름만 바꾸자 사라졌다. 재발 지점은 route 전용 CSS 2개다 — `app/routes/morning-signal/morning-signal.css`(레퍼런스 이식, 짧은 클래스명 다수), `app/routes/morning-signal/todo/todo.css`.
- **변경**: 신설(도구) — `package.json`에 `check:tw-names`를 추가했다. `app/**/*.css`(`globals.css` 제외)에서 Tailwind 유틸리티 이름(`ring`·`static`·`fixed`·`hidden`·`flex`·`grid`·`border`·`shadow`·`transition` 등 단독 토큰)을 커스텀 클래스 선택자로 쓰면 실패한다. `check:tw`가 이것을 이어 실행하므로 `pnpm check`에 배선된다. 문서 규약은 쓰지 않았다(도구가 강제한다).
- **검증**: PoC — 사고 당시 선택자(`.ms .pin .ring`·`.ms .pin .col.static`)를 담은 임시 CSS를 `app/`에 넣으면 두 줄을 짚으며 실패, 빼면 통과. 현재 route CSS 2개는 0건(`.grid-bg`처럼 하이픈이 붙은 이름은 걸리지 않는다).
- **로컬 처리(게이트 탈락)**: TanStack v5에서 데이터 없이 실패한 쿼리를 두 번째 컴포넌트가 구독하면, 마운트 시 재조회로 status가 `pending`으로 돌아간다. 그러면 `isPending`으로 분기하는 부모가 자식을 내렸다 올리기를 반복한다(세션 503 수십 회 반복 실측). 레포 안 다른 재발 지점을 실명으로 대지 못해 전역화하지 않았다 — `PinGate.tsx` 머리 주석에만 둔다.
- **커밋·PR**: `feat/morning-signal-todo` 브랜치(미푸시)

### 2026-10-23 — 포트폴리오 카드의 릴리스 수치 제거 중 「릴리스마다 낡는 값」 규약화

- **계기**: fe-rail v1.19.0 반영 뒤 사용자가 `/dev` Selected Work 카드의 버전 표기 삭제를 지시했다. 지우고 보니 fe-rail 카드의 «118건 회귀 eval» 도 이미 낡아 있었고(현재 122), 사용자가 «업데이트마다 손봐야 하고 설명에 꼭 필요하지 않은 내용은 간략하게 — 매번 고치지 않게» 로 원칙을 정했다.
- **증거**: 카드 4장의 버전이 전부 실제와 달랐다 — fe-rail `v1.18.0`(실제 1.19.0) · e2e-rail `v0.2.2`(실제 0.4.1) 등. 재발 지점: 플러그인 4종이 릴리스할 때마다 카드 4장 + 개수·측정치(«15개 에이전트와 5개 스킬» · «118건» · «n=30에서 97%»).
- **변경**: 신설 — `CLAUDE.md` §Project Overview 에 1문장(릴리스마다 바뀌는 값은 설명에 꼭 필요할 때만 · 카드엔 쓰지 않음 · 소개 페이지 버전은 «최근 변경» 절). `.claude/` 가 gitignore 라 경로 스코프 룰은 커밋되지 않아 상시 로드 문서에 둔다(예산 초과 223줄은 이전부터 — si-archive 필요).
- **소급(§5)**: `Work.tsx` 카드 문구 — 버전 괄호 4곳(직전 커밋) + «15개 에이전트와 5개 스킬» → «전용 에이전트·스킬», «118건» 삭제, «(n=30에서 모델 97% 절감)» 삭제.
- **남은 것**: `/e2e-rail` 소개 페이지 바닥글의 `v0.2.2` 와 설치 명령 `#v0.2.2` 고정 — 설치 명령의 버전 고정은 기능이라 처리 방침을 사용자에게 묻는다.
- **검증**: `grep -nE "[0-9]+(개|건)|n=[0-9]|v[0-9]+\.[0-9]" app/routes/dev/Work.tsx` → 문구 0건. `pnpm check`·`typecheck`·`test`·`build` 통과.
- **커밋/PR**: 브랜치 `chore/dev-work-release-free-copy` → main 병합

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
