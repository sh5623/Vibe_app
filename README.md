# Vibe App

> Next.js App Router 기반 개인 포트폴리오 & 인터랙티브 경험 플랫폼

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

## 기술 스택

- **Framework:** Next.js 16+ (App Router, TypeScript strict)
- **Styling:** @emotion/styled (CSS-in-JS, SSR 지원)
- **Animation:** framer-motion — motion, AnimatePresence, whileInView
- **State:** Jotai (전역), React Query (서버 상태, staleTime 1min)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Stock Data:** yahoo-finance2 (API Route)

## 시작하기

```bash
# 의존성 설치
yarn install

# 환경변수 설정 (.env.local 파일을 직접 생성하고 NEXT_PUBLIC_BIRTHDAY 키 설정)

# 개발 서버 실행 (localhost:3000)
yarn dev
```

## 명령어

```bash
yarn dev      # 개발 서버
yarn build    # 프로덕션 빌드
yarn start    # 프로덕션 서버
yarn lint     # ESLint 실행
```

## 프로젝트 구조

```
src/
├── app/           # 페이지 · API 라우트 (파일 기반 라우팅)
│   ├── fe-rail/   # fe-rail 플러그인 랜딩 페이지
│   ├── dev/       # 개발자 포트폴리오
│   ├── portfolio/ # Bambi 포트폴리오
│   ├── stock/     # 주식 대시보드
│   ├── invitation/
│   ├── letter/
│   └── api/       # 주식 데이터 API Route
├── components/    # 공통 UI 컴포넌트
├── hooks/         # React Query 커스텀 훅
├── providers/     # QueryProvider · EmotionRegistry
├── store/         # Jotai 전역 상태
├── lib/           # Emotion SSR 레지스트리
└── styles/        # GlobalStyles
```

## fe-rail 플러그인

이 프로젝트는 [fe-rail](https://github.com/sh5623/fe-rail) Claude Code 플러그인으로 개발되었습니다.
spec → build → review → PR 사이클을 자동화하는 프론트엔드 개발 워크플로우 도구입니다.

```bash
# Claude Code 내에서 설치
/plugin marketplace add sh5623/fe-rail
/plugin install fe-rail@fe-rail-market
```

## 개발자

이승호 · [GitHub @sh5623](https://github.com/sh5623)
