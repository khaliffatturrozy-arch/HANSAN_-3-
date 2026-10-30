# HANSAN V3 — Phase 3.5 Security Report

## Controls
- Atomic outbox: events published only after transaction commit; rollback leaves no event.
- SSE auth: server-side user resolution (Supabase or dev demo fallback); deny by default.
- Tenant scoping: org/outlet membership enforced on SSE stream.
- Station isolation: kitchen/bar channels separated; role check on ticket updates.
- Event payloads minimal (no secrets/PII).

## Blocker (unchanged)
- RLS policies NOT implemented (context propagation safety).

## Risks
- Demo auth still active in dev.
- No rate limiting on SSE connections.
- No outbox cleanup (retention documented only).
- No end-to-end SSE verification.
