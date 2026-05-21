# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe App is a personal portfolio and interactive experience built with Next.js App Router.
Pages: fe-rail plugin landing (`/fe-rail`), developer portfolio (`/dev`), Bambi portfolio (`/portfolio`), invitation card (`/invitation`), letter with birthday verification (`/letter`), stock dashboard (`/stock`).

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
- **Styling:** `@emotion/styled` (CSS-in-JS, SSR 지원)
- **State:** Jotai (global atoms in `src/store/`), React Query (server state, 1min stale)
- **Animation:** framer-motion (motion, AnimatePresence, whileInView)
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
- **No CSS files, no inline styles** — Emotion only
- **Responsive design is mandatory** — 모든 스타일에 `@media (max-width: 768px)` 필수 포함, 반응형 없는 코드는 미완성으로 간주
- **TypeScript rules:** no `any`, interface over type

## Environment Variables

Create `.env.local` in project root with:
- `NEXT_PUBLIC_BIRTHDAY` — Required for `/letter` page access verification (used in `src/app/page.tsx`)

## Critical Files

- `src/lib/registry.tsx` - Emotion SSR cache (do not modify structure)
- `src/app/api/stock/route.ts` - Stock API with Korean name→symbol mapping
- `src/providers/QueryProvider.tsx` - React Query global config (staleTime: 60s)
