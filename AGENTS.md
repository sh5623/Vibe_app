# AGENTS.md — Rules
# 🔒 Biome enforced  🔍 grep-check enforced

## Imports 🔒
| OK | FORBIDDEN |
|----|-----------|
| `react-router` — 모든 것 (hooks, Link, Form 등) | `react-router-dom` (패키지 전체) |
| `@react-router/dev` — 빌드 설정 전용 | `RouterProvider` / `createBrowserRouter` (프레임워크 모드 불필요) |

## Tailwind 4 🔍
```
OK:   bg-linear-to-*   shrink-0   grow-0   bg-blue-500/50   @theme {}
BAN:  bg-gradient-to-*  flex-shrink-0  flex-grow-0  tailwind.config.js  @tailwind
```

## Zod 4 (context7: /websites/zod_dev_v4)
```
OK:   z.email()   z.url()   z.uuid()   (최상위 독립 함수)
BAN:  z.string().email()   z.string().url()   z.string().uuid()
```

## TanStack Query 5
```
OK:   isPending   gcTime   placeholderData
BAN:  isLoading   cacheTime   keepPreviousData   onSuccess/onError on useQuery
```

## Zustand 5
```
OK:   useShallow(selector)
BAN:  useStore(selector, equalityFn)   ← v4 패턴
```

## React 19
```
OK:   function Comp({ ref, ...props })   useActionState
BAN:  forwardRef   React.FC   useFormState
```

## TypeScript 🔒
```
BAN:  !   any
USE:  unknown + type guard   satisfies   interface > type
```

## File Conventions
```
routes:  app/routes/*.tsx   (RR7 파일 기반)
store:   app/store/*-store.ts
hooks:   app/hooks/use-*.ts
schemas: app/schemas/*.schema.ts
ui:      app/components/ui/   ← 손대지 말 것
```
