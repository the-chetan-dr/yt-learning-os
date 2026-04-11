# AI YouTube Learning OS — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack AI-powered YouTube learning platform.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (available but not actively used — AI features use in-memory cache)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **`artifacts/yt-learning-os`** — React + Vite frontend, served at `/`
- **`artifacts/api-server`** — Express backend, served at `/api`

## Key Features

- Universal YouTube URL parser (all formats)
- Video metadata via YouTube Data API v3
- Transcript fetching via youtube-transcript package with chunking
- In-memory transcript cache (NodeCache, 1hr TTL)
- AI chat with context retrieval (keyword relevance scoring)
- Auto-summarization (short, detailed, key takeaways)
- Notes generation (short, bullet, detailed styles)
- MCQ Quiz generation from transcript
- "I'm Stuck" mode with simple explanation + analogy
- YouTube recommendations via Data API
- Progress tracking with localStorage (streak, videos watched, time)
- Multi-language support: English, Hindi, Spanish
- Dark glassmorphic UI with Framer Motion animations

## Environment Secrets Required

- `OPENAI_API_KEY` — OpenAI GPT-4o-mini for all AI features
- `YOUTUBE_API_KEY` — YouTube Data API v3 for metadata + recommendations

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/yt-learning-os run dev` — run frontend locally

## Architecture

### API Routes
- `GET /api/video/info?videoId=` — fetch metadata + transcript chunks
- `POST /api/ai/chat` — context-aware Q&A
- `POST /api/ai/summarize` — generate summary
- `POST /api/ai/notes` — generate notes
- `POST /api/ai/quiz` — generate MCQ quiz
- `POST /api/ai/stuck` — "I'm Stuck" explanation
- `GET /api/video/recommendations?videoId=` — related video recommendations

### Frontend Pages
- `/` — Home with URL input and recent sessions
- `/learn/:videoId` — Full learning workspace (video + AI panel)
