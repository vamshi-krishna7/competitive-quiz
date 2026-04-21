# Competitive Math Quiz

Monorepo: Next.js frontend + Socket.IO WS server.

## Layout
- `web/` — Next.js 14 (App Router, TS, Tailwind)
- `server/` — Node + Express + Socket.IO

## Run locally

```bash
# terminal 1 — WS server
cd server
npm install
npm run dev          # :5030

# terminal 2 — Next.js
cd web
cp .env.local.example .env.local
npm install
npm run dev          # :3030
```

Open http://localhost:3030 in two browsers/tabs, enter different usernames, and race.

## v1 notes
- In-memory state (single process). Node's event loop serializes submissions → first correct answer wins atomically.
- To scale horizontally: swap in Redis `SET NX` for winner detection and Postgres for the leaderboard. Game engine API stays the same.

## Deploy
- `web/` → Vercel (set `NEXT_PUBLIC_WS_URL`)
- `server/` → Railway / Fly / Render (set `CORS_ORIGIN` to Vercel URL)
