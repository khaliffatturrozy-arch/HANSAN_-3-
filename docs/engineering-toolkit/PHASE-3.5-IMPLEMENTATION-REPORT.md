# HANSAN V3 — Phase 3.5 Implementation Report

## Implemented
- Transactional outbox: order_events inserts now occur INSIDE the business transaction (createOrder, updateStationTicket, cancelOrder). Atomicity guaranteed.
- SSE endpoint hardened (auth + tenant + station scoping).
- KDS polling fallback retained with cleanup.
- Event types and publish function in src/lib/events.ts.
- Retention strategy documented (manual prune, configurable period, bounded deletes) — no always-running worker.

## Partially implemented
- SSE end-to-end not verified (no browser tooling).
- Event schema validation not covered by automated tests.
- Outbox cleanup function not implemented (documented only).

## Not implemented
- Supabase Realtime (no credentials).
- RLS (blocked).

## Tested
- HQ: lint PASS, typecheck PASS, tests 15/15 PASS.
- POS: lint/typecheck PASS, tests 3/3 PASS.
- STAFF: lint/typecheck PASS.
