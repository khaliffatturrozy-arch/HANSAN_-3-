# HANSAN V3 — Backend Implementation Roadmap

## Phase 0 — Readiness (current)
- Audit complete. No backend exists. See BACKEND-READINESS.md.

## Phase 1 — Foundation (requires authorization)
1. Add Drizzle ORM + drizzle-kit; configure Postgres (Supabase or local).
2. Create initial schema: organizations, outlets, users, roles, sessions.
3. Implement real authentication (Supabase Auth or custom) replacing demo session.
4. Server-enforce roles in middleware and API routes.
5. Add zod validation at route boundaries.
6. Disposable dev database + seed script.

## Phase 2 — Orders
1. Schema: orders, order_items, order_events, idempotency_keys.
2. `POST /api/orders` persisted, transactional, idempotent.
3. `GET /api/orders/:id`.
4. POS UI wired to real API; keep in-memory fallback labeled as demo.

## Phase 3 — KDS
1. Schema: station_tickets (kitchen/bar), ticket_items.
2. `GET /api/kds/kitchen/tickets`, `GET /api/kds/bar/tickets`.
3. `PATCH` endpoints for status transitions (new -> preparing -> ready).
4. Kitchen/Bar UI wired to real tickets; keep demo mode labeled.
5. Real-time updates (Supabase Realtime or SSE) — optional for MVP.

## Phase 4 — HQ modules
1. Catalog, inventory, workforce, finance, etc. — one module at a time, each with schema + API + UI.
2. Each module gated by role and outlet scope.

## Phase 5 — Hardening
- Audit logging, observability, integration tests, security review, production readiness.

## Notes
- No database schemas or migrations may be created/applied without explicit authorization.
- Backend implementation is not started in this planning task.
