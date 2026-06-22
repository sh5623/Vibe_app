# CLAUDE.md

## Stack — Ground Truth (버전 고정, 추측 금지)

| Package | Version | 주의사항 |
|---------|---------|---------|
| Vite | 8.0.x | `@react-router/dev/vite` 플러그인 사용. `@vitejs/plugin-react` 별도 불필요 |
| React | 19.x | ref prop 직접 전달. `forwardRef` 금지 |
| React Router | 7.16.x | **프레임워크 모드 (SSR)**. `@react-router/dev` 사용 |
| TypeScript | 6.0.x | `strict` + `noUncheckedIndexedAccess` |
| Zod | 4.x | `z.string().email()` 금지 → `z.email()` |
| pnpm | 11.x | npm/yarn 금지 |
| Biome | 2.4.x | `biome.json`만. ESLint/Prettier 없음 |
| Tailwind | 4.3.x | `tailwind.config.js` 없음. CSS-first |
| shadcn/ui | CLI 4.x | `app/components/ui/` — 수동 수정 금지 |
| TanStack Query | 5.100.x | `isLoading` 없음 → `isPending`. SSR 패턴 사용 |
| Zustand | 5.0.x | `create()` 패턴. equality fn 2번째 인자 금지 |
| framer-motion | 12.x | 애니메이션. `motion`, `AnimatePresence` |
| Vitest | 4.1.x | `vi.fn()`. `jest.fn()` 금지 |
| RTL | 16.3.x | `@testing-library/user-event` v14 async |
| Playwright | 1.60.x | E2E 전용 |
| Recharts | 3.x | 차트 |
| Lucide React | latest | 아이콘 |

## Commands

```bash
pnpm dev          # 개발 서버 (SSR, localhost:5173)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버
pnpm check        # biome check --write + Tailwind v3 grep
pnpm typecheck    # react-router typegen && tsc --noEmit
pnpm test         # vitest run
pnpm test:e2e     # playwright test
```

## Project Overview

Vibe App — 개인 포트폴리오 + 인터랙티브 경험. RR7 프레임워크 모드로 SSR 지원.

| 라우트 | 설명 |
|--------|------|
| `/` | 홈 |
| `/fe-rail` | fe-rail 플러그인 소개 |
| `/dev` | 개발자 포트폴리오 |
| `/portfolio` | Bambi 포트폴리오 |
| `/invitation` | 초대장 |
| `/letter` | 생일 인증 + 편지 |
| `/stock` | 주식 대시보드 |
| `/otp` | OTP 뷰어 |
| `/api/stock` | 주식 데이터 API (resource route, server-only) |
| `/api/otp` | OTP API (resource route, server-only) |

## Directory Structure

```
app/                         # RR7 appDirectory (source root)
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
│   ├── api.stock.ts         # GET /api/stock (server-only resource route)
│   └── api.otp.ts           # POST /api/otp (server-only resource route)
├── components/
│   ├── ui/                  # shadcn/ui — 손대지 말 것
│   └── [Feature]/           # index.tsx 단일 파일 원칙
├── lib/
│   ├── utils.ts             # cn() from shadcn
│   └── query-client.ts      # SSR-safe QueryClient
├── store/                   # Zustand (*-store.ts)
├── hooks/                   # TanStack Query (use-*.ts)
├── schemas/                 # Zod (*.schema.ts)
├── styles/
│   └── globals.css          # @import "tailwindcss"
└── assets/                  # 정적 이미지

src/                         # 마이그레이션 중 (점진적 이전)
```

## 🔴 React Router 7 — 프레임워크 모드

```typescript
// app/routes/stock.tsx — SSR loader (Node.js 접근 가능)
import type { Route } from './+types/stock'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const symbol = url.searchParams.get('symbol') ?? 'AAPL'
  const data = await fetchStockData(symbol)  // server-side: yahoo-finance2 사용 가능
  return { data }
}

export default function StockPage({ loaderData }: Route.ComponentProps) {
  return <main>{loaderData.data.price}</main>
}

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Stock Dashboard' }]
}
```

```typescript
// app/routes/api.stock.ts — Resource route (API endpoint)
import type { Route } from './+types/api.stock'
import yahooFinance from 'yahoo-finance2'

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') ?? 'AAPL'
  const data = await yahooFinance.quote(symbol)
  return Response.json(data)
}
```

**import 규칙:**
- `react-router` → 모든 것 (hooks, Link, Form, useNavigation 등)
- `react-router-dom` → **금지** (Biome 강제)
- `RouterProvider`, `createBrowserRouter` → 프레임워크 모드에서 불필요 (금지)
- `@react-router/dev` → **허용** (빌드 필수)

**파일명 규칙:**

| 파일명 | URL |
|--------|-----|
| `home.tsx` | `/` |
| `stock.tsx` | `/stock` |
| `api.stock.ts` | `/api/stock` |
| `_auth.tsx` | 레이아웃 (URL 없음) |
| `_auth.login.tsx` | `/login` |
| `$.tsx` | 404 splat |

## 🔴 Tailwind 4 — CSS-first

```css
/* app/styles/globals.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(55% 0.2 240);
  --font-sans: "Inter", sans-serif;
}
```

```typescript
// vite.config.ts
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
export default defineConfig({ plugins: [reactRouter(), tailwindcss(), tsconfigPaths()] })
```

**금지 (grep 강제):** `tailwind.config.js` · `@tailwind` · `bg-gradient-to-*` → `bg-linear-to-*` · `flex-shrink-0` → `shrink-0`

## 🔴 Zod 4

```typescript
// ✅ v4 최상위 함수
const schema = z.object({ email: z.email(), url: z.url(), id: z.uuid() })
const result = schema.safeParse(input)
if (!result.success) {
  const errors = result.error.flatten()  // errors.fieldErrors.email → string[]
}
// ❌ 금지: z.string().email() / z.string().url() / z.string().uuid()
```

context7 문서: `/websites/zod_dev_v4`

## 🟡 TanStack Query 5 (SSR-safe)

```typescript
// app/lib/query-client.ts — SSR에서 요청별 새 QueryClient
import { isServer, QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })
}
let browserQueryClient: QueryClient | undefined
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  return (browserQueryClient ??= makeQueryClient())
}
```

**금지:** `isLoading` · `cacheTime` (→ `gcTime`) · `keepPreviousData` (→ `placeholderData`) · `onSuccess`/`onError` on `useQuery`

## 🟡 Zustand 5

```typescript
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

export const useUiStore = create<UiStore>()(
  devtools((set) => ({ isModalOpen: false, open: () => set({ isModalOpen: true }) }))
)
// 다중 셀렉터: useShallow 사용
const { isOpen, open } = useUiStore(useShallow((s) => ({ isOpen: s.isModalOpen, open: s.open })))
// ❌ 금지: useStore(selector, equalityFn) — v4 패턴
```

## 🟡 React 19

```typescript
// ✅ ref prop 직접, forwardRef 금지
function Input({ ref, ...props }: React.ComponentProps<'input'>) { return <input ref={ref} {...props} /> }
// ✅ useActionState (useFormState 금지)
const [state, action, isPending] = useActionState(formAction, null)
// ❌ React.FC 금지 / ❌ forwardRef 금지
```

## TypeScript 6 Strict

**금지 (Biome 강제):** `any` · `!` non-null assertion  
**사용:** `unknown` + type guard · `satisfies` · `interface` > `type` · `noUncheckedIndexedAccess: true`

## 상태 관리 결정

| 데이터 성격 | 사용 | 금지 |
|------------|------|------|
| 라우트 데이터 | `loader` (SSR) | TanStack Query 중복 |
| 서버 상태 캐시 | TanStack Query | Zustand에 저장 |
| 전역 UI | Zustand | Context API |
| 컴포넌트 로컬 | `useState` | 전역 store |
| 폼 | `useActionState` / `action` | controlled 남발 |

## 환경 변수

`.env.local` (Vite: `import.meta.env.*`):
- `VITE_BIRTHDAY` — `/letter` 생일 인증

## 복잡도 예산 (feature spec 명시 시 오버라이드)

- 신규 파일: ≤ 3개
- 신규 pnpm 의존성: 0개
- 컴포넌트 depth: ≤ 3단계
