# API Route Conventions

## 파일 구조

```
src/app/api/
└── [기능명]/
    └── route.ts    # GET, POST 등 HTTP 메서드 함수 export
```

## 응답 패턴

```typescript
import { NextResponse } from 'next/server';

// 성공
return NextResponse.json({ data });

// 에러
return NextResponse.json({ error: error.message }, { status: 500 });
```

## 클라이언트에서 API 호출

자체 API 엔드포인트는 항상 `/api/...` 경로로 호출합니다 (직접 외부 API 호출 금지):

```typescript
// 올바른 패턴 (useStockQuery.ts 참조)
const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);

// 금지: 클라이언트에서 외부 API 직접 호출
const res = await fetch('https://query2.finance.yahoo.com/...');
```

## 한글 종목명 매핑 패턴

`src/app/api/stock/route.ts`의 `koreanMap` 패턴을 참조합니다.
새로운 한글 → 코드 매핑이 필요한 경우 해당 Map에 추가합니다:

```typescript
const koreanMap: Record<string, string> = {
  '삼성전자': '005930.KS',
  // lowercase key 사용 (입력값은 .toLowerCase()로 정규화)
};
const mappedSymbol = koreanMap[input.trim().toLowerCase()];
```

## 에러 폴백 패턴

Yahoo Finance 데이터 미비 종목에 대한 폴백 처리는 `stock/route.ts`의 패턴을 따릅니다:
- 폴백 데이터 사용 시 응답에 `isFallback: true` 필드 포함
- 클라이언트에서 `isFallback` 체크하여 사용자에게 적절한 안내 표시

## React Query 훅 표준

```typescript
// src/hooks/use[기능]Query.ts
export const use기능Query = (param: string) => {
  return useQuery({
    queryKey: ['기능명', param],
    queryFn: () => fetch기능Data(param),
    // staleTime은 QueryProvider의 defaultOptions에서 60s로 전역 설정됨
    // 특별한 경우만 개별 override
  });
};
```

## queryKey 네이밍 규칙

- 단일 리소스: `['리소스명', id]`
- 파라미터 복수: `['리소스명', param1, param2]`
- 목록: `['리소스명', 'list']`
