# Lumina OS — Local Setup Guide

## System Requirements

| Tool | Version | How to install |
|------|---------|----------------|
| Node.js | 18 or higher | https://nodejs.org |
| pnpm | 10 or higher | `npm install -g pnpm` |

Check your versions:
```
node -v
pnpm -v
```

---

## Folder Structure

```
lumina-os/
├── artifacts/
│   ├── api-server/        ← Express backend (API)
│   └── yt-learning-os/    ← React frontend (UI)
├── lib/
│   ├── api-client-react/  ← Auto-generated API hooks
│   ├── api-spec/          ← OpenAPI spec + codegen
│   ├── api-zod/           ← Zod validation schemas
│   └── db/                ← Database (not required to run)
├── package.json           ← Root workspace config
├── pnpm-workspace.yaml    ← Monorepo config
└── SETUP.md               ← This file
```

---

## Step 1 — Get API Keys

You need two API keys:

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### YouTube Data API Key
1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Go to "APIs & Services" → "Library"
4. Search for "YouTube Data API v3" → click Enable
5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "API Key"
7. Copy the key

---

## Step 2 — Create Environment File

Create a file called `.env` inside `artifacts/api-server/`:

```
artifacts/api-server/.env
```

Put this content inside it (replace with your actual keys):

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=any-random-string-like-lumina-secret-2024
PORT=3001
```

---

## Step 3 — Install All Dependencies

Open a terminal in the root folder (where `package.json` is) and run:

```
pnpm install
```

This installs everything for all packages at once. It may take 1-2 minutes the first time.

---

## Step 4 — Run the App

You need **two terminals open at the same time**.

### Terminal 1 — Start the Backend (API Server)

```
pnpm --filter @workspace/api-server run dev
```

Wait until you see: `API server running on port 3001`

### Terminal 2 — Start the Frontend (Website)

```
pnpm --filter @workspace/yt-learning-os run dev
```

Wait until you see something like: `Local: http://localhost:5173/`

---

## Step 5 — Open in Browser

Go to: **http://localhost:5173**

You should see the Lumina OS home page. Paste any YouTube URL and click Analyze.

---

## All Dependencies (with exact versions)

### Root Workspace
| Package | Version |
|---------|---------|
| typescript | ~5.9.2 |
| prettier | ^3.8.1 |

### Backend (`artifacts/api-server`)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5 | Web server framework |
| cors | ^2 | Cross-origin requests |
| cookie-parser | ^1.4.7 | Cookie handling |
| openai | ^6.34.0 | OpenAI GPT-4o-mini |
| youtube-transcript | ^1.3.0 | Fetch YouTube transcripts |
| node-cache | ^5.1.2 | In-memory caching |
| pino | ^9 | Logging |
| pino-http | ^10 | HTTP request logging |
| drizzle-orm | ^0.45.1 | ORM (optional DB) |

### Backend Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @types/express | ^5.0.6 | TypeScript types |
| @types/cors | ^2.8.19 | TypeScript types |
| @types/cookie-parser | ^1.4.10 | TypeScript types |
| @types/node | ^25.3.3 | TypeScript types |
| esbuild | ^0.27.3 | Build tool |
| esbuild-plugin-pino | ^2.3.3 | Pino build plugin |
| pino-pretty | ^13 | Pretty log output |

### Frontend (`artifacts/yt-learning-os`)
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.1.0 | UI framework |
| react-dom | 19.1.0 | DOM rendering |
| vite | ^7.3.0 | Dev server + bundler |
| tailwindcss | ^4.1.14 | CSS framework |
| framer-motion | ^12.23.24 | Animations |
| wouter | ^3.3.5 | Client-side routing |
| @tanstack/react-query | ^5.90.21 | Server state management |
| lucide-react | ^0.545.0 | Icons |
| zod | ^3.25.76 | Schema validation |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Class merging |
| tailwind-merge | ^3.3.1 | Tailwind class merging |
| recharts | ^2.15.2 | Charts |
| sonner | ^2.0.7 | Toast notifications |
| date-fns | ^3.6.0 | Date utilities |
| react-hook-form | ^7.55.0 | Form handling |
| cmdk | ^1.1.1 | Command palette |
| vaul | ^1.1.2 | Drawer component |
| next-themes | ^0.4.6 | Theme switching |

### Radix UI Components (all frontend)
| Package | Version |
|---------|---------|
| @radix-ui/react-accordion | ^1.2.4 |
| @radix-ui/react-alert-dialog | ^1.1.7 |
| @radix-ui/react-dialog | ^1.1.7 |
| @radix-ui/react-dropdown-menu | ^2.1.7 |
| @radix-ui/react-select | ^2.1.7 |
| @radix-ui/react-tabs | ^1.1.4 |
| @radix-ui/react-toast | ^1.2.7 |
| @radix-ui/react-tooltip | ^1.2.0 |
| @radix-ui/react-progress | ^1.1.3 |
| @radix-ui/react-scroll-area | ^1.2.4 |
| @radix-ui/react-label | ^2.1.3 |
| @radix-ui/react-slot | ^1.2.0 |
| @radix-ui/react-separator | ^1.1.3 |
| (+ 10 more Radix packages) | |

---

## Common Issues

**"pnpm: command not found"**
→ Run: `npm install -g pnpm` then try again

**"Cannot find module" errors**
→ Make sure you ran `pnpm install` from the ROOT folder, not inside a subfolder

**Frontend shows blank/error page**
→ Make sure the backend (Terminal 1) is running first before opening the browser

**"YouTube transcript not available"**
→ Some videos disable transcripts. Try a different YouTube video (educational content works best)

**"OpenAI quota exceeded"**
→ You may have hit your API limit. Check https://platform.openai.com/usage

**Port already in use**
→ Change `PORT=3001` in the `.env` file to another number like `3002`, then also update `artifacts/yt-learning-os/vite.config.ts` proxy target to match

---

## Quick Reference Commands

| What | Command (run from root folder) |
|------|-------------------------------|
| Install all deps | `pnpm install` |
| Start backend | `pnpm --filter @workspace/api-server run dev` |
| Start frontend | `pnpm --filter @workspace/yt-learning-os run dev` |
| Build everything | `pnpm run build` |
| Typecheck everything | `pnpm run typecheck` |
