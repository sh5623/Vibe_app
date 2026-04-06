# Create Page

Create a new Next.js App Router page following Vibe App conventions.

## Usage

```
/create-page [page-name] [description]
```

## What to create

### `src/app/[page-name]/page.tsx`

```typescript
// 기본값은 Server Component
// 클라이언트 상태가 필요한 경우: 상단에 'use client' 추가

import { Container } from './styled';

export default function [PageName]Page() {
  return (
    <Container>
      {/* 페이지 내용 */}
    </Container>
  );
}
```

### `src/app/[page-name]/styled.ts`

```typescript
import styled from '@emotion/styled';

export const Container = styled.div`
  min-height: 100vh;
  background-color: #0b1120;
  color: #ffffff;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;
```

## 페이지에 API 데이터가 필요한 경우

세 단계로 생성합니다:

1. **API 라우트:** `src/app/api/[page-name]/route.ts`
2. **React Query 훅:** `src/hooks/use[PageName]Query.ts`
3. **페이지:** `page.tsx` 상단에 `'use client'` 추가 후 훅 사용

자세한 훅 생성 가이드는 `/create-hook` 참조.

## Checklist

- [ ] `styled.ts`에 `Container` 기본 다크 배경 포함
- [ ] 데이터 없으면 Server Component 유지 (`"use client"` 제거)
- [ ] 모바일 반응형 포함
- [ ] `src/app/page.tsx`의 HomeCard 네비게이션 추가 여부 검토
