# HANSAN V3 — Phase 4.5.1 Security Report

## Controls
- Dashboard endpoint resolves user via Supabase Auth (or dev demo fallback).
- Tenant isolation: only authorized outlets included (resolveUserContext + filter).
- RBAC: owner/admin/manager/developer required.
- No client-trusted org/outlet IDs (resolved server-side).
- Revenue not fabricated (shown as unavailable).
- No cross-tenant data exposure.

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- Aggregations fetch orders into memory (acceptable for current scale; optimize with DB aggregation later).
- No rate limiting on dashboard endpoint.
