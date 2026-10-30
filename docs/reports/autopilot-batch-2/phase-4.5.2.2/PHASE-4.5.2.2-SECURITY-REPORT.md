# HANSAN V3 — Phase 4.5.2.2 Security Report

## Controls
- All routes enforce auth + RBAC (write: owner/admin/manager/developer).
- Tenant isolation via resolveAccess (org/outlet).
- Server-side price validation (nonnegative, Zod).
- Organization-level inactive items never sellable (filtered in getOutletCatalog).
- No client-trusted org/outlet IDs.

## Risks
- Auth demo fallback still active in dev.
- No RLS (app-layer only).
- Price override via prompt (UX, not security).
- No automated integration tests.
