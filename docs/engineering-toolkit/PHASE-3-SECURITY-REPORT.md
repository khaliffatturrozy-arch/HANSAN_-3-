# HANSAN V3 — Phase 3 Security Report

## Controls
- SSE endpoint resolves org/outlet server-side; client-supplied scope params are validated against DB (org lookup by slug).
- Events carry only minimal metadata (id, type, version, orgId, outletId, orderId, station, timestamp). No secrets or PII.
- Event payloads are not trusted as authorization proof; clients refetch authoritative data via authenticated API.
- Authorization on mutations remains server-side (Phase 2.5).

## Risks
- SSE connection is not authenticated via Supabase (demo fallback in dev); production requires auth.
- No RLS; app-layer isolation only.
- SSE streams are long-lived connections; connection limits not configured.
- Outbox rows not cleaned up (retention job missing).
