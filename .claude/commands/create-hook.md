# Create Hook

Create a new React Query custom hook following Vibe App conventions.

## Usage

```
/create-hook [hookName] [api-endpoint] [description]
```

## What to create

### `src/hooks/use[HookName]Query.ts`

```typescript
import { useQuery } from '@tanstack/react-query';

// 1. 응답 타입 정의 (any 금지)
interface [DataType] {
  // API 응답 필드 정의
}

interface HistoryPoint {
  date: string;
  value: number;
}

// 2. fetch 함수 (순수 async 함수, 컴포넌트 외부)
const fetch[Data] = async (param: string): Promise<[DataType]> => {
  const res = await fetch(`/api/[endpoint]?param=${encodeURIComponent(param)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch [data]');
  }
  return res.json();
};

// 3. 훅 export
export const use[HookName]Query = (param: string) => {
  return useQuery({
    queryKey: ['[hookName]', param],
    queryFn: () => fetch[Data](param),
    // staleTime: QueryProvider 전역 설정 (60s) 사용
    // 즉각 업데이트: staleTime: 0
    // 변경 빈도 낮음: staleTime: 5 * 60 * 1000
  });
};
```

## queryKey 네이밍 규칙

- 단일 리소스: `['리소스명', id]`
- 파라미터 복수: `['리소스명', param1, param2]`
- 목록: `['리소스명', 'list']`

## Checklist

- [ ] 응답 타입 `interface`로 명확히 정의 (`any` 없음)
- [ ] `fetch` 함수 훅 외부에 분리
- [ ] `queryKey` 배열에 모든 의존 파라미터 포함
- [ ] `!res.ok` 체크 후 `throw new Error()` 에러 처리
- [ ] 파일명: `use[HookName]Query.ts` (camelCase)
