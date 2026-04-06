# Emotion Styling Rules

## 절대 금지

- `style={{ }}` 인라인 스타일 사용 (단, Recharts 내부 props 제외)
- `.css`, `.module.css` 파일 생성
- `@emotion/css`의 `css()` 함수를 컴포넌트 외부에서 직접 사용

## 필수 패턴

**1. 모든 스타일은 `@emotion/styled`로 정의**

```typescript
// src/components/MyComponent/styles.ts
import styled from '@emotion/styled';

export const Wrapper = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
`;
```

**2. 파일 분리 기준**

- 단순 컴포넌트 (styled 컴포넌트 3개 이하): `index.tsx` 내부에 직접 작성 가능
- 중간 복잡도: `ComponentName/styles.ts` 에 분리 (HomeCard 패턴)
- 페이지 레벨: `app/페이지명/styled.ts` 에 분리 (stock/styled.ts 패턴)

**3. 다크 테마 색상 팔레트 (반드시 준수)**

```
배경 베이스:    #0b1120 (다크 네이비)
카드 배경:      rgba(15, 23, 42, 0.6)
카드 테두리:    rgba(59, 130, 246, 0.3)
기본 텍스트:    #ffffff
서브 텍스트:    #f1f5f9, #94a3b8
포인트(상승):   #34d399 (네온 그린)
포인트(하락):   #ef4444 (레드)
포인트(중립):   #60a5fa (블루)
```

**4. 글래스모피즘 카드 표준 패턴**

```typescript
export const GlassCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;
```

**5. 반응형 미디어쿼리**

모바일 퍼스트 기준점:
- `@media (max-width: 768px)` — 태블릿/모바일 분기
- `@media (max-width: 480px)` — 소형 모바일
- `@media (min-width: 1024px)` — 데스크탑 전용

**6. 애니메이션 표준**

```typescript
// hover 전환 표준
transition: all 0.2s ease;

// hover 상승 효과
&:hover {
  transform: translateY(-2px);
}
```

## 예외 사항

- Recharts `<LineChart>` 등 외부 차트 라이브러리의 `style` prop: 허용
- `src/app/api/stock/route.ts`처럼 스타일이 없는 서버 파일: 해당 없음
