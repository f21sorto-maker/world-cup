# Local development

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io) 9 via Corepack: `corepack enable && corepack prepare pnpm@9.15.4 --activate`
- **Docker Desktop running** (Postgres + Redis + Redpanda) — required for `stack:up` and `smoke:stack`
- Copy env: `cp .env.example .env.local`

> **No Docker?** You can still run the app without the stack:
> `pnpm server:dev` (HTTP-only) and `pnpm web:dev` in separate terminals.
> `pnpm smoke:stack` skips cleanly when Docker Desktop is not running.

> **Important:** Dev servers block the terminal — run each in its own tab. The last JSON log line (`server_started` + `timestamp`) means the server is **running**, not stuck.

## Startup sequence

```bash
# 1. Install
pnpm install              # runs prisma generate via prepare hook

# 2. Infrastructure (use stack:bootstrap — waits for Postgres before db:push)
pnpm stack:bootstrap

# Or step-by-step:
# pnpm stack:up && pnpm stack:wait && pnpm db:push && pnpm db:seed
# 3. Verify connectivity
pnpm verify:db

# 4. App processes (separate terminals — do not chain server + admin in one line)
pnpm server:dev           # Hono QueryAPI — http://127.0.0.1:3001 (no Redis required)
pnpm server:dev:workers   # Same + BullMQ when REDIS_URL set
pnpm web:dev              # Vite PWA — http://127.0.0.1:5173
pnpm admin:dev            # Admin console — http://127.0.0.1:5174/admin/
```

If `server:dev` reports port 3001 in use, run `pnpm server:stop` or use `PORT=3002 pnpm server:dev`.

Set `ENABLE_WORKERS=false` to force HTTP-only mode even when Redis is configured.

Vite dev serves `/api/qualification/:groupId`, `/api/events` (SSE heartbeat), and `/api/health` via middleware — no `vercel dev` required for analyst panels.

## Prisma 7

- Schema: `prisma/schema.prisma`
- CLI config: `prisma.config.ts` (DATABASE_URL)
- Generated client: `generated/prisma/` (driver adapter via `@prisma/adapter-pg`)

```bash
pnpm db:generate
pnpm db:push
```

## Admin auth

**Production:** Clerk

```bash
# .env.local
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...

# apps/admin/.env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

**Local dev fallback:** shared dev token (when Clerk keys unset)

```bash
# .env.local
DEV_ADMIN_TOKEN=dev-admin-change-me

# apps/admin/.env.local
VITE_DEV_ADMIN_TOKEN=dev-admin-change-me
```

Correction and quarantine **PUT** routes accept Clerk JWT or dev token.

## Testing

```bash
pnpm test:all            # client + packages + server
pnpm smoke:pipeline      # identity + qual (no Docker)
pnpm smoke:db            # Postgres when DATABASE_URL set
pnpm smoke:stack         # Docker + Postgres + Redis + workers + HTTP probes
pnpm verify:db           # Postgres when DATABASE_URL set
```

## SSE vs polling

When SSE connects (`/api/events`), live polling is suppressed. Disconnect or set `LIVE_DATA_FLAGS.ssePrimary = false` in [`src/config/liveDataFlags.ts`](../src/config/liveDataFlags.ts) to force polling fallback.

## Stack services

| Service   | Port  | Purpose              |
|-----------|-------|----------------------|
| Postgres  | 5432  | Canonical + snapshots |
| Redis     | 6379  | Streams + BullMQ     |
| Redpanda  | 9092  | Kafka-compatible (future) |

Compose file: [`infra/local/docker-compose.yml`](../infra/local/docker-compose.yml)
