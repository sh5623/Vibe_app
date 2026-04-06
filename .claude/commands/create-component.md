# Create Component

Create a new reusable UI component following Vibe App conventions.

## Usage

```
/create-component [ComponentName] [description]
```

## What to create

Given `ComponentName`, create the following files:

### `src/components/[ComponentName]/index.tsx`

```typescript
'use client'; // 상태나 이벤트 핸들러가 있는 경우만 포함

import { Wrapper } from './styles';

interface [ComponentName]Props {
  // props 정의
}

export const [ComponentName] = ({ ... }: [ComponentName]Props) => {
  return (
    <Wrapper>
      {/* 컴포넌트 내용 */}
    </Wrapper>
  );
};
```

### `src/components/[ComponentName]/styles.ts`

```typescript
import styled from '@emotion/styled';

export const Wrapper = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;
```

## Checklist

- [ ] Props에 `any` 타입 없음
- [ ] 스타일은 모두 `@emotion/styled` 사용 (인라인 `style` prop 없음)
- [ ] 상태/이벤트 없으면 `"use client"` 제거 (Server Component 유지)
- [ ] 색상은 다크 테마 팔레트 준수 (`.claude/rules/emotion-styling.md` 참조)
- [ ] 반응형 미디어쿼리 포함 (`@media (max-width: 768px)`)
- [ ] Props interface 정의 완료
