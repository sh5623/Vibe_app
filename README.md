# Vibe App

> React Router 7 (SSR) 기반 개인 포트폴리오 & 인터랙티브 경험 플랫폼

## 페이지 구성

| 경로 | 이름 | 설명 |
|------|------|------|
| `/` | Home | 모든 페이지로 이동하는 카드형 허브 |
| `/fe-rail` | fe-rail Landing | Claude Code 플러그인 소개 랜딩 — 한/EN 토글, framer-motion 애니메이션 |
| `/dev` | Developer Portfolio | 이승호 개발자 포트폴리오 — About · Stack · Work · Contact |
| `/portfolio` | Bambi Portfolio | 반려견 밤비 포트폴리오 — 갤러리, 무한 스크롤, 드래그 인터랙션 |
| `/invitation` | 초대장 | 이벤트 초대카드 인터랙티브 경험 |
| `/letter` | 편지 | 생일 인증 후 열람하는 편지 시스템 |
| `/stock` | 주식 대시보드 | 야후 파이낸스 API 연동 실시간 주식 차트 |
| `/otp` | OTP 뷰어 | OTP 코드 조회 |

## 기술 스택

- **Framework:** React Router 7.18 (프레임워크 모드, SSR) + Vite 8
- **Language:** TypeScript 6 (`strict` + `noUncheckedIndexedAccess`)
- **Styling:** Tailwind CSS 4.3 (CSS-first, `@theme` 변수)
- **Animation:** framer-motion 12 — `motion`, `AnimatePresence`
- **State:** Zustand 5 (전역 UI), TanStack Query 5.101 (서버 상태)
- **Validation:** Zod 4 (`z.email()` / `z.url()` 최상위 함수)
- **Charts:** Recharts 3
- **Icons:** Lucide React
- **Stock Data:** yahoo-finance2 (resource route, server-only)
- **Linter/Formatter:** Biome 2.5 (`biome.json`)

## 시작하기

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env.local
# VITE_BIRTHDAY=MMDD 형태로 설정

# 개발 서버 실행 (localhost:5173)
pnpm dev
```

## 명령어

```bash
pnpm dev          # 개발 서버 (SSR, localhost:5173)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버
pnpm check        # biome check --write + Tailwind v3 문법 감지
pnpm typecheck    # react-router typegen && tsc --noEmit
pnpm test         # vitest run
pnpm test:e2e     # playwright test
```

## 프로젝트 구조

```
app/
├── root.tsx                 # HTML 쉘 + 전역 Provider
├── routes/
│   ├── home.tsx             # /
│   ├── fe-rail.tsx          # /fe-rail
│   ├── dev.tsx              # /dev
│   ├── portfolio.tsx        # /portfolio
│   ├── invitation.tsx       # /invitation
│   ├── letter.tsx           # /letter
│   ├── stock.tsx            # /stock
│   ├── otp.tsx              # /otp
│   ├── api.stock.ts         # GET /api/stock (server-only)
│   └── api.otp.ts           # POST /api/otp (server-only)
├── components/
│   ├── ui/                  # shadcn/ui — 수동 수정 금지
│   └── [Feature]/           # index.tsx 단일 파일 원칙
├── lib/
│   ├── utils.ts             # cn()
│   └── query-client.ts      # SSR-safe QueryClient
├── store/                   # Zustand (*-store.ts)
├── hooks/                   # TanStack Query (use-*.ts)
├── schemas/                 # Zod (*.schema.ts)
├── styles/
│   └── globals.css          # @import "tailwindcss"
└── assets/                  # 정적 이미지
```

## fe-rail 플러그인

이 프로젝트는 [fe-rail](https://github.com/sh5623/fe-rail) Claude Code 플러그인으로 개발되었습니다.
spec → build → review → PR 사이클을 자동화하는 프론트엔드 개발 워크플로우 도구입니다.

```bash
/plugin marketplace add sh5623/fe-rail
/plugin install fe-rail@fe-rail-market
```

## 개발자

이승호 · [GitHub @sh5623](https://github.com/sh5623)
