# HANSAN V3 — Phase 3 Realtime Architecture

## Audit findings
- Supabase project credentials are NOT configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are empty in .env.example and .env.local).
- Supabase Auth code exists but is defensive and returns null when unconfigured.
- No Supabase Realtime client or subscription code exists in the repository.
- PostgreSQL (disposable Docker, port 5433) is available and is the authoritative data store.
- Existing order/KDS routes use polling (10s) in STAFF KDS pages.

Conclusion: Supabase Realtime is NOT available. Implementing it would require unverifiable external infrastructure.

## Selected strategy: Server-Sent Events (SSE) backed by a transactional outbox

Rationale:
- Works with the existing Next.js App Router (Route Handlers can stream via ReadableStream).
- No new external service; uses the existing PostgreSQL database.
- Authentication/authorization can be enforced server-side on the SSE connection (unlike direct DB subscriptions).
- Tenant and station isolation enforced in the handler, not client-side.
- Polling fallback retained for environments where SSE is unavailable.

## Authentication & authorization
- SSE endpoint requires a valid session (Supabase Auth in prod, demo fallback in dev).
- Scope (org, outlet, station) resolved server-side from trusted membership records.
- Only events matching the resolved scope are delivered.

## Tenant isolation
- Events carry orgId/outletId. Server filters by the authenticated user\'s memberships before delivery.
- Client-supplied scope params are validated against server-resolved membership (deny if mismatch).

## Station isolation
- Kitchen channel delivers only kitchen ticket events; Bar channel only bar ticket events.
- A station cannot subscribe to another station\'s channel.

## Event delivery guarantees
- At-least-once (SSE may reconnect and replay). Clients must be idempotent (refetch authoritative data on each event).
- Events published only after transaction commit (outbox row inserted in same transaction).
- Outbox cleanup: rows older than 24h pruned by a maintenance job (not implemented yet).

## Reconnection
- EventSource auto-reconnects. On reconnect, client refetches authoritative state before resuming event-driven updates.
- Polling fallback (10s) runs when SSE connection is closed/errored.

## Fallback
- If SSE fails or is unsupported, polling (configurable interval) continues.
- UI shows connection state: Connected / Reconnecting / Polling fallback.

## Operational dependencies
- PostgreSQL (existing).
- Next.js Route Handler streaming support.
- No Supabase Realtime dependency.

## Future upgrade path
- When Supabase project is configured, migrate to Supabase Realtime with RLS-backed channels, keeping the same event contract.
