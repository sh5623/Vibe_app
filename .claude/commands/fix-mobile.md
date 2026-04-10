---
allowed-tools: Read, Edit, Glob, Grep
description: 지정한 컴포넌트/페이지의 모바일 반응형을 진단하고 수정
argument-hint: [ComponentName or FilePath]
---

## 작업 목표

`$ARGUMENTS`로 지정된 컴포넌트 또는 페이지의 스타일 파일을 분석해 모바일 반응형이 누락된 부분을 찾고 수정한다.
인자가 없으면 현재 열려 있는 파일 또는 `src/` 전체를 대상으로 한다.

## 진단 절차

1. 대상 파일을 특정한다.
   - 인자가 컴포넌트명(예: `HeroCard`)이면 `src/components/HeroCard/styles.ts`, `src/components/HeroCard/index.tsx` 를 찾는다.
   - 인자가 페이지명(예: `stock`)이면 `src/app/stock/styled.ts` 또는 `src/app/stock/page.tsx` 를 찾는다.
   - 인자가 파일 경로면 해당 파일을 직접 읽는다.
   - 인자가 없으면 스타일 관련 파일(`styles.ts`, `styled.ts`) 전체를 스캔한다.

2. 파일을 읽고 아래 체크리스트로 반응형 문제를 진단한다.

## 반응형 체크리스트

| 항목 | 확인 기준 |
|---|---|
| `@media (max-width: 768px)` 없음 | 레이아웃에 관여하는 모든 styled 컴포넌트에 필수 |
| 고정 px 너비 | `width: 400px` 같은 고정값 → `max-width` 또는 `%` / `vw`로 변경 |
| 고정 폰트 크기 | 모바일에서 `font-size` 미조정 → `@media` 내 0.75~0.85배 축소 |
| flex 방향 미변환 | `flex-direction: row` 고정 → 모바일에서 `column`으로 전환 |
| 다중 컬럼 그리드 | 모바일에서 `grid-template-columns: 1fr` 미적용 |
| 과도한 패딩/마진 | 모바일에서 50~60% 수준으로 미축소 |
| overflow 미처리 | 가로 스크롤 발생 가능성 → `overflow-x: hidden` 또는 레이아웃 조정 |

## 수정 규칙

- **기존 데스크탑 스타일은 절대 변경하지 않는다.** 반응형 블록만 추가한다.
- 미디어쿼리 순서: `@media (max-width: 768px)` 먼저, `@media (max-width: 480px)` 필요 시 추가.
- `@emotion/styled` 패턴만 사용한다. 인라인 `style` prop 금지.
- 색상·테마는 건드리지 않는다.

## 출력 형식

수정 전 진단 결과를 먼저 출력한다:

```
[진단] ComponentName
- ❌ @media (max-width: 768px) 누락: Wrapper, Title
- ❌ 고정 너비: Container (width: 600px)
- ✅ flex 방향: 이미 적용됨
```

그 다음 파일을 수정하고, 수정한 항목만 요약한다.
