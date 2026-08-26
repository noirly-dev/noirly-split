# Noirly Split

Group expense splitting for friends, roommates, and trip parties. Part of the Noirly product suite.

## Stack

- Next.js App Router (port **3005**)
- Auth.js v5 → Noirly Identity OIDC
- MongoDB + Mongoose
- `@noirly-dev/realtime-client` for live sync
- TanStack Query + Zustand
- Editorial design tokens (shared with Flow / Identity)

Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Setup

```bash
pnpm install
cp .env.example .env.local
# fill AUTH_*, MONGODB_URI, REALTIME_* (see below)
pnpm dev
```

### Identity client registration

Register a confidential OIDC client named `noirly-split` in Noirly Identity (admin `/clients` or `npm run client:register` in `noirly-identity`), then set:

- `AUTH_NOIRLY_ISSUER` (default `http://localhost:3000`)
- `AUTH_NOIRLY_CLIENT_ID`
- `AUTH_NOIRLY_CLIENT_SECRET`
- `AUTH_SECRET` (any long random string)
- `NEXT_PUBLIC_IDENTITY_URL`

Redirect URI should include `http://localhost:3005/api/auth/callback/noirly`.

### MongoDB

Point `MONGODB_URI` at a database named `noirly-split` (or Atlas URI; the app forces `noirly-split` when the path is empty/`test`).

### Realtime (optional for Groups foundation)

Share `REALTIME_JWT_SECRET` with the noirly-realtime process. Set `NEXT_PUBLIC_REALTIME_WS_URL=ws://127.0.0.1:4001/ws` and `REALTIME_INTERNAL_URL=http://127.0.0.1:4001`.

Without realtime env, the app still runs; group channel subscribe is skipped.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on :3005 |
| `pnpm test` | Vitest (core money/splits/balances) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |

## Current slice

Full product surface except mobile: splits (equal/unequal/%/shares), multi-payer, receipts, recurrence, notifications, dashboard balances, reports, leave/archive, presence, Venmo settle links, and `@noirly-dev/split-core` workspace package.
