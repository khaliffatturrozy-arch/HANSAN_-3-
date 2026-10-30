# HANSAN V3 — Backend Readiness

## Current backend state
- No database, schema, or migration files exist in the repository.
- No ORM (Prisma/Drizzle) installed.
- `@supabase/ssr` and `@supabase/supabase-js` are declared in all three package.json files but are unused in source code.
- Environment placeholders include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`.
- Existing server code: demo HMAC session (`src/server/session.ts`), authz (`src/server/authz.ts`), environment config (`src/config/environment.ts`), middleware (`src/middleware.ts`).
- Existing API routes: `/api/health`, `/api/auth/sign-in` (demo), POS `/api/orders` (in-memory idempotent).

Conclusion: no production backend exists. All persistence is in-memory or absent.

## Proposed architecture (compatible with existing stack)
- Keep Next.js 14 App Router with Route Handlers (`src/app/api/*`) per app, or consolidate into a shared API package later.
- Database: PostgreSQL via Supabase (env vars already present) or any Postgres. Use a lightweight ORM (Drizzle recommended for type-safety and small footprint) — to be added during implementation, not now.
- Auth: replace demo HMAC session with real authentication. Options: Supabase Auth (already a dependency) or a custom user table + session. Recommendation: Supabase Auth for speed, with role claims mapped to `DevRole`.
- Tenancy: `organizations` -> `outlets` -> `users`. Every business record carries `organization_id` and `outlet_id`.
- API validation: zod (to be added) at route boundaries.
- Idempotency: reuse the POS `idempotencyKey` pattern; persist keys in a table with TTL.
- Realtime: Supabase Realtime or Server-Sent Events for KDS ticket updates; not required for initial MVP.
- Audit logging: append-only `audit_log` table for state transitions (order status, KDS actions, auth events).
- Error handling: structured error responses (already shaped as `{ ok, error: { code, message } }`).
- Observability: request logging and error reporting (to be chosen during implementation).
- Test strategy: Vitest for unit/integration, disposable Postgres (Docker or Supabase local) for integration tests; no production DB access.

## Security notes
- Demo password `hansan-dev` and dev session secret must never be used in production.
- Client-side route hiding is not authorization; server must enforce roles (already structured via `workspaceAllowed`).
- `SESSION_SECRET` must be required in production (middleware already fail-closes for API when unconfigured).
