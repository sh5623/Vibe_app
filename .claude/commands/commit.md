---
allowed-tools: Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(yarn lint:*)
description: 현재 변경 사항을 분석해 한국어 커밋 메시지로 커밋
---

## Context

- 현재 브랜치: !`git branch --show-current`
- 변경 사항: !`git status`
- 스테이징된 diff: !`git diff HEAD`
- 최근 커밋: !`git log --oneline -5`

## 브랜치 보호 규칙

현재 브랜치가 `main`인 경우:
- **즉시 중단**하고 커밋하지 않는다.
- 사용자에게 다음 메시지를 출력한다: "⚠️ 현재 main 브랜치입니다. feature/ 또는 hotfix/ 브랜치를 생성 후 작업해주세요."

## 커밋 절차

브랜치가 안전한 경우에만 다음 순서로 진행한다:

1. yarn lint를 실행해 린트 오류가 없는지 확인한다. 오류가 있으면 커밋을 중단하고 사용자에게 알린다.
2. 변경된 파일을 `git add`로 스테이징한다 (민감 파일 `.env`, 시크릿 등 제외).
3. 아래 형식에 맞춰 커밋 메시지를 작성하고 `git commit`을 수행한다.

## 커밋 메시지 형식

```
type: 요약 내용 (핵심 키워드)

- 변경 상세 1 (어떤 환경/컴포넌트인지 명시)
- 변경 상세 2
- 변경 상세 3
```

**type 종류:**
- `feat` — 새 기능
- `fix` — 버그 수정
- `style` — UI/스타일 변경
- `refactor` — 코드 리팩토링
- `chore` — 빌드/설정/패키지 변경
- `docs` — 문서 변경

**규칙:**
- 모든 메시지는 **한국어**로 작성
- UI 수정 시 모바일/데스크탑 등 대상 환경을 명시
- Body는 불렛 포인트로 변경 내용을 상세히 기술
- `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` 트레일러 포함
