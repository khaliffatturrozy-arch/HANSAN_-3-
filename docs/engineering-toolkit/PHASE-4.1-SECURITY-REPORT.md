# HANSAN V3 — Phase 4.1 Security Report

## Controls
- Order list/detail/cancel endpoints enforce org/outlet membership + role via resolveAccess.
- Cancel restricted to owner/admin/manager.
- Cancellation requires reason (Zod validated) and rejects cancelled/ready orders.
- Audit logging on cancellation (recordAudit).
- SSE refresh uses existing authorized endpoint (org-scoped).
- No client-trusted tenant IDs (resolved server-side).

## Risks
- Auth is demo fallback in dev; production requires Supabase Auth.
- No RLS (app-layer only).
- No rate limiting.
