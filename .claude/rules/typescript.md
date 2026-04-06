# TypeScript Conventions

## 기본 원칙

- `strict: true` 모드 (tsconfig.json에 설정됨) — 절대 우회 금지
- `any` 타입 사용 절대 금지 (기존 코드의 `any` 발견 시 리팩토링 대상으로 표시)
- 외부 라이브러리 타입이 없는 경우에만 `unknown` + type guard 사용

> **예외:** `src/app/api/stock/route.ts`의 yahoo-finance2 응답 타입은 라이브러리 타입이 불완전하여
> 의도적으로 `any`를 사용 중. 새 코드에서는 이 패턴을 따르지 말 것.

## 컴포넌트 Props 패턴

```typescript
// interface 사용 (type 대신 interface 선호 — 확장성)
interface MyComponentProps {
  title: string;
  onClick: () => void;
  children?: React.ReactNode;
}

export const MyComponent = ({ title, onClick, children }: MyComponentProps) => {
  // ...
};
```

## API 응답 타입 정의

API 훅 파일 내부에서 response shape을 interface로 정의합니다:

```typescript
// src/hooks/useStockQuery.ts 패턴 참조
interface Quote {
  price: number;
  change: number;
  changePercent: number;
  name: string;
}

interface StockData {
  symbol: string;
  isFallback?: boolean;
  quote: Quote;
  history: HistoryPoint[];
}
```

## Jotai Atom 타입

```typescript
// src/store/atoms.ts
import { atom } from 'jotai';

// 타입 추론이 가능한 경우: 명시 생략 가능
export const countAtom = atom(0);

// 복잡한 타입: 명시적 제네릭 사용
export const selectedStockAtom = atom<string | null>(null);
```

## import 순서

1. React core (`react`, `react-dom`)
2. Next.js (`next/navigation`, `next/server` 등)
3. 외부 라이브러리 (alphabetical)
4. 내부 컴포넌트 (`@/components/...`)
5. 내부 훅 (`@/hooks/...`)
6. 내부 스토어 (`@/store/...`)
7. 스타일 파일 (`./styles`, `./styled`)

## 금지 패턴

```typescript
// 금지: any cast
const data = response as any;

// 권장: 타입 assertion (API 타입이 명확히 정의된 경우만)
const data = response as StockData;

// 금지: 타입 없는 함수 파라미터
function process(data) { ... }

// 권장: 명시적 타입
function process(data: StockData) { ... }
```
