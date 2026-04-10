# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe App is a personal portfolio and interactive experience application built with Next.js App Router. It features invitation cards, a letter system with birthday verification, and a stock market dashboard with real-time data visualization.

## Commands

```bash
yarn dev      # Start development server (localhost:3000)
yarn build    # Build for production
yarn start    # Start production server
yarn lint     # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** `@emotion/styled` — see `.claude/rules/emotion-styling.md`
- **State:** Jotai (global atoms in `src/store/`), React Query (server state, 1min stale)
- **Charts:** Recharts, **Icons:** Lucide React
- **Stock Data:** yahoo-finance2 via `src/app/api/stock/route.ts`

## Architecture

```
src/
├── app/           # Pages and API routes (file-based routing)
├── components/    # Reusable UI components (each folder: index.tsx + styles.ts)
├── hooks/         # React Query custom hooks
├── providers/     # App-level providers (QueryProvider, EmotionRegistry)
├── store/         # Jotai atoms
├── lib/           # Utilities (Emotion SSR registry — do not modify)
├── styles/        # GlobalStyles only
└── assets/        # Static images
```

## Key Conventions

- **Path alias:** `@/*` → `./src/*` (configured in tsconfig.json)
- **Server components by default;** `"use client"` only when state/browser API needed
- **No CSS files, no inline styles** — Emotion only → `.claude/rules/emotion-styling.md`
- **Responsive design is mandatory** — 모든 스타일에 `@media (max-width: 768px)` 필수 포함, 반응형 없는 코드는 미완성으로 간주 → `.claude/rules/emotion-styling.md`
- **TypeScript rules:** no `any`, interface over type → `.claude/rules/typescript.md`
- **API route patterns:** → `.claude/rules/api-conventions.md`

## Slash Commands

- `/create-component [Name]` — 컴포넌트 + styles.ts 생성
- `/create-page [name]` — 페이지 + styled.ts 생성
- `/create-hook [name] [endpoint]` — React Query 훅 생성

## Environment Variables

Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_BIRTHDAY` - Required for letter page access verification

## Critical Files

- `src/lib/registry.tsx` - Emotion SSR cache (do not modify structure)
- `src/app/api/stock/route.ts` - Stock API with Korean name→symbol mapping
- `src/providers/QueryProvider.tsx` - React Query global config (staleTime: 60s)
