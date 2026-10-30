# HANSAN V3 — Phase 2 Security Report

## Controls
- Zod validation on order creation and ticket status updates.
- Idempotency key prevents duplicate submissions.
- Server-derived monetary totals (client prices not trusted for totals; price snapshot stored).
- Transactional multi-table writes.
- Station isolation: ticket PATCH updates only the specified ticket; order status derived from all tickets.
- Cancel rules: cancelled/ready orders not cancellable.

## Risks
- Auth is demo fallback in dev; production requires Supabase Auth + real membership.
- No org/outlet authorization enforced on order routes yet (demo org by slug).
- No RLS (app-layer only).
- No rate limiting.
- Client-supplied prices are stored as snapshots (acceptable for demo; production should reference catalog).
