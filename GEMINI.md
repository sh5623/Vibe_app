# Vibe App - AI (Gemini) 프론트엔드 개발 가이드라인

본 문서는 **Vibe App** 프로젝트의 프론트엔드 구조와 코딩 컨벤션을 정리한 가이드라인입니다. Gemini (또는 AI 에이전트)가 코드를 작성, 수정, 개선할 때 이 문서를 기준으로 작업해야 합니다.

## 1. 프로젝트 기술 스택 (Tech Stack)
* **Framework:** Next.js (App Router, v14/v15 이상)
* **Language:** TypeScript
* **Styling:** Emotion (`@emotion/react`, `@emotion/styled`)
* **State Management:** Jotai
* **Data Fetching:** React Query (`@tanstack/react-query`)
* **UI Components/Icons:** Lucide React (`lucide-react`), Recharts (차트 라이브러리)
* **Package Manager:** Yarn

## 2. 디렉토리 구조 및 역할 (Directory Structure)
```
/src
  ├── app/          # Next.js App Router 기반 페이지 및 API 라우트
  ├── assets/       # 정적 이미지, 폰트 파일 등의 어셋 모음
  ├── components/   # 재사용 가능한 UI 컴포넌트 (Chart, Card, Layout 등)
  ├── hooks/        # 커스텀 React 훅 모음 (e.g. useStockQuery)
  ├── lib/          # 라이브러리 설정 및 유틸리티 함수 (e.g. emotion registry)
  ├── providers/    # 전역 앱 프로바이더 모음 (e.g. QueryProvider)
  ├── store/        # Jotai 상태 관리 파일 모음
  ├── styles/       # 전역 스타일 설정 (e.g. GlobalStyles)
  └── types/        # 전역 TypeScript 타입 정의 파일 모음
```

## 3. 핵심 아키텍처 및 코딩 컨벤션

### 3-1. Next.js App Router 사용
* 모든 페이지는 `src/app` 폴더 내의 디렉토리 기반 라우팅을 따릅니다.
* 기본적으로 서버 컴포넌트(Server Component)를 지향하되, 상태 반환이나 브라우저 API가 필요한 경우 파일 최상단에 `"use client";`를 명시합니다. (예: `src/app/stock/page.tsx`)
* API 라우트는 `src/app/api/.../route.ts` 패턴으로 작성합니다.

### 3-2. 스타일링 가이드 (Emotion)
* 컴포넌트 내부에서 인라인 스타일이나 일반 CSS 파일을 지양하고, `@emotion/styled`를 사용해 스타일 컴포넌트를 정의합니다.
* 스타일 파일 분리: 페이지 복잡도가 높아지면 `styled.ts` 파일을 따로 생성하여 스타일 컴포넌트들을 모아 분리합니다. 
  (예: `src/app/stock/styled.ts` 같이 페이지 폴더 내에 배치하거나, `/components/Component.styled.ts` 형식 사용)
* Dark Theme 지향: 주조색은 다크 네이비/블랙 계열(`rgba(15, 23, 42)`) 배경에 반투명 글래스모피즘(Glassmorphism) 효과를 통해 모던한 UI를 구성합니다.

### 3-3. 데이터 페칭 및 훅 (React Query & Custom Hooks)
* 클라이언트 사이드 데이터 페칭에는 **React Query**를 반드시 사용합니다.
* API 호출 로직은 `src/hooks` 폴더 산하에 커스텀 훅으로 묶어서 캡슐화합니다. (예: `useStockQuery.ts`)
* API 엔드포인트는 `fetch(/api/...)` 형식으로 자체 Next.js API를 호출하는 것을 표준으로 합니다.

### 3-4. 상태 관리 (Jotai)
* 복잡한 전역 상태가 필요한 경우 Context API나 Redux 대신 **Jotai** atom을 사용하여 가볍게 관리합니다.
* Atom 정의 파일들은 `src/store/` 폴더 내에 위치시킵니다.

## 4. 모범 사례 (Best Practices) & AI 작업 수칙
1. **타입 안정성 (Type Safety)**: 모든 컴포넌트, Props, API 응답은 TypeScript 인터페이스(`interface`) 또는 타입(`type`)으로 명확히 정의합니다. `any` 타입의 사용은 절대적으로 피합니다.
2. **반응형 디자인 (Responsive Design)**: Flexbox 구조(`display: flex`, `gap`, `flex-direction`)와 Grid 구조를 사용하여 데스크탑과 모바일 환경을 모두 지원할 수 있도록 설계합니다. 모바일 퍼스트(`@media(max-width: ...`) 또는 미디어 쿼리 헬퍼를 추가로 활용합니다.
3. **디자인 퀄리티 (Vibe/Aesthetics)**: "Vibe App"의 성격에 맞게 고급스럽고 우아한 Vibe를 연출해야 합니다.
   * 선명한 그라데이션, 부드러운 애니메이션(`transition`), Box Shadow 및 텍스트 섀도우를 적절히 배합합니다.
   * `Lucide React` 아이콘들을 결합하여 직관적인 UX를 챙깁니다.
4. **파일 단위 의존성 최소화**: 컴포넌트가 하나의 역할만 하게끔 작게 유지(SRP: Single Responsibility Principle)하고, 분리할 수 있는 로직은 `hooks`나 `lib`으로 옮깁니다.

---
**주의:** 본 가이드라인은 프로젝트 성장에 따라 지속적으로 업데이트 될 수 있습니다. 신규 기능 구현 전, 반드시 이 GEMINI.md의 원칙들을 준수하여 코드를 제안해주시기 바랍니다.
