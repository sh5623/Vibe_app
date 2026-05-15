<!-- lang: ko -->

# fe-rail

## Hero

### 타이틀
프론트엔드 개발의 A to Z, Claude Code 하나로

### 부제목
React / Next.js + TypeScript 프로젝트에서 기획부터 PR까지 — spec → build → review → PR 사이클을 자동화하는 Claude Code 플러그인

### CTA
- label: "시작하기"
  anchor: "#install"
- label: "GitHub에서 보기"
  href: "https://github.com/sh5623/fe-rail"

---

## Features

### 스킬 (Skills)

#### fe-spec
- 아이콘: 📋
- 제목: 스펙 자동화
- 설명: 기능 요구사항을 구조화된 `feature.md`로 변환합니다. 갭 분석 → Figma 분석 → 외부 문서 조사 → 아키텍처 자문까지 4개 에이전트가 협력합니다.
- 명령어: `/fe-rail:fe-spec`

#### fe-build
- 아이콘: 🔨
- 제목: 코드 구현
- 설명: 타입 정의 → 훅/서비스 → 컴포넌트 → 테스트 순서로 구현합니다. ESLint·Prettier 자동 적용, tsc/eslint 오류 자동 수정.
- 명령어: `/fe-rail:fe-build`

#### fe-review
- 아이콘: 🔍
- 제목: 4축 코드 리뷰
- 설명: 타입 안전성·성능·접근성(WCAG AA)·코드 품질 4개 축으로 리뷰합니다. 각 축은 전용 에이전트가 독립적으로 감사합니다.
- 명령어: `/fe-rail:fe-review`

#### fe-start
- 아이콘: ⚡
- 제목: 원스톱 자동화
- 설명: spec → build → review → PR 전 과정을 하나의 명령으로 실행합니다. 사람 개입은 "구현할까요?"와 "커밋할까요?" 두 번뿐입니다.
- 명령어: `/fe-rail:fe-start feature.md`

#### fe-doc-sync
- 아이콘: 📝
- 제목: 문서 동기화
- 설명: hooks·skills·agents 변경 감지 시 CLAUDE.md와 README.md 수정안을 자동으로 제안합니다.
- 명령어: `/fe-rail:fe-doc-sync`

### 에이전트 (Agents)

#### spec 단계
| 에이전트 | 역할 | 모델 |
|---------|------|------|
| fe-analyst | 요구사항 갭 분석 (6갭 / 7섹션) | opus |
| fe-vision | Figma·UI 스크린샷·PDF 분석 | sonnet |
| fe-researcher | 외부 문서·라이브러리 조사 | sonnet |
| fe-architect | Next.js 아키텍처·RSC 경계 자문 | opus |

#### build 단계
| 에이전트 | 역할 | 모델 |
|---------|------|------|
| fe-explorer | 코드베이스 탐색 | haiku |
| fe-test-author | BDD 시나리오 + TDD Red-Green-Refactor | sonnet |
| fe-build-fixer | tsc/eslint 오류 최소 diff 수정 | sonnet |

#### review 단계
| 에이전트 | 역할 | 모델 |
|---------|------|------|
| fe-reviewer | 4축 통합 리뷰 | sonnet |
| fe-a11y-auditor | WCAG AA 접근성 정밀 감사 | sonnet |
| fe-perf-auditor | RSC·번들·Image·Font 성능 감사 | sonnet |
| fe-test-runner | 테스트 실행 + 실패 분류 | sonnet |
| fe-refactor-advisor | 6차원 리팩토링 분석 | sonnet |

#### PR 단계
| 에이전트 | 역할 | 모델 |
|---------|------|------|
| fe-git-operator | 커밋 분리·메시지 규칙·안전한 스테이징 | sonnet |
| fe-pr-author | PR 본문 작성 + gh pr create | sonnet |

### 훅 (Hooks)

정책: **위험은 차단(exit 2), 품질은 경고(stderr)**

| 훅 | 이벤트 | 역할 | 차단 |
|----|--------|------|------|
| guard.sh | PreToolUse:Bash | git force push, --no-verify, rm -rf / 등 차단 | ✅ |
| write-guard.sh | PreToolUse:Write | .env*, *.pem, *.key 민감 파일 생성·수정 차단 | ✅ |
| read-guard.sh | PreToolUse:Read | 민감 파일 읽기 시도 경고 | — |
| task-guard.sh | PreToolUse:Task | 서브에이전트 프롬프트 인젝션 차단 | ✅ |
| lint-fix.sh | PostToolUse:Edit | ESLint --fix + Prettier 자동 적용 | — |
| nextjs-guard.sh | PostToolUse:Edit | Server Component 규칙 위반 감지 | — |
| quality-gate.sh | Stop | ESLint + tsc --noEmit 최종 검증 | — |

---

## Workflow

### 원스톱 자동화
```
feature.md 작성
    ↓
/fe-rail:fe-start feature.md
    ↓
"구현할까요?" → 승인
    ↓
코드 구현 + 자동 리뷰
    ↓
"커밋할까요?" → 승인
    ↓
PR 생성 완료
```

### 단계별 수동 제어
```
/fe-rail:fe-spec
    ↓
/fe-rail:fe-build
    ↓
/fe-rail:fe-review
    ↓
git commit && gh pr create
```

---

## Install

### 전제 조건
- Claude Code
- pnpm
- gh CLI (PR 자동 생성 시)
- TypeScript strict mode (React / Next.js)

### 설치
```bash
# Claude Code 터미널에서 실행
/plugin marketplace add sh5623/fe-rail
/plugin install fe-rail@fe-rail-market
```

### 지원 환경
| 환경 | 지원 여부 | 비고 |
|------|----------|------|
| React + TypeScript | ✅ | Vite 등 번들러 무관 |
| Next.js + TypeScript | ✅ | App Router 기준, RSC 최적화 포함 |
| 모노레포 | ✅ | apps/ + packages/ 구조 지원 |

---

## FAQ

### fe-rail은 어떤 프로젝트에 사용하나요?
React 또는 Next.js + TypeScript 프로젝트라면 어디든 사용할 수 있습니다. 번들러(Vite, Webpack 등)나 모노레포 구조와 무관하게 동작합니다.

### 기존 프로젝트에 설치해도 되나요?
네, 신규 프로젝트와 기존 프로젝트 모두 설치 가능합니다. 플러그인은 프로젝트 파일을 수정하지 않으며, 에이전트·훅·스킬을 Claude Code 환경에 추가하는 방식으로 동작합니다.

### feature.md를 직접 작성해야 하나요?
아니요. `/fe-rail:fe-spec`을 실행하면 요구사항을 입력받아 자동으로 `feature.md`를 생성합니다. 직접 작성해도 무방합니다.

### 훅이 기존 워크플로우를 방해하지 않나요?
훅은 위험한 명령만 차단하고, 품질 관련 항목은 경고만 출력합니다. ESLint/Prettier 자동 수정은 편집 후 즉시 적용되어 수동 포맷팅 없이도 일관성을 유지합니다.

### 어떤 테스트 프레임워크를 지원하나요?
Vitest + Testing Library를 기본으로 지원합니다. BDD 시나리오를 기반으로 한 TDD 사이클(Red → Green → Refactor)을 자동화합니다.

### 모노레포에서는 어떻게 동작하나요?
앱별 `feature.md`를 분리 작성하고, `packages/`의 공유 모듈을 우선 탐색합니다. 패키지 간 직접 import는 차단됩니다.

---

<!-- lang: en -->

# fe-rail

## Hero

### Title
Frontend Development A to Z, with Claude Code

### Subtitle
A Claude Code plugin that automates the full frontend workflow — spec → build → review → PR — for React / Next.js + TypeScript projects.

### CTA
- label: "Get Started"
  anchor: "#install"
- label: "View on GitHub"
  href: "https://github.com/sh5623/fe-rail"

---

## Features

### Skills

#### fe-spec
- icon: 📋
- title: Spec Automation
- description: Converts feature requirements into a structured `feature.md`. Four agents collaborate — gap analysis → Figma analysis → external docs research → architecture advice.
- command: `/fe-rail:fe-spec`

#### fe-build
- icon: 🔨
- title: Code Implementation
- description: Implements in order: type definitions → hooks/services → components → tests. Applies ESLint·Prettier automatically and auto-fixes tsc/eslint errors.
- command: `/fe-rail:fe-build`

#### fe-review
- icon: 🔍
- title: 4-Axis Code Review
- description: Reviews across four axes — type safety, performance, accessibility (WCAG AA), and code quality. Each axis is audited by a dedicated agent independently.
- command: `/fe-rail:fe-review`

#### fe-start
- icon: ⚡
- title: One-Shot Automation
- description: Runs the entire spec → build → review → PR pipeline in a single command. Human intervention occurs only twice: "Shall I implement?" and "Shall I commit?"
- command: `/fe-rail:fe-start feature.md`

#### fe-doc-sync
- icon: 📝
- title: Doc Sync
- description: Detects changes to hooks, skills, and agents and automatically proposes updates to CLAUDE.md and README.md.
- command: `/fe-rail:fe-doc-sync`

### Agents

#### Spec Phase
| Agent | Role | Model |
|-------|------|-------|
| fe-analyst | Requirements gap analysis (6 gaps / 7 sections) | opus |
| fe-vision | Figma · UI screenshot · PDF analysis | sonnet |
| fe-researcher | External docs & library research | sonnet |
| fe-architect | Next.js architecture · RSC boundary advice | opus |

#### Build Phase
| Agent | Role | Model |
|-------|------|-------|
| fe-explorer | Codebase exploration | haiku |
| fe-test-author | BDD scenarios + TDD Red-Green-Refactor | sonnet |
| fe-build-fixer | Minimal diff fixes for tsc/eslint errors | sonnet |

#### Review Phase
| Agent | Role | Model |
|-------|------|-------|
| fe-reviewer | Integrated 4-axis review | sonnet |
| fe-a11y-auditor | WCAG AA accessibility audit | sonnet |
| fe-perf-auditor | RSC · bundle · Image · Font performance audit | sonnet |
| fe-test-runner | Test execution + failure classification | sonnet |
| fe-refactor-advisor | 6-dimension refactoring analysis | sonnet |

#### PR Phase
| Agent | Role | Model |
|-------|------|-------|
| fe-git-operator | Commit splitting · message rules · safe staging | sonnet |
| fe-pr-author | PR body writing + gh pr create | sonnet |

### Hooks

Policy: **Block danger (exit 2), warn on quality (stderr)**

| Hook | Event | Role | Blocks |
|------|-------|------|--------|
| guard.sh | PreToolUse:Bash | Blocks git force push, --no-verify, rm -rf / etc. | ✅ |
| write-guard.sh | PreToolUse:Write | Blocks creation/modification of sensitive files (.env*, *.pem, *.key) | ✅ |
| read-guard.sh | PreToolUse:Read | Warns on attempts to read sensitive files | — |
| task-guard.sh | PreToolUse:Task | Blocks prompt injection in sub-agent prompts | ✅ |
| lint-fix.sh | PostToolUse:Edit | Auto-applies ESLint --fix + Prettier | — |
| nextjs-guard.sh | PostToolUse:Edit | Detects Server Component rule violations | — |
| quality-gate.sh | Stop | Final validation with ESLint + tsc --noEmit | — |

---

## Workflow

### One-Shot Automation
```
Write feature.md
    ↓
/fe-rail:fe-start feature.md
    ↓
"Shall I implement?" → Approve
    ↓
Code implementation + auto review
    ↓
"Shall I commit?" → Approve
    ↓
PR created
```

### Manual Step-by-Step
```
/fe-rail:fe-spec
    ↓
/fe-rail:fe-build
    ↓
/fe-rail:fe-review
    ↓
git commit && gh pr create
```

---

## Install

### Prerequisites
- Claude Code
- pnpm
- gh CLI (for automated PR creation)
- TypeScript strict mode (React / Next.js)

### Installation
```bash
# Run inside Claude Code terminal
/plugin marketplace add sh5623/fe-rail
/plugin install fe-rail@fe-rail-market
```

### Supported Environments
| Environment | Supported | Notes |
|-------------|-----------|-------|
| React + TypeScript | ✅ | Bundler-agnostic (Vite, etc.) |
| Next.js + TypeScript | ✅ | App Router, RSC-optimized |
| Monorepo | ✅ | Supports apps/ + packages/ structure |

---

## FAQ

### What projects is fe-rail designed for?
Any React or Next.js + TypeScript project. It works regardless of bundler (Vite, Webpack, etc.) or monorepo structure.

### Can I install it in an existing project?
Yes. fe-rail works with both new and existing projects. The plugin does not modify project files — it adds agents, hooks, and skills to the Claude Code environment.

### Do I need to write feature.md manually?
No. Running `/fe-rail:fe-spec` will prompt you for requirements and generate `feature.md` automatically. Manual authoring is also supported.

### Will hooks interfere with my existing workflow?
Hooks only block genuinely dangerous commands. Quality-related items emit warnings only. ESLint/Prettier auto-fixes are applied immediately after each edit, maintaining consistency without manual formatting.

### What test frameworks are supported?
Vitest + Testing Library is the default. The TDD cycle (Red → Green → Refactor) is automated from BDD scenarios.

### How does it behave in a monorepo?
`feature.md` files are written per-app. Shared modules in `packages/` are explored first. Direct cross-app imports are blocked.
