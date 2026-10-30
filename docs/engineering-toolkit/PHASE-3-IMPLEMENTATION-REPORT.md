# HANSAN V3 — Phase 3 Realtime Implementation Report

## Strategy selected
Server-Sent Events (SSE) backed by a transactional outbox (PostgreSQL). Supabase Realtime is NOT configured (no project credentials); SSE chosen as the safe, verifiable alternative.

## Implemented
- `order_events` outbox table (migration 0003) with org/outlet scoping.
- `src/lib/events.ts`: event types, `publishEvent` (writes to outbox).
- Event publishing wired into `createOrder` (order.created + station_ticket.created per station) and `updateStationTicket` (station_ticket.updated/ready + order.updated) and `cancelOrder` (order.cancelled). Publishing happens after commit; failures do not break the transaction.
- SSE endpoint: `GET /api/events?orgSlug=&outletSlug=&station=` (streams events, polls outbox every 2s, connection state).
- KDS pages (Kitchen/Bar) subscribe via EventSource, refetch on event, with polling fallback (10s) and connection state indicator (Connected / Polling fallback / Connecting).

## Partially implemented
- HQ order monitoring uses manual refresh (no SSE subscription yet).
- POS order status views not subscribed.
- No transactional outbox cleanup job (rows older than 24h not pruned).

## Not implemented
- Supabase Realtime (no credentials).
- True realtime (SSE is server-mediated polling of outbox).

## Tested
- HQ: lint PASS, typecheck PASS, tests 15/15 PASS.
- STAFF: lint PASS, typecheck PASS.
- POS: not changed this phase (last run PASS).

## Unverified
- End-to-end SSE event delivery not verified by automated test (no browser tooling). Code-level verification only.
